// 單機記憶體限流：足以擋登入暴力破解與留言/訊息洗版。刻意不引入 Redis——
// 本站是單機部署，重啟後歸零、多實例各自計算對這個規模來說可以接受。

interface Bucket {
  count: number;
  resetAt: number;
}

// dev 熱重載會重新載入模組，掛在 globalThis 才不會每次重新開始
const globalForRateLimit = globalThis as unknown as {
  __ojRateLimit?: Map<string, Bucket>;
};
const buckets = (globalForRateLimit.__ojRateLimit ??= new Map());

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // 順手清掉過期 bucket，不需要背景 timer；量大時才整批掃
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  bucket.count++;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfterSec: 0 };
}

// 超過限制時回傳可直接 return 的 429 Response，沒超過回傳 null
export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Response | null {
  const result = rateLimit(key, limit, windowMs);
  if (result.ok) return null;
  return Response.json(
    { error: `操作過於頻繁，請於 ${result.retryAfterSec} 秒後再試` },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    }
  );
}

// nginx 會帶 x-forwarded-for；直接連線時退回 x-real-ip
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
