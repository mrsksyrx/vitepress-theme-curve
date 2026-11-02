/**
 * 解析 Meting 音频地址的最终可达 URL（Cloudflare Pages Functions）。
 * 与 api/music-url.ts 保持同一口径，改一处请同步另一处。
 *
 * 背景：Meting 的 type=url 返回 302，最终会跳到网易 CDN 的 **http://** 地址。
 * HTTPS 页面上的 <audio> 会把这条 https→http 跳转链当混合内容拦截（net::ERR_FAILED），
 * APlayer 随即报错自动切歌，表现成“加载歌词但不播放、歌曲不停轮换”。
 *
 * Vercel 海外出口访问 music.163.com/song/media/outer/url 时可能被网易重定向到
 * /404，导致旧的纯重定向解析器把 HTML 页面当音频返回。网易歌曲优先改走
 * /api/song/enhance/player/url 直接取得 CDN 地址，再将 http 强升为 https。
 */

const ALLOWED_HOSTS = new Set(["meting.20091010.xyz", "meting.20100907.xyz", "music.163.com"]);
const ALLOWED_SUFFIXES = [".music.126.net", ".music.163.com"];
const NETEASE_SONG_API = "https://music.163.com/api/song/enhance/player/url";
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

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

function isNetease404(u: URL): boolean {
  return u.hostname.toLowerCase() === "music.163.com" && u.pathname.replace(/\/+$/, "") === "/404";
}

function normalizeAudioUrl(u: URL): string {
  // CDN 对 https 一视同仁，把 http 强升为 https 即可绕过混合内容拦截。
  return u.toString().replace(/^http:\/\//i, "https://");
}

function getNeteaseSongId(u: URL, upstreamServer: string): string | null {
  const isOuterUrl =
    u.hostname.toLowerCase() === "music.163.com" && u.pathname === "/song/media/outer/url";
  const isMetingUrl = upstreamServer === "netease" && u.searchParams.get("type") === "url";
  if (!isOuterUrl && !isMetingUrl) return null;
  const rawId = u.searchParams.get("id") || "";
  const id = rawId.replace(/\.mp3$/i, "").trim();
  return /^\d+$/.test(id) ? id : null;
}

async function resolveNeteaseAudioUrl(songId: string): Promise<string | null> {
  const endpoint = new URL(NETEASE_SONG_API);
  endpoint.searchParams.set("ids", `[${songId}]`);
  endpoint.searchParams.set("br", "320000");

  const res = await fetch(endpoint, {
    method: "GET",
    signal: AbortSignal.timeout(5000),
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://music.163.com/",
    },
  });
  if (!res.ok) return null;

  const payload = (await res.json()) as { data?: Array<{ code?: number; url?: string | null }> };
  const song = payload.data?.find((item) => String(item.code) === "200" && item.url);
  const resolved = song?.url ? isAllowedUrl(song.url) : null;
  if (!resolved || isNetease404(resolved)) return null;
  return normalizeAudioUrl(resolved);
}

/** 逐跳跟重定向，不拉取响应体；每一跳都过白名单，防跳转型 SSRF。 */
async function resolveAudioUrl(raw: string, upstreamServer = ""): Promise<string> {
  let current = isAllowedUrl(raw);
  if (!current) throw new Error("URL not allowed");
  if (isNetease404(current)) throw new Error("upstream returned music.163.com/404");

  const directSongId = getNeteaseSongId(current, upstreamServer);
  if (directSongId) {
    const resolved = await resolveNeteaseAudioUrl(directSongId);
    if (resolved) return resolved;
  }

  for (let redirects = 0; ; redirects += 1) {
    const res = await fetch(current.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://music.163.com/",
      },
    });
    // 这里只需要状态和 Location，立即取消未使用的响应体，避免占用连接。
    await res.body?.cancel?.();

    if (!REDIRECT_STATUSES.has(res.status)) {
      if (!res.ok) throw new Error(`upstream status ${res.status}`);
      if (isNetease404(current)) throw new Error("upstream returned music.163.com/404");
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("upstream returned HTML instead of audio");
      }
      return normalizeAudioUrl(current);
    }

    const loc = res.headers.get("location");
    if (!loc) throw new Error("redirect response missing Location");
    if (redirects >= MAX_REDIRECTS) throw new Error("too many redirects");

    const next = isAllowedUrl(new URL(loc, current).toString());
    if (!next) throw new Error("redirect target not allowed");
    if (isNetease404(next)) throw new Error("upstream redirected to music.163.com/404");

    const nextSongId = getNeteaseSongId(next, upstreamServer);
    if (nextSongId) {
      const resolved = await resolveNeteaseAudioUrl(nextSongId);
      if (resolved) return resolved;
    }
    current = next;
  }
}

export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const raw = url.searchParams.get("url") || "";
  const upstreamServer = url.searchParams.get("server") || "";

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=30",
    "Access-Control-Allow-Origin": "*",
  };

  if (!raw) {
    return new Response(JSON.stringify({ error: "missing url" }), { status: 400, headers });
  }

  try {
    const resolved = await resolveAudioUrl(raw, upstreamServer);
    return new Response(JSON.stringify({ url: resolved }), { status: 200, headers });
  } catch (error) {
    console.error("resolve music url failed:", error);
    return new Response(JSON.stringify({ error: "resolve failed" }), { status: 502, headers });
  }
}
