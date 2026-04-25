-- Rate limit + global quota table.
-- Run once in Supabase SQL Editor after the main schema.
--
-- We use a single counter table for both per-IP rate limits and a
-- platform-wide daily ceiling on expensive AI calls. Compared to
-- in-memory counters (which reset on every cold start), this gives
-- us reliable protection across serverless invocations.

create table if not exists public.rate_buckets (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

create index if not exists rate_buckets_reset_idx on public.rate_buckets(reset_at);

-- Atomic check-and-increment. Caller passes the bucket key, the
-- window length, and the cap. Returns the post-increment count and
-- a boolean for whether the request is allowed.
create or replace function public.consume_rate_bucket(
  p_key text,
  p_window_seconds int,
  p_max_count int
)
returns table(allowed boolean, current_count int, reset_at timestamptz)
language plpgsql
as $$
declare
  v_now timestamptz := now();
  v_bucket public.rate_buckets%rowtype;
begin
  select * into v_bucket from public.rate_buckets where key = p_key for update;

  if not found or v_bucket.reset_at <= v_now then
    insert into public.rate_buckets(key, count, reset_at)
    values (p_key, 1, v_now + make_interval(secs => p_window_seconds))
    on conflict (key) do update
      set count = 1, reset_at = excluded.reset_at
    returning * into v_bucket;
  else
    update public.rate_buckets
       set count = count + 1
     where key = p_key
    returning * into v_bucket;
  end if;

  return query select (v_bucket.count <= p_max_count) as allowed,
                      v_bucket.count as current_count,
                      v_bucket.reset_at as reset_at;
end;
$$;

-- Public clients should never read or write directly. Only the
-- service role (server) is expected to call this RPC.
alter table public.rate_buckets enable row level security;
revoke all on public.rate_buckets from anon, authenticated;
grant select, insert, update on public.rate_buckets to service_role;
