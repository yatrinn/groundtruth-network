# groundtruth-sdk

Real-time human verification for AI agents, settled on the Bitcoin Lightning Network.

> **The TypeScript SDK for [GroundTruth Network](https://groundtruth-network.vercel.app).** When your agent needs to know what is actually true in the physical world — right now, anywhere on Earth — call `verify()`.

## Install

```bash
npm install groundtruth-sdk
# or
pnpm add groundtruth-sdk
```

## Quick start

```ts
import { GroundTruth } from "groundtruth-sdk";

const gt = new GroundTruth({ agentId: "my-travel-app" });

const result = await gt.verify({
  question: "Is Cafe Einstein in Berlin open today, or closed for renovation?",
  maxSats: 500,
});

if (result.kind === "verified") {
  console.log("Verified by a human:", result.answer);
} else if (result.kind === "answered_directly") {
  console.log("Answered without human help:", result.answer);
}
```

## How it works

1. `verify()` posts your question to the GroundTruth Network.
2. The platform agent searches the web, drafts a candidate answer, and judges its own confidence.
3. If the question requires real-time ground truth, the platform escalates to a human worker, funded with a Lightning bounty up to your `maxSats` cap.
4. The worker submits an answer. A plausibility gate filters obvious garbage. A Lightning payout settles to the worker.
5. `verify()` returns the final result — either an answer the agent stood behind, or a verified human answer with payout proof.

## API

### `new GroundTruth(options)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `agentId` | `string` | `"anonymous-agent"` | Free-form identifier for analytics. |
| `apiUrl` | `string` | `https://groundtruth-network.vercel.app` | API base URL. |
| `fetch` | `typeof fetch` | global `fetch` | Custom fetch implementation. |

### `gt.verify(input)`

| Input | Type | Default |
| --- | --- | --- |
| `question` | `string` | — |
| `maxSats` | `number` | `500` |
| `timeoutSeconds` | `number` | `90` |
| `context` | `string` | — |
| `category` | `string` | — |
| `pollIntervalMs` | `number` | `1000` |
| `signal` | `AbortSignal` | — |

Returns `VerifyResult`:

```ts
type VerifyResult =
  | { kind: "answered_directly"; answer; reasoning; sources }
  | { kind: "verified"; answer; task; payout }
  | { kind: "timeout"; task }
  | { kind: "rejected"; task; reason };
```

### Lower-level methods

- `gt.createTask({ prompt, bountySats, ... })` — skip the platform agent and go straight to a human worker.
- `gt.getTask(id)` — fetch the current state of a task.
- `gt.waitForTask(id, { timeoutSeconds, pollIntervalMs })` — poll until the task leaves an open state.

## Why Lightning

Card networks have a 30¢ minimum fee that makes a 30-cent payout uneconomic. Stablecoins introduce a corporate gatekeeper who can freeze any wallet. The Bitcoin Lightning Network is the first payment rail in history that is permissionless, instant, global, and cheap enough to make every AI verification a viable economic event. Every payout in GroundTruth is an LNURL-pay invoice resolved against the worker's wallet — no signup, no KYC, no email.

## License

MIT — open source from minute one. See the main repository for details.
