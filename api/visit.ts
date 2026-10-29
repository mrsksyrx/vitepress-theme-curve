import type { VercelRequest, VercelResponse } from "@vercel/node";

// 站点访问计数（不蒜子降级数据源），KV 中：
//   stat:site_pv  -> 整数，站点总访问量
//   stat:page:{p} -> 整数，单页访问量
//   stat:site_uv  -> 整数，站点访客数（按 suvid cookie 去重）
//   uv:{id}       -> 去重哨兵键，EX 31536000（1 年）
// 一次 GET 同时完成「写入 + 读取」，前端降级时无需第二次请求。
// KV REST 由 Vercel KV（KV_REST_API_*）或 Upstash（UPSTASH_REDIS_REST_*）注入，
// 两者均为 Upstash 协议：POST 数组形式命令。
type KvConfig = { url: string; token: string };

// 访客去重 cookie：与不蒜子同思路，由服务端首次生成并下发
const UV_COOKIE = "suvid";
const UV_TTL_SECONDS = 31536000; // 1 年
// 页面路径（page_pv 的 KV 键）：仅拒绝控制字符并限长，限流已兜住滥用
const MAX_PATH_LENGTH = 300;
// 每 IP 每分钟最多写入次数，超限 429
const RATE_LIMIT_PER_MINUTE = 30;

// 按优先级取第一个非空的环境变量
function firstEnv(...names: string[]): string | undefined {
  return names.map((name) => process.env[name]).find(Boolean);
}

function getKvConfig(): KvConfig | null {
  // 兼容三组命名：Vercel KV 原生（KV_REST_API_*）、Upstash 直连（UPSTASH_REDIS_REST_*）、
  // 以及 Vercel Marketplace Upstash 集成带自定义前缀的形态（本项目实际生成 UPSTASH_REDIS_REST_KV_REST_API_*）
  const url = firstEnv(
    "KV_REST_API_URL",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_KV_REST_API_URL",
  );
  const token = firstEnv(
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

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = (first || (req.headers["x-real-ip"] as string) || "").split(",")[0].trim();
  return ip || "unknown";
}

function getCookie(req: VercelRequest, name: string): string | undefined {
  const { cookies } = req;
  if (!cookies) return undefined;
  return cookies[name];
}

function buildSetCookie(name: string, value: string): string {
  return `${name}=${value}; Path=/; Max-Age=${UV_TTL_SECONDS}; SameSite=Lax`;
}

// 每 IP 每分钟限流；桶键 2 分钟过期（每次续期，避免首次 EXPIRE 失败后永不过期）
async function checkRateLimit(kv: KvConfig, req: VercelRequest): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 60000);
  const key = `rl:${getClientIp(req)}:${bucket}`;
  const count = Number(await kvCommand(kv, ["INCR", key]));
  await kvCommand(kv, ["EXPIRE", key, 120]);
  return count <= RATE_LIMIT_PER_MINUTE;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method not allowed" });
  }

  const kv = getKvConfig();

  // 未配置 KV：返回全 0，让前端照常渲染降级数字（不阻塞页面，对齐 like.ts 的降级哲学）
  if (!kv) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ site_pv: 0, page_pv: 0, site_uv: 0 });
  }

  try {
    if (!(await checkRateLimit(kv, req))) {
      return res.status(429).json({ error: "too many requests" });
    }

    // 访客去重标识：读 cookie，缺失/非法则重新生成并下发
    const incoming = getCookie(req, UV_COOKIE);
    const uvId = isValidUvId(incoming) ? incoming : newUvId();
    if (incoming !== uvId) {
      res.setHeader("Set-Cookie", buildSetCookie(UV_COOKIE, uvId));
    }

    const { p } = req.query;
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
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      site_pv: Number.isFinite(sitePv) ? sitePv : 0,
      page_pv: Number.isFinite(pagePv) ? pagePv : 0,
      site_uv: Number.isFinite(siteUv) ? siteUv : 0,
    });
  } catch (error) {
    console.error("Visit API failed:", error);
    return res.status(500).json({ error: "internal error" });
  }
}
