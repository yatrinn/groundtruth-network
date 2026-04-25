// Open Graph preview image for the entire site.
//
// Next.js renders this at request time and caches it. When the GroundTruth
// URL is shared on Twitter, Slack, or anywhere that scrapes OG metadata,
// this is the card that appears.
//
// The aim is composure, not pyrotechnics: a confident headline, the wedge
// in one line, and the bare network identity. No emoji, no mascot, no
// hackathon noise.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export const alt =
  "GroundTruth Network — real-time human verification for AI agents, on the Bitcoin Lightning Network.";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(circle at 80% 20%, rgba(251,146,60,0.18) 0%, transparent 50%), #09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "24px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          <span>GroundTruth</span>
          <span style={{ color: "#fb923c" }}>.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "84px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: "#fafafa",
            }}
          >
            The ground-truth layer
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "84px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: "#fb923c",
            }}
          >
            for the agent economy.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              maxWidth: "880px",
              color: "#a1a1aa",
              lineHeight: 1.4,
            }}
          >
            AI agents pay humans worldwide to verify what is actually true,
            settled in seconds on the Bitcoin Lightning Network.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "32px",
            fontSize: "16px",
            color: "#71717a",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span>Bitcoin Lightning Mainnet</span>
          <span>·</span>
          <span>L402 + LNURL-pay</span>
          <span>·</span>
          <span>Open source</span>
        </div>
      </div>
    ),
    size,
  );
}
