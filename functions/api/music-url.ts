/**
 * 解析 Meting 音频地址的最终可达 URL（Cloudflare Pages Functions）。
 * 与 api/music-url.ts 保持同一口径，改一处请同步另一处。
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

/** 逐跳跟 302，不拉取响应体；每一跳都过白名单，防跳转型 SSRF。 */
async function resolveAudioUrl(raw: string): Promise<string> {
  let current = isAllowedUrl(raw);
  if (!current) throw new Error("URL not allowed");

  for (let i = 0; i < 5; i++) {
    const res = await fetch(current.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      const next = isAllowedUrl(new URL(loc, current).toString());
      if (!next) throw new Error("redirect target not allowed");
      current = next;
      continue;
    }
    break;
  }
  // CDN 对 https 一视同仁，把 http 强升为 https 即可绕过混合内容拦截
  return current.toString().replace(/^http:\/\//i, "https://");
}

export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const raw = url.searchParams.get("url") || "";

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=30",
    "Access-Control-Allow-Origin": "*",
  };

  if (!raw) {
    return new Response(JSON.stringify({ error: "missing url" }), { status: 400, headers });
  }

  try {
    const resolved = await resolveAudioUrl(raw);
    return new Response(JSON.stringify({ url: resolved }), { status: 200, headers });
  } catch (error) {
    console.error("resolve music url failed:", error);
    return new Response(JSON.stringify({ error: "resolve failed" }), { status: 502, headers });
  }
}
