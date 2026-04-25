// POST /api/tasks  — create a verification task and return a Lightning invoice
// GET  /api/tasks  — list open tasks for workers to browse
//
// In a production system, POST would gate on a real L402 paywall and only
// move the task to "open" once the invoice is paid. For the demo we accept
// the invoice as paid optimistically (mock Lightning) so judges can post a
// task and see it appear in the worker feed instantly.

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { createInvoice } from "@/lib/lightning";
import type { CreateTaskInput, Task } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: CreateTaskInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 }
    );
  }
  if (!body.bounty_sats || body.bounty_sats <= 0) {
    return NextResponse.json(
      { error: "bounty_sats must be a positive integer" },
      { status: 400 }
    );
  }

  const invoice = await createInvoice(
    body.bounty_sats,
    `GroundTruth task: ${body.prompt.slice(0, 80)}`
  );

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      prompt: body.prompt,
      context: body.context ?? null,
      category: body.category ?? null,
      bounty_sats: body.bounty_sats,
      timeout_seconds: body.timeout_seconds ?? 300,
      agent_id: body.agent_id ?? null,
      agent_payment_hash: invoice.payment_hash,
      status: "open",
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create task" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    task: data as Task,
    invoice,
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "open";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data as Task[] });
}
