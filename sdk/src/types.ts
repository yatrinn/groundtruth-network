// Public types for the GroundTruth SDK.
//
// These mirror the on-the-wire shape of the GroundTruth Network API
// at https://groundtruth-network.vercel.app. Keeping them flat and
// documented lets agent authors reason about the contract without
// reading the server.

export type TaskStatus =
  | "open"
  | "claimed"
  | "submitted"
  | "verified"
  | "rejected"
  | "expired";

export interface Task {
  /** Unique identifier for the task. */
  id: string;
  /** ISO-8601 creation timestamp. */
  created_at: string;
  /** The verification question the agent posted. */
  prompt: string;
  /** Optional context / reasoning the agent supplied. */
  context: string | null;
  /** Optional category tag. */
  category: string | null;
  /** Bounty amount, in satoshis, paid to the worker on success. */
  bounty_sats: number;
  /** Soft cap on how long the task may stay claimed before expiry. */
  timeout_seconds: number;
  /** Lifecycle state. */
  status: TaskStatus;
  /** Caller-supplied agent identifier. */
  agent_id: string | null;
  /** Worker-supplied answer once submitted. */
  submitted_answer: string | null;
  /** Optional URL to a photo / artifact the worker attached. */
  submitted_proof_url: string | null;
  /** Lightning preimage from the payout, if verified. */
  payout_payment_hash: string | null;
  /** ISO-8601 verification timestamp. */
  verified_at: string | null;
  /** Reason for rejection, when the plausibility gate failed. */
  rejection_reason: string | null;
}

export interface LightningInvoice {
  /** BOLT11 invoice the agent should pay to fund the bounty. */
  bolt11: string;
  /** Bounty amount in sats. */
  amount_sats: number;
  /** SHA-256 payment hash. */
  payment_hash: string;
  /** ISO-8601 expiration timestamp. */
  expires_at: string;
}

export interface VerifyOptions {
  /** Maximum bounty the agent is willing to pay. Defaults to 500 sats. */
  maxSats?: number;
  /** Soft cap on wait time before we abort. Defaults to 90 seconds. */
  timeoutSeconds?: number;
  /** Optional user-facing context to help the worker answer. */
  context?: string;
  /** Optional category tag for analytics. */
  category?: string;
  /** Polling interval while waiting for the worker. Defaults to 1 second. */
  pollIntervalMs?: number;
  /** AbortSignal to cancel the verify call. */
  signal?: AbortSignal;
}

export type VerifyResult =
  | {
      /** The agent answered without escalating to a human. */
      kind: "answered_directly";
      answer: string;
      reasoning: string;
      sources: { title: string; url: string }[];
    }
  | {
      /** A human worker verified the answer. */
      kind: "verified";
      answer: string;
      task: Task;
      payout: { payment_hash: string; amount_sats: number };
    }
  | {
      /** The verification window elapsed without a worker response. */
      kind: "timeout";
      task: Task;
    }
  | {
      /** A worker submitted but the answer failed the plausibility gate. */
      kind: "rejected";
      task: Task;
      reason: string;
    };
