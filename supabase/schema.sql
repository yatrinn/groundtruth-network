-- GroundTruth Network — database schema
-- Run once in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- =============================================================
-- tasks
-- A verification request posted by an AI agent and claimed by a
-- worker. Lifecycle:
--   open -> claimed -> submitted -> verified | rejected | expired
-- =============================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- What the agent wants verified
  prompt text not null,
  context text,
  category text,

  -- Bounty held in escrow until the task completes
  bounty_sats integer not null check (bounty_sats > 0),
  timeout_seconds integer not null default 300,

  -- State machine
  status text not null default 'open'
    check (status in ('open', 'claimed', 'submitted', 'verified', 'rejected', 'expired')),

  -- Agent that posted the task (anonymous identifier ok)
  agent_id text,
  -- L402 payment proof from the agent (preimage hex)
  agent_payment_hash text,

  -- Worker that claimed it
  worker_session_id text,
  -- Where to pay them on completion
  worker_lightning_address text,
  claimed_at timestamptz,

  -- Worker submission
  submitted_answer text,
  submitted_proof_url text,
  submitted_at timestamptz,

  -- Outcome
  verified_at timestamptz,
  payout_payment_hash text,
  rejection_reason text
);

create index if not exists tasks_status_created_idx
  on public.tasks(status, created_at desc);
create index if not exists tasks_worker_idx
  on public.tasks(worker_session_id);

-- =============================================================
-- workers
-- Lightweight worker profile keyed by anonymous session id. We
-- accumulate completed_count and total_earned_sats for a simple
-- reputation surface in the demo.
-- =============================================================
create table if not exists public.workers (
  session_id text primary key,
  lightning_address text not null,
  created_at timestamptz not null default now(),
  completed_count integer not null default 0,
  total_earned_sats integer not null default 0
);

-- =============================================================
-- Row level security
-- Hackathon scope: permissive policies. Real production would
-- gate writes behind authenticated agent / worker identities.
-- =============================================================
alter table public.tasks enable row level security;
alter table public.workers enable row level security;

drop policy if exists "tasks readable" on public.tasks;
drop policy if exists "tasks insertable" on public.tasks;
drop policy if exists "tasks updatable" on public.tasks;

create policy "tasks readable"   on public.tasks for select using (true);
create policy "tasks insertable" on public.tasks for insert with check (true);
create policy "tasks updatable"  on public.tasks for update using (true);

drop policy if exists "workers readable" on public.workers;
drop policy if exists "workers insertable" on public.workers;
drop policy if exists "workers updatable" on public.workers;

create policy "workers readable"   on public.workers for select using (true);
create policy "workers insertable" on public.workers for insert with check (true);
create policy "workers updatable"  on public.workers for update using (true);

-- =============================================================
-- Realtime
-- Enable change broadcasts so the worker UI can react to new
-- tasks live without polling.
-- =============================================================
alter publication supabase_realtime add table public.tasks;
