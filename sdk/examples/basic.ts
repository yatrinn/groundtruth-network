// Run with: pnpm tsx examples/basic.ts
//
// Demonstrates the canonical agent integration: ask GroundTruth to
// verify a fact that requires real-time ground truth, then act on
// the answer.

import { GroundTruth } from "../src/index.js";

async function main() {
  const gt = new GroundTruth({ agentId: "example-travel-bot" });

  const result = await gt.verify({
    question: "Is Cafe Einstein on Kurfuerstenstrasse in Berlin open right now, or closed for renovation?",
    maxSats: 500,
    timeoutSeconds: 120,
  });

  switch (result.kind) {
    case "answered_directly":
      console.log("[direct]", result.answer);
      console.log("reasoning:", result.reasoning);
      break;
    case "verified":
      console.log("[verified]", result.answer);
      console.log("payout:", result.payout.payment_hash, `(${result.payout.amount_sats} sats)`);
      break;
    case "timeout":
      console.log("[timeout] no worker responded in time. Task id:", result.task.id);
      break;
    case "rejected":
      console.log("[rejected]", result.reason);
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
