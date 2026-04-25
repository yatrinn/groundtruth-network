// Thin OpenAI wrapper. Used in two places:
//
//   1. The demo agent UI generates an honest "I don't know" answer and
//      then asks GroundTruth to verify a fact.
//   2. The server runs a lightweight plausibility check on a worker's
//      submitted answer before releasing the bounty.
//
// Model is configurable via OPENAI_MODEL so we can swap in newer
// models without touching call sites.

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  // Soft warn — the app must still build for routes that don't use AI.
  // eslint-disable-next-line no-console
  console.warn("[openai] OPENAI_API_KEY is not set; AI features will be disabled.");
}

export const openai = new OpenAI({ apiKey });

// Default to the latest GA model (gpt-5.5, released April 2026). Override
// via OPENAI_MODEL env var. Reasoning-style models include internal
// thinking tokens in `max_completion_tokens`, so call sites budget
// generously — see usage in /api/agent/ask.
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.5";
