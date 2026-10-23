import type { VercelRequest, VercelResponse } from "@vercel/node";

// 全局点赞计数：KV 中 like:{id} → 整数
// KV REST 由 Vercel KV（KV_REST_API_*）或 Upstash（UPSTASH_REDIS_REST_*）注入，
// 两者均为 Upstash 协议：POST 数组形式命令，兼容性最好（键含 : 和 / 无需路径编码）
type KvConfig = { url: string; token: string };

type LikeAction = "inc" | "dec";

// 文章 id（page.relativePath）白名单：允许中文文件名，拒绝其余字符
const ID_PATTERN = /^[A-Za-z0-9_\-./一-鿿]+$/;
const MAX_ID_LENGTH = 300;
// 每 IP 每分钟最多写操作次数，超限 429
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

function isValidId(id: unknown): id is string {
  return (
    typeof id === "string" && id.length > 0 && id.length <= MAX_ID_LENGTH && ID_PATTERN.test(id)
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
    // 上游挂死时不要拖到平台超时（对齐 api/status.ts 的超时口径）
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

// 每 IP 每分钟限流；桶键 2 分钟过期，无需清理逻辑
async function checkRateLimit(kv: KvConfig, req: VercelRequest): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 60000);
  const key = `rl:${getClientIp(req)}:${bucket}`;
  const count = Number(await kvCommand(kv, ["INCR", key]));
  if (count === 1) {
    await kvCommand(kv, ["EXPIRE", key, 120]);
  }
  return count <= RATE_LIMIT_PER_MINUTE;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const kv = getKvConfig();

  // 未配置 KV：与 api/status.ts 的 "unknown" 同一降级哲学，返回 200 + count: null
  if (!kv) {
    return res.status(200).json({ count: null });
  }

  try {
    if (req.method === "GET") {
      const { id } = req.query;
      if (!isValidId(id)) {
        return res.status(400).json({ error: "invalid id" });
      }
      const result = await kvCommand(kv, ["GET", `like:${id}`]);
      res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");
      return res.status(200).json({ count: result === null ? 0 : Number(result) });
    }

    if (req.method === "POST") {
      const { id, action } = req.body as { id?: unknown; action?: unknown };
      if (!isValidId(id)) {
        return res.status(400).json({ error: "invalid id" });
      }
      if (action !== "inc" && action !== "dec") {
        return res.status(400).json({ error: "invalid action" });
      }

      if (!(await checkRateLimit(kv, req))) {
        return res.status(429).json({ error: "too many requests" });
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

      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ count });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (error) {
    console.error("Like API failed:", error);
    return res.status(500).json({ error: "internal error" });
  }
}
