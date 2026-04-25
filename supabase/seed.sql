-- Seed data for the network activity feed.
-- Run after schema.sql. Inserts a handful of "historical" verified tasks
-- so the landing page and worker feed look populated for first-time
-- visitors and judges who land before any live demo activity.

insert into public.tasks (
  prompt, context, category, bounty_sats, status,
  agent_id, agent_payment_hash,
  worker_session_id, worker_lightning_address,
  claimed_at, submitted_answer, submitted_at,
  verified_at, payout_payment_hash,
  created_at
) values
  (
    'Is Cafe Einstein on Kurfuerstenstrasse open today, or closed for renovation?',
    null, 'agent_question', 500, 'verified',
    'travel-demo', 'a1b2c3d4e5f60718291031425364758697a8b9c0d1e2f30415263748596a7b8c',
    'seed-worker-berlin', 'demo-berlin@walletofsatoshi.com',
    now() - interval '2 hours', 'Open. Renovation finished last week, normal hours 8 to 22.', now() - interval '1 hour 58 minutes',
    now() - interval '1 hour 58 minutes', '7c8d9e0f1a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d',
    now() - interval '2 hours'
  ),
  (
    'Does the Nike flagship in Tokyo Shibuya have Air Jordan 1 Mid in size US 10 in stock right now?',
    null, 'agent_question', 800, 'verified',
    'shopping-demo', 'b2c3d4e5f60718291031425364758697a8b9c0d1e2f30415263748596a7b8c9d',
    'seed-worker-tokyo', 'demo-tokyo@walletofsatoshi.com',
    now() - interval '47 minutes', 'In stock — black/white colourway only, white/red sold out as of 14:30 JST.', now() - interval '45 minutes',
    now() - interval '45 minutes', '8d9e0f1a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e',
    now() - interval '47 minutes'
  ),
  (
    'Is the queue at the BYD Shenzhen factory parking lot longer than yesterday morning?',
    null, 'agent_question', 1200, 'verified',
    'trading-demo', 'c3d4e5f60718291031425364758697a8b9c0d1e2f30415263748596a7b8c9d0e',
    'seed-worker-shenzhen', 'demo-sz@walletofsatoshi.com',
    now() - interval '32 minutes', 'Significantly longer — about 40 trucks vs. 18 yesterday at the same hour.', now() - interval '30 minutes',
    now() - interval '30 minutes', '9e0f1a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f',
    now() - interval '32 minutes'
  ),
  (
    'Is the office of Acme GmbH at Friedrichstrasse 100 actually still operating, or is the building empty?',
    null, 'agent_question', 1500, 'verified',
    'sales-demo', 'd4e5f60718291031425364758697a8b9c0d1e2f30415263748596a7b8c9d0e1f',
    'seed-worker-berlin-2', 'demo-berlin2@walletofsatoshi.com',
    now() - interval '20 minutes', 'Operating. Lights on, foot traffic in lobby, Acme nameplate present at floor 4.', now() - interval '18 minutes',
    now() - interval '18 minutes', '0f1a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70',
    now() - interval '20 minutes'
  ),
  (
    'How long is the line at Berghain in Berlin right now?',
    null, 'agent_question', 600, 'verified',
    'travel-demo', 'e5f60718291031425364758697a8b9c0d1e2f30415263748596a7b8c9d0e1f20',
    'seed-worker-berlin-3', 'demo-berlin3@walletofsatoshi.com',
    now() - interval '11 minutes', 'About 90 minutes from the back of the line at the door — security visibly selective tonight.', now() - interval '9 minutes',
    now() - interval '9 minutes', '1a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f7081',
    now() - interval '11 minutes'
  ),
  (
    'Are queues at the Costco Mexico City fuel station longer than yesterday morning?',
    null, 'agent_question', 900, 'verified',
    'trading-demo', 'f60718291031425364758697a8b9c0d1e2f30415263748596a7b8c9d0e1f2031',
    'seed-worker-cdmx', 'demo-cdmx@walletofsatoshi.com',
    now() - interval '4 minutes', 'Marginally shorter — 6 minutes wait vs. 9 yesterday. Diesel pumps less crowded today.', now() - interval '2 minutes',
    now() - interval '2 minutes', '2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a',
    now() - interval '4 minutes'
  );

-- Match the worker stats so the leaderboard math holds.
insert into public.workers (
  session_id, lightning_address, completed_count, total_earned_sats, created_at
) values
  ('seed-worker-berlin',    'demo-berlin@walletofsatoshi.com',  1, 500,  now() - interval '2 hours'),
  ('seed-worker-tokyo',     'demo-tokyo@walletofsatoshi.com',   1, 800,  now() - interval '47 minutes'),
  ('seed-worker-shenzhen',  'demo-sz@walletofsatoshi.com',      1, 1200, now() - interval '32 minutes'),
  ('seed-worker-berlin-2',  'demo-berlin2@walletofsatoshi.com', 1, 1500, now() - interval '20 minutes'),
  ('seed-worker-berlin-3',  'demo-berlin3@walletofsatoshi.com', 1, 600,  now() - interval '11 minutes'),
  ('seed-worker-cdmx',      'demo-cdmx@walletofsatoshi.com',    1, 900,  now() - interval '4 minutes')
on conflict (session_id) do nothing;
