/**
 * 站点访问计数（不蒜子降级数据源，Cloudflare Pages Functions）。
 * 与 api/visit.ts 保持同一口径，改一处请同步另一处。
 * 一次 GET 同时完成「写入 + 读取」，前端降级时无需第二次请求。
 * KV REST 由 Upstash（UPSTASH_REDIS_REST_*）或 Vercel 风格命名注入，
 * 两者均为 Upstash 协议：POST 数组形式命令。
 * KV 键：stat:site_pv / stat:page:{p} / stat:site_uv（均整数），
 * 以及 uv:{id} 去重哨兵键（EX 31536000，1 年）。
 */

type KvConfig = { url: string; token: string };

// 访客去重 cookie：与不蒜子同思路，由服务端首次生成并下发
const UV_COOKIE = "suvid";
const UV_TTL_SECONDS = 31536000; // 1 年
// 页面路径（page_pv 的 KV 键）：仅拒绝控制字符并限长，限流已兜住滥用
const MAX_PATH_LENGTH = 300;
// 每 IP 每分钟最多写入次数，超限 429
const RATE_LIMIT_PER_MINUTE = 30;

const BASE_HEADERS = {
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...BASE_HEADERS, ...extraHeaders },
  });
}

// 按优先级取第一个非空的环境变量
function firstEnv(env: Record<string, string | undefined>, ...names: string[]): string | undefined {
  return names.map((name) => env[name]).find(Boolean);
}

function getKvConfig(env: Record<string, string | undefined>): KvConfig | null {
  const url = firstEnv(
    env,
    "KV_REST_API_URL",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_KV_REST_API_URL",
  );
  const token = firstEnv(
    env,
    "KV_REST_API_TOKEN",
    "UPSTASH_REDIS_REST_TOKEN",
    "UPSTASH_REDIS_REST_KV_REST_API_TOKEN",
  );
  if (!url || !token) return null;
  return { url, token };
}

// 控制字符（含 DEL）不得进入 KV 键
function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

function isValidPath(p: unknown): p is string {
  return (
    typeof p === "string" && p.length > 0 && p.length <= MAX_PATH_LENGTH && !hasControlChars(p)
  );
}

// cookie 中的访客 id：限定为安全字符集，非法则重新生成
function isValidUvId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(id);
}

// 不依赖 crypto.randomUUID（各运行时类型支持不一），随机碰撞概率已足够低
function newUvId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

async function kvCommand(
  kv: KvConfig,
  command: (string | number)[],
): Promise<string | number | null> {
  const response = await fetch(kv.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kv.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    // 上游挂死时不要拖到平台超时（对齐 api/like.ts 的超时口径）
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`KV error: ${response.statusText}`);
  }
  const data = (await response.json()) as { result: string | number | null };
  return data.result;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || request.headers.get("x-real-ip") || "";
  return ip || "unknown";
}

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

function buildSetCookie(name: string, value: string): string {
  return `${name}=${value}; Path=/; Max-Age=${UV_TTL_SECONDS}; SameSite=Lax`;
}

// 每 IP 每分钟限流；桶键 2 分钟过期（每次续期，避免首次 EXPIRE 失败后永不过期）
async function checkRateLimit(kv: KvConfig, request: Request): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 60000);
  const key = `rl:${getClientIp(request)}:${bucket}`;
  const count = Number(await kvCommand(kv, ["INCR", key]));
  await kvCommand(kv, ["EXPIRE", key, 120]);
  return count <= RATE_LIMIT_PER_MINUTE;
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const kv = getKvConfig(env || {});

  // 未配置 KV：返回全 0，让前端照常渲染降级数字（不阻塞页面，对齐 like.ts 的降级哲学）
  if (!kv) {
    return json({ site_pv: 0, page_pv: 0, site_uv: 0 }, 200, { "Cache-Control": "no-store" });
  }

  try {
    if (!(await checkRateLimit(kv, request))) {
      return json({ error: "too many requests" }, 429);
    }

    // 访客去重标识：读 cookie，缺失/非法则重新生成并下发
    const incoming = getCookie(request, UV_COOKIE);
    const uvId = isValidUvId(incoming) ? incoming : newUvId();
    const setCookie = incoming !== uvId ? buildSetCookie(UV_COOKIE, uvId) : null;

    const url = new URL(request.url);
    const p = url.searchParams.get("p");
    const pagePath = isValidPath(p) ? p : null;

    // 并行打点：站点总访问量 + UV 去重哨兵
    const [sitePvRaw, sentinel] = await Promise.all([
      kvCommand(kv, ["INCR", "stat:site_pv"]),
      kvCommand(kv, ["SET", `uv:${uvId}`, "1", "EX", UV_TTL_SECONDS, "NX"]),
    ]);

    // 单页访问量：仅在路径合法时累加
    let pagePv = 0;
    if (pagePath) {
      pagePv = Number(await kvCommand(kv, ["INCR", `stat:page:${pagePath}`]));
    }

    // 哨兵首次写入成功（"OK"）才计为新访客，否则读取现有访客数
    const isNewUv = sentinel === "OK";
    const siteUv = Number(
      isNewUv
        ? await kvCommand(kv, ["INCR", "stat:site_uv"])
        : await kvCommand(kv, ["GET", "stat:site_uv"]),
    );

    const sitePv = Number(sitePvRaw);
    return json(
      {
        site_pv: Number.isFinite(sitePv) ? sitePv : 0,
        page_pv: Number.isFinite(pagePv) ? pagePv : 0,
        site_uv: Number.isFinite(siteUv) ? siteUv : 0,
      },
      200,
      setCookie
        ? { "Cache-Control": "no-store", "Set-Cookie": setCookie }
        : { "Cache-Control": "no-store" },
    );
  } catch (error) {
    console.error("Visit API failed:", error);
    return json({ error: "internal error" }, 500);
  }
}

// 非 GET 直接 405：本端点只有「写入 + 读取」一种语义
export async function onRequest() {
  return json({ error: "method not allowed" }, 405, { Allow: "GET" });
}
