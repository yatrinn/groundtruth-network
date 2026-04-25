// POST /api/tasks/:id/claim
// A worker reserves a task. We use a single conditional update to avoid
// races where two workers claim the same task at the same time.

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import type { Task } from "@/lib/types";

interface ClaimBody {
  worker_session_id: string;
  worker_lightning_address: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: ClaimBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.worker_session_id || !body.worker_lightning_address) {
    return NextResponse.json(
      { error: "worker_session_id and worker_lightning_address are required" },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();

  // Conditional update: only flips status if the task is still open.
  // Postgres serializes this so concurrent claims are safe.
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "claimed",
      worker_session_id: body.worker_session_id,
      worker_lightning_address: body.worker_lightning_address,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "open")
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Task is no longer available" },
      { status: 409 }
    );
  }

  return NextResponse.json({ task: data as Task });
}
