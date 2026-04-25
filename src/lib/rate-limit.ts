// Lightweight in-memory rate limiter.
//
// Vercel functions share state inside a warm instance and lose it on
// cold starts, which is good enough as a first line of defense against
// casual scraping of our public AI endpoints. A real production setup
// would back this with Upstash Redis or a Postgres counter; for the
// hackathon, we just want bounded blast radius if the URL is shared.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  return {
    allowed: bucket.count <= options.maxRequests,
    remaining: Math.max(0, options.maxRequests - bucket.count),
    resetAt: bucket.resetAt,
  };
}

// Resolves the caller IP from Vercel-set proxy headers. Falls back to
// "unknown" so requests still get rate-limited (collectively) when the
// IP cannot be determined.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
