// GroundTruth Network — TypeScript SDK.
//
// One-liner integration for AI agents that need real-time ground
// truth from the physical world. The SDK wraps the public HTTP API
// with strict types, sensible defaults, and a single high-level
// verify() method that handles the search → judge → escalate →
// settle flow end to end.
//
// Example
// -------
//
// import { GroundTruth } from "groundtruth-sdk";
//
// const gt = new GroundTruth({ agentId: "my-travel-app" });
//
// const result = await gt.verify({
//   question: "Is Cafe X in Berlin open right now?",
//   maxSats: 500,
// });
//
// if (result.kind === "verified") {
//   console.log("Verified by a human:", result.answer);
// }

import type {
  LightningInvoice,
  Task,
  VerifyOptions,
  VerifyResult,
} from "./types.js";

const DEFAULT_API_URL = "https://groundtruth-network.vercel.app";

export interface GroundTruthOptions {
  /**
   * Identifier you want attached to the tasks your agent posts. Shows
   * up in dashboards and analytics. Free-form, no signup required.
   */
  agentId?: string;
  /**
   * Override the GroundTruth API base URL — useful for self-hosted
   * deployments or local development. Defaults to the public network.
   */
  apiUrl?: string;
  /**
   * Custom fetch implementation, e.g. when running in a constrained
   * runtime that doesn't expose the global fetch.
   */
  fetch?: typeof fetch;
}

export class GroundTruth {
  private readonly apiUrl: string;
  private readonly agentId: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: GroundTruthOptions = {}) {
    this.apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, "");
    this.agentId = options.agentId ?? "anonymous-agent";
    this.fetchImpl = options.fetch ?? fetch.bind(globalThis);
  }

  /**
   * The high-level entry point. Asks the network to answer a
   * question — direct if the platform agent is confident, escalated
   * to a human worker otherwise. Resolves with the final outcome.
   */
  async verify(
    input: { question: string } & VerifyOptions
  ): Promise<VerifyResult> {
    const {
      question,
      maxSats = 500,
      timeoutSeconds = 90,
      pollIntervalMs = 1000,
      signal,
    } = input;

    const askRes = await this.post<{
      verdict: "answered_directly" | "needs_human_verification";
      answer?: string;
      reasoning?: string;
      sources?: { title: string; url: string }[];
      draft?: string;
      task?: Task;
      invoice?: LightningInvoice;
    }>("/api/agent/ask", { question, bounty_sats: maxSats, agent_id: this.agentId }, signal);

    if (askRes.verdict === "answered_directly") {
      return {
        kind: "answered_directly",
        answer: askRes.answer ?? "",
        reasoning: askRes.reasoning ?? "",
        sources: askRes.sources ?? [],
      };
    }

    if (!askRes.task) {
      throw new Error("GroundTruth API returned needs_human_verification without a task");
    }

    const final = await this.waitForTask(askRes.task.id, {
      timeoutSeconds,
      pollIntervalMs,
      signal,
    });
    return final;
  }

  /**
   * Direct task creation. Useful when you want to skip the platform's
   * own draft-and-judge step and go straight to a human worker — for
   * instance when you already know the question is unverifiable.
   */
  async createTask(input: {
    prompt: string;
    bountySats: number;
    context?: string;
    category?: string;
    timeoutSeconds?: number;
  }): Promise<{ task: Task; invoice: LightningInvoice }> {
    return await this.post<{ task: Task; invoice: LightningInvoice }>(
      "/api/tasks",
      {
        prompt: input.prompt,
        context: input.context,
        category: input.category,
        bounty_sats: input.bountySats,
        timeout_seconds: input.timeoutSeconds,
        agent_id: this.agentId,
      },
    );
  }

  /** Fetch a task by id. */
  async getTask(taskId: string): Promise<Task> {
    const res = await this.get<{ task: Task }>(`/api/tasks/${taskId}`);
    return res.task;
  }

  /**
   * Polls the task until it leaves the open / claimed / submitted
   * states or the timeout elapses.
   */
  async waitForTask(
    taskId: string,
    options: { timeoutSeconds?: number; pollIntervalMs?: number; signal?: AbortSignal } = {},
  ): Promise<VerifyResult> {
    const { timeoutSeconds = 90, pollIntervalMs = 1000, signal } = options;
    const deadline = Date.now() + timeoutSeconds * 1000;

    while (Date.now() < deadline) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const task = await this.getTask(taskId);

      if (task.status === "verified") {
        return {
          kind: "verified",
          answer: task.submitted_answer ?? "",
          task,
          payout: {
            payment_hash: task.payout_payment_hash ?? "",
            amount_sats: task.bounty_sats,
          },
        };
      }
      if (task.status === "rejected") {
        return {
          kind: "rejected",
          task,
          reason: task.rejection_reason ?? "Worker submission was implausible",
        };
      }
      if (task.status === "expired") {
        return { kind: "timeout", task };
      }

      await sleep(pollIntervalMs, signal);
    }

    return { kind: "timeout", task: await this.getTask(taskId) };
  }

  // ---------------------------------------------------------------
  // HTTP plumbing — kept tiny on purpose.
  // ---------------------------------------------------------------
  private async post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    const res = await this.fetchImpl(`${this.apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GroundTruth ${path} failed (${res.status}): ${text}`);
    }
    return (await res.json()) as T;
  }

  private async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const res = await this.fetchImpl(`${this.apiUrl}${path}`, { signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GroundTruth ${path} failed (${res.status}): ${text}`);
    }
    return (await res.json()) as T;
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
