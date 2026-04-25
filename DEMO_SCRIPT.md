# Demo & Tech Video Scripts

Two 60-second videos for the HackNation submission. Record both at 1080p, clean audio, screen + voiceover. Final files: MP4, under 100MB each.

---

## Demo Video (60 seconds — UI/UX showcase)

**Goal:** A judge who has never heard of GroundTruth understands what we built and why it matters within 60 seconds. No jargon. Show, don't tell.

**Recording setup:**
- Two Chrome windows side by side, both at 1280x720.
- Left window: `/agent` page (the AI travel concierge demo)
- Right window: `/worker` page (the worker task feed)
- Wallet of Satoshi open on phone, propped where the camera can see it for the payout reveal

### Beat sheet

| Time | Visual | Voiceover |
|---|---|---|
| 0–5s | Landing page in full view, tagline visible | "AI agents hallucinate. They invent restaurant hours, miss real-time stock, and confidently lie about a world they cannot see." |
| 5–10s | Click "Try the agent demo", land on /agent | "GroundTruth lets agents pay humans, in seconds, anywhere on Earth, to verify what is actually true." |
| 10–18s | Agent persona "Travel Concierge" already selected. Click sample question: "Is Cafe Einstein in Berlin open today, or closed for renovation?" | "I'll ask the agent something it should not be able to answer from memory." |
| 18–28s | Watch the thinking pipeline animate: search → draft → judge → post | "It searches the web, drafts an answer, then judges its own confidence. Because this needs ground truth right now, it does the right thing — it admits uncertainty." |
| 28–38s | Right window flips to /worker. New task appears live. Click "Claim". Type answer: "Closed for renovation until Friday May 8." | "On the worker tab, a human anywhere on Earth sees the task, claims it, and answers. They never signed up. They just plugged in a Lightning Address." |
| 38–48s | Click "Submit & get paid". Lightning settle animation. Toast: "Paid 500 sats to averagevehicle485@walletofsatoshi.com" | "The moment the answer passes our plausibility check, Lightning settles. Cents per check. No KYC. No bank. No three-day wait." |
| 48–55s | Switch back to agent window. Pipeline now shows verify ✅. Bubble appears: "Verified by a human worker: Closed for renovation until Friday May 8." | "The agent has a verified, ground-truth answer, sourced and paid for in under a minute." |
| 55–60s | Cut back to landing page. Network stats counter ticked up. End card: "GroundTruth Network — Real-time human verification for AI agents. Built on Lightning." | "Scale AI takes weeks and six figures. We take 60 seconds and 30 cents — and we work everywhere." |

### Voiceover tone

Confident, short sentences, no hype words. Read the script aloud once before recording — anything that feels like a buzzword, cut.

---

## Tech Video (60 seconds — architecture and stack)

**Goal:** A technical judge sees how the system actually works and trusts that it is real.

### Beat sheet

| Time | Visual | Voiceover |
|---|---|---|
| 0–8s | Architecture diagram (ASCII or simple Figma) on screen | "GroundTruth is a Next.js app on Vercel, Postgres on Supabase, Lightning on the Bitcoin mainnet via L402 and LNURL-pay." |
| 8–18s | Open `src/app/api/agent/ask/route.ts`. Highlight the three stages: Tavily, OpenAI draft + judge, post task. | "The agent route does three things: search Tavily for evidence, ask the LLM to draft an answer and rate its own confidence, and only escalate to a human when ground truth is required." |
| 18–28s | Open `src/app/api/tasks/[id]/submit/route.ts`. Highlight the conditional update + plausibility gate + Lightning payout. | "Worker submissions go through a state-machine update — race-safe via a single conditional Postgres write — then a cheap LLM plausibility check, then a Lightning payout to the worker's address." |
| 28–38s | Open `src/lib/lightning.ts`. Show the LightningAddress import and the LNURL-pay invoice fetch. | "On every payout we resolve the worker's Lightning Address against the live LUD-16 endpoint. The BOLT11 invoice we get back is real. Swapping the send step from mock to mainnet is a single file change." |
| 38–48s | Open Supabase dashboard showing the tasks table populating live as the agent and worker tabs interact. | "Realtime is Postgres triggers via Supabase. The worker feed and the agent verification view both subscribe to the same task row — no polling, sub-second push." |
| 48–55s | Show GitHub repo with green CI / clean commits | "Open source, MIT licensed, every commit is on GitHub. The submission text, the schema, this script — all in the repo." |
| 55–60s | End card: github.com/yatrinn/groundtruth-network, Live URL | "GroundTruth Network. The verification layer for the agent economy." |

### Recording tips

- Quiet room. Use a real microphone, not the laptop one.
- Speak 10% slower than you think you should.
- Cut every "um" and "so" in the edit.
- Music: optional, low-volume ambient if any.
- Export as 1080p MP4, H.264, under 100MB.
