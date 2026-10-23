/**
 * 全局点赞计数（Cloudflare Pages Functions）。
 * 与 api/like.ts 保持同一口径，改一处请同步另一处。
 * KV REST 由 Upstash（UPSTASH_REDIS_REST_*）或 Vercel 风格命名注入，
 * 两者均为 Upstash 协议：POST 数组形式命令。
 */

type KvConfig = { url: string; token: string };

type LikeAction = "inc" | "dec";

// 文章 id（page.relativePath）：仅拒绝控制字符（KV 键任意字符串皆可，限流已兜住滥用）
const MAX_ID_LENGTH = 300;
// 每 IP 每分钟最多写操作次数，超限 429
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

function isValidId(id: unknown): id is string {
  return (
    typeof id === "string" &&
    id.length > 0 &&
    id.length <= MAX_ID_LENGTH &&
    // eslint-disable-next-line no-control-regex
    !/[\u0000-\u001f\u007f]/.test(id)
  );
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

  // 未配置 KV：与 api/status.ts 的 "unknown" 同一降级哲学，返回 200 + count: null
  if (!kv) {
    return json({ count: null });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!isValidId(id)) {
      return json({ error: "invalid id" }, 400);
    }
    const result = await kvCommand(kv, ["GET", `like:${id}`]);
    const n = Number(result);
    return json({ count: result === null || !Number.isFinite(n) ? 0 : n }, 200, {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
    });
  } catch (error) {
    console.error("Like API failed:", error);
    return json({ error: "internal error" }, 500);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  const kv = getKvConfig(env || {});

  if (!kv) {
    return json({ count: null });
  }

  try {
    let body: { id?: unknown; action?: unknown } | undefined;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid body" }, 400);
    }
    const { id, action } = body || {};
    if (!isValidId(id)) {
      return json({ error: "invalid id" }, 400);
    }
    if (action !== "inc" && action !== "dec") {
      return json({ error: "invalid action" }, 400);
    }

    if (!(await checkRateLimit(kv, request))) {
      return json({ error: "too many requests" }, 429);
    }

    const key = `like:${id}`;
    let count: number;
    if ((action as LikeAction) === "inc") {
      count = Number(await kvCommand(kv, ["INCR", key]));
    } else {
      count = Number(await kvCommand(kv, ["DECR", key]));
      // 计数不低于 0：并发下可能短暂为负，拉回 0
      if (count < 0) {
        await kvCommand(kv, ["INCR", key]);
        count = 0;
      }
    }

    return json({ count: Number.isFinite(count) ? count : 0 }, 200, {
      "Cache-Control": "no-store",
    });
  } catch (error) {
    console.error("Like API failed:", error);
    return json({ error: "internal error" }, 500);
  }
}
