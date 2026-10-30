import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * 解析 Meting 音频地址的最终可达 URL。
 *
 * 背景：Meting 的 type=url 返回 302，最终会跳到网易 CDN 的 **http://** 地址。
 * HTTPS 页面上的 <audio> 会把这条 https→http 跳转链当混合内容拦截（net::ERR_FAILED），
 * APlayer 随即报错自动切歌，表现成“加载歌词但不播放、歌曲不停轮换”。
 * 浏览器端 fetch 读不到跳转 Location（跨域 + music.163.com 无 CORS），只能在服务端解析。
 */

const ALLOWED_HOSTS = new Set(["meting.20091010.xyz", "meting.20100907.xyz", "music.163.com"]);
const ALLOWED_SUFFIXES = [".music.126.net", ".music.163.com"];

function isAllowedUrl(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(host) || ALLOWED_SUFFIXES.some((s) => host.endsWith(s))) {
    return u;
  }
  return null;
}

const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** 逐跳跟重定向，不拉取响应体；每一跳都过白名单，防跳转型 SSRF。 */
async function resolveAudioUrl(raw: string): Promise<string> {
  let current = isAllowedUrl(raw);
  if (!current) throw new Error("URL not allowed");

  for (let redirects = 0; ; redirects += 1) {
    const res = await fetch(current.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    // 这里只需要状态和 Location，立即取消未使用的响应体，避免占用连接。
    await res.body?.cancel?.();
    if (!REDIRECT_STATUSES.has(res.status)) {
      // CDN 对 https 一视同仁，把 http 强升为 https 即可绕过混合内容拦截
      return current.toString().replace(/^http:\/\//i, "https://");
    }

    const loc = res.headers.get("location");
    if (!loc) throw new Error("redirect response missing Location");
    if (redirects >= MAX_REDIRECTS) throw new Error("too many redirects");

    const next = isAllowedUrl(new URL(loc, current).toString());
    if (!next) throw new Error("redirect target not allowed");
    current = next;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const raw = typeof req.query.url === "string" ? req.query.url : "";
  if (!raw) {
    return res.status(400).json({ error: "missing url" });
  }

  try {
    const url = await resolveAudioUrl(raw);
    // 签名 URL 会轮换，只做短缓存
    res.setHeader("Cache-Control", "public, max-age=30");
    return res.status(200).json({ url });
  } catch (error) {
    console.error("resolve music url failed:", error);
    return res.status(502).json({ error: "resolve failed" });
  }
}
