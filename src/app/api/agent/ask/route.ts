// POST /api/agent/ask
// The demo "AI travel concierge" endpoint. The agent first tries to
// answer via Tavily web search. If it can't be confident in the answer,
// it falls back to GroundTruth and posts a verification task.
//
// This single endpoint is what makes the demo land: a judge types a
// question, watches the agent admit uncertainty, watches it post a
// Lightning-funded task, and watches the worker tab pick it up.

import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { searchWeb } from "@/lib/tavily";
import { supabaseServer } from "@/lib/supabase";
import { createInvoice } from "@/lib/lightning";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

interface AskBody {
  question: string;
  bounty_sats?: number;
  agent_id?: string;
}

export async function POST(req: NextRequest) {
  // Cap public agent calls per IP to keep our OpenAI / Tavily spend
  // bounded even if the URL gets shared widely. 10 per minute is
  // ample for human demoers; abusers stop after 10.
  const ip = getClientIp(req);
  const limited = rateLimit(`ask:${ip}`, { windowMs: 60_000, maxRequests: 10 });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limited.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  let body: AskBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.question?.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const bounty = body.bounty_sats ?? 500;
  const agentId = body.agent_id ?? "demo-agent-1";

  // Stage 1: try the web. Often enough for time-stable facts.
  const web = await searchWeb(body.question).catch(() => []);

  // Stage 2: ask the LLM whether the web evidence answers the question
  // confidently. If not, we fall through to GroundTruth.
  const { confident, draft, reasoning } = await draftAndJudge(
    body.question,
    web
  );

  if (confident) {
    return NextResponse.json({
      verdict: "answered_directly",
      answer: draft,
      reasoning,
      sources: web.slice(0, 3).map((r) => ({ title: r.title, url: r.url })),
    });
  }

  // Stage 3: post a verification task and return its id so the agent UI
  // can poll for the worker's answer.
  const supabase = supabaseServer();
  const invoice = await createInvoice(
    bounty,
    `GroundTruth task: ${body.question.slice(0, 80)}`
  );

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      prompt: body.question,
      context: reasoning,
      category: "agent_question",
      bounty_sats: bounty,
      timeout_seconds: 300,
      agent_id: agentId,
      agent_payment_hash: invoice.payment_hash,
      status: "open",
    })
    .select()
    .single();

  if (error || !task) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create verification task" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    verdict: "needs_human_verification",
    draft,
    reasoning,
    task,
    invoice,
  });
}

// Drafts a candidate answer from web evidence and judges its own
// confidence. Returning confident=false is what triggers GroundTruth.
async function draftAndJudge(
  question: string,
  web: { title: string; url: string; content: string }[]
): Promise<{ confident: boolean; draft: string; reasoning: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      confident: false,
      draft: "I cannot answer with high confidence.",
      reasoning: "OpenAI is not configured locally.",
    };
  }

  const evidence = web.length
    ? web
        .slice(0, 3)
        .map(
          (r, i) =>
            `[Source ${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 400)}`
        )
        .join("\n\n")
    : "(no web search results)";

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an honest AI travel and information concierge. Given a user question and " +
          "web evidence, draft your best answer and then decide whether you can stand behind " +
          "it without real-time human verification.\n\n" +
          "Respond as strict JSON:\n" +
          '{ "draft": "<answer>", "confident": true|false, "reasoning": "<one sentence>" }\n\n' +
          "Set confident=false whenever the question requires real-time, on-the-ground, or " +
          "easily-changing information (current open/closed status, current wait time, " +
          "current price, current availability, things visible only by being at a place).",
      },
      {
        role: "user",
        content: `Question:\n${question}\n\nWeb evidence:\n${evidence}`,
      },
    ],
    // gpt-5.x reasoning models count internal thinking against this
    // budget; 1500 leaves enough room for both the thinking pass and
    // a complete JSON response.
    max_completion_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as {
      draft?: string;
      confident?: boolean;
      reasoning?: string;
    };
    return {
      confident: parsed.confident === true,
      draft: parsed.draft ?? "",
      reasoning: parsed.reasoning ?? "",
    };
  } catch {
    return {
      confident: false,
      draft: "",
      reasoning: "Failed to parse model response, defaulting to human verification.",
    };
  }
}
