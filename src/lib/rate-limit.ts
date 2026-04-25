// Rate limiter backed by a Postgres table via Supabase RPC.
//
// We learned the hard way that an in-memory Map does not protect
// serverless functions: every cold start gets a fresh map, and a
// burst against a popular URL hits enough fresh instances that the
// limiter is effectively a no-op. Postgres gives us one shared
// counter all instances see.
//
// Usage: pass a key (e.g. "ask:1.2.3.4" or "global:openai-daily"),
// a window in seconds, and a cap. Returns whether the call is
// allowed plus the current count and reset timestamp.

import { supabaseServer } from "@/lib/supabase";

export interface RateLimitOptions {
  /** Sliding window duration in seconds. */
  windowSeconds: number;
  /** Maximum number of allowed requests within the window. */
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  resetAt: number;
}

export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase.rpc("consume_rate_bucket", {
      p_key: key,
      p_window_seconds: options.windowSeconds,
      p_max_count: options.maxRequests,
    });

    if (error || !data || data.length === 0) {
      // Fail open — better to keep the demo working than to block on
      // a transient DB error. Logged for follow-up.
      // eslint-disable-next-line no-console
      console.warn("[rate-limit] RPC failed, allowing request:", error?.message);
      return { allowed: true, count: 0, resetAt: Date.now() };
    }

    const row = data[0] as { allowed: boolean; current_count: number; reset_at: string };
    return {
      allowed: row.allowed,
      count: row.current_count,
      resetAt: new Date(row.reset_at).getTime(),
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[rate-limit] unexpected error, allowing:", err);
    return { allowed: true, count: 0, resetAt: Date.now() };
  }
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
