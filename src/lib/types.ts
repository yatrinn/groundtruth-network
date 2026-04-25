// Domain types shared between client, server, and any future SDK.

export type TaskStatus =
  | "open"
  | "claimed"
  | "submitted"
  | "verified"
  | "rejected"
  | "expired";

export interface Task {
  id: string;
  created_at: string;

  prompt: string;
  context: string | null;
  category: string | null;

  bounty_sats: number;
  timeout_seconds: number;

  status: TaskStatus;

  agent_id: string | null;
  agent_payment_hash: string | null;

  worker_session_id: string | null;
  worker_lightning_address: string | null;
  claimed_at: string | null;

  submitted_answer: string | null;
  submitted_proof_url: string | null;
  submitted_at: string | null;

  verified_at: string | null;
  payout_payment_hash: string | null;
  rejection_reason: string | null;
}

export interface Worker {
  session_id: string;
  lightning_address: string;
  created_at: string;
  completed_count: number;
  total_earned_sats: number;
}

// Payload an agent sends to create a verification task.
export interface CreateTaskInput {
  prompt: string;
  context?: string;
  category?: string;
  bounty_sats: number;
  timeout_seconds?: number;
  agent_id?: string;
}

// Payload a worker sends to submit an answer.
export interface SubmitTaskInput {
  answer: string;
  proof_url?: string;
  worker_session_id: string;
  worker_lightning_address: string;
}
