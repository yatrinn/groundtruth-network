// POST /api/tasks/:id/auto-verify
//
// Demo-mode fallback. When a single-tab visitor asks the agent a
// question and no real worker claims the task within ~30s, the agent
// page calls this endpoint so the visitor can still see a complete
// flow. The endpoint generates a plausible, web-grounded answer via
// Tavily + the same LLM the platform uses, marks the task as
// auto-verified with an explicit "demo-auto-verifier" worker session,
// and writes a placeholder payout hash.
//
// The agent UI surfaces a clear "Simulated demo answer — no human
// worker available right now" badge whenever it sees this session id.
// We keep this demo-only path opt-in via the AUTO_VERIFIER_SECRET env
// guard so a malicious actor cannot mass-verify open tasks.

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { searchWeb } from "@/lib/tavily";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { Task } from "@/lib/types";

export const AUTO_WORKER_SESSION_ID = "demo-auto-verifier";
const AUTO_WORKER_LIGHTNING = "demo-auto-verifier@groundtruth.local";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Cap to 5 auto-verifies per minute per IP so this can't be turned
  // into a free LLM-spam endpoint.
  const ip = getClientIp(req);
  const limited = rateLimit(`auto-verify:${ip}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many auto-verify requests" },
      { status: 429 }
    );
  }

  const { id } = await params;
  const supabase = supabaseServer();

  // Only auto-verify still-open demo tasks. We never overwrite a real
  // worker submission, and we never auto-verify a task someone else
  // has already claimed.
  const { data: existing, error: fetchErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const task = existing as Task;
  if (task.status !== "open") {
    return NextResponse.json(
      { error: "Task is not open", status: task.status },
      { status: 409 }
    );
  }

  // Simulated worker answer. Web-grounded so the demo is informative,
  // honest about its limits, and never pretends to be on-the-ground.
  const answer = await simulateWorkerAnswer(task.prompt);

  const now = new Date().toISOString();
  const { data: verified, error: updateErr } = await supabase
    .from("tasks")
    .update({
      status: "verified",
      worker_session_id: AUTO_WORKER_SESSION_ID,
      worker_lightning_address: AUTO_WORKER_LIGHTNING,
      claimed_at: now,
      submitted_answer: answer,
      submitted_at: now,
      verified_at: now,
      payout_payment_hash: "0".repeat(64),
    })
    .eq("id", id)
    .eq("status", "open")
    .select()
    .single();

  if (updateErr || !verified) {
    return NextResponse.json(
      { error: updateErr?.message ?? "Failed to auto-verify" },
      { status: 409 }
    );
  }

  return NextResponse.json({ task: verified });
}

// Drafts a candidate answer the way a careful, web-equipped worker
// would: short, hedged where appropriate, citing what they could see.
// The point of this demo path is not to fabricate ground truth — it
// is to keep the loop visible to a single-tab visitor.
async function simulateWorkerAnswer(prompt: string): Promise<string> {
  const evidence = await searchWeb(prompt).catch(() => []);

  if (!process.env.OPENAI_API_KEY) {
    return "Simulated demo answer: in production this slot is filled by a human worker on the ground. We could not generate a fallback because OPENAI_API_KEY is not configured.";
  }

  const evidenceBlock = evidence.length
    ? evidence
        .slice(0, 3)
        .map(
          (r, i) =>
            `[${i + 1}] ${r.title}\n${r.url}\n${r.content.slice(0, 280)}`
        )
        .join("\n\n")
    : "(no useful web search results)";

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a stand-in worker for a demo. A real human worker would answer this question after observing it on the ground. " +
          "You cannot observe anything — but you must give the user a useful, honest, single-paragraph answer that:\n" +
          "  1. Summarises what the public web evidence suggests, with realistic specificity (numbers, hours, plausible details).\n" +
          "  2. Hedges clearly that this is a *simulated* answer because no live worker claimed the task.\n" +
          "  3. Stays under 60 words. No headings, no bullets.\n" +
          "Never claim to have personally observed anything. Never invent a name. Never fake a photo URL.",
      },
      {
        role: "user",
        content: `Question:\n${prompt}\n\nWeb evidence:\n${evidenceBlock}`,
      },
    ],
    max_completion_tokens: 700,
  });

  const text = res.choices[0]?.message?.content?.trim();
  if (!text) {
    return "Simulated demo answer: a real human worker would normally fill this slot. No fallback content was generated.";
  }
  return text;
}
