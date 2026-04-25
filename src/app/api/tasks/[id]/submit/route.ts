// POST /api/tasks/:id/submit
// Worker submits an answer. Server runs a quick AI plausibility check,
// then either pays out and marks the task verified, or rejects it.

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { payToLightningAddress } from "@/lib/lightning";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import type { Task } from "@/lib/types";

interface SubmitBody {
  worker_session_id: string;
  answer: string;
  proof_url?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.worker_session_id || !body.answer) {
    return NextResponse.json(
      { error: "worker_session_id and answer are required" },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  // Lock the row by transitioning claimed -> submitted only if the
  // submitter is the same worker who claimed it.
  const { data: claimedTask, error: fetchErr } = await supabase
    .from("tasks")
    .update({
      status: "submitted",
      submitted_answer: body.answer,
      submitted_proof_url: body.proof_url ?? null,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "claimed")
    .eq("worker_session_id", body.worker_session_id)
    .select()
    .single();

  if (fetchErr || !claimedTask) {
    return NextResponse.json(
      { error: "Task is not in a claimable state for this worker" },
      { status: 409 }
    );
  }

  const task = claimedTask as Task;

  // Plausibility check: cheap, fast, and just enough to filter empty /
  // garbage submissions. Real production would chain multiple verifiers.
  const plausible = await isAnswerPlausible(task.prompt, body.answer);

  if (!plausible.ok) {
    await supabase
      .from("tasks")
      .update({
        status: "rejected",
        rejection_reason: plausible.reason,
      })
      .eq("id", id);
    return NextResponse.json(
      { error: "Answer rejected", reason: plausible.reason },
      { status: 400 }
    );
  }

  if (!task.worker_lightning_address) {
    return NextResponse.json(
      { error: "Worker has no Lightning Address on file" },
      { status: 500 }
    );
  }

  const payout = await payToLightningAddress(
    task.worker_lightning_address,
    task.bounty_sats,
    `GroundTruth payout for task ${task.id.slice(0, 8)}`
  );

  if (!payout.success) {
    return NextResponse.json(
      { error: "Lightning payout failed", details: payout.error },
      { status: 502 }
    );
  }

  const { data: verified, error: verifyErr } = await supabase
    .from("tasks")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      payout_payment_hash: payout.payment_hash,
    })
    .eq("id", id)
    .select()
    .single();

  if (verifyErr || !verified) {
    return NextResponse.json(
      { error: verifyErr?.message ?? "Failed to mark task verified" },
      { status: 500 }
    );
  }

  // Bump worker stats. Idempotent enough for the demo. We tolerate
  // failures here so the user always sees a successful payout state.
  try {
    await supabase
      .from("workers")
      .upsert(
        {
          session_id: body.worker_session_id,
          lightning_address: task.worker_lightning_address,
          completed_count: 1,
          total_earned_sats: task.bounty_sats,
        },
        { onConflict: "session_id", ignoreDuplicates: false }
      );
  } catch {
    // Non-fatal: payout already succeeded.
  }

  return NextResponse.json({
    task: verified as Task,
    payout,
  });
}

// Cheap plausibility filter. Returns ok=false for empty / clearly junk
// answers. We call OpenAI only if the answer is non-trivial.
async function isAnswerPlausible(
  prompt: string,
  answer: string
): Promise<{ ok: boolean; reason?: string }> {
  const trimmed = answer.trim();
  if (trimmed.length < 2) return { ok: false, reason: "Answer is too short" };
  if (trimmed.length > 2000) return { ok: false, reason: "Answer is too long" };

  if (!process.env.OPENAI_API_KEY) {
    // Fall through: in dev without an API key we accept anything non-trivial.
    return { ok: true };
  }

  try {
    const res = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You judge whether a worker's answer is a plausible response to a verification request. " +
            "Reply with exactly 'YES' or 'NO: <short reason>'. Be lenient: only reject obviously empty, " +
            "off-topic, or nonsensical answers.",
        },
        {
          role: "user",
          content: `Task:\n${prompt}\n\nAnswer:\n${answer}`,
        },
      ],
      max_completion_tokens: 60,
    });
    const verdict = res.choices[0]?.message?.content?.trim() ?? "YES";
    if (verdict.toUpperCase().startsWith("YES")) return { ok: true };
    const reason = verdict.replace(/^NO:?\s*/i, "");
    return { ok: false, reason: reason || "Implausible answer" };
  } catch {
    // If the AI check fails, default to accepting so the demo never
    // gets stuck on an upstream outage.
    return { ok: true };
  }
}
