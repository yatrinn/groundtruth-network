// Small shared helpers that don't deserve their own module.

// Random hex string for mock payment hashes / preimages and
// for anonymous worker session ids.
export function generateRandomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Format an integer satoshi amount in a human-readable way:
//   1234 -> "1,234 sats"
//   1    -> "1 sat"
export function formatSats(sats: number): string {
  if (sats === 1) return "1 sat";
  return `${sats.toLocaleString("en-US")} sats`;
}

// Approximate USD value of a satoshi amount given a BTC price (USD).
// We only need this for "$0.30" style demo subtitles, not for accounting.
export function satsToUsd(sats: number, btcUsd: number = 100_000): string {
  const usd = (sats / 100_000_000) * btcUsd;
  if (usd < 0.01) return "<$0.01";
  return `$${usd.toFixed(2)}`;
}

// Validate a Lightning Address (LUD-16 style: name@host).
export function isValidLightningAddress(addr: string): boolean {
  return /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(addr);
}

// Time-since formatter: "2s ago", "5m ago", "1h ago".
export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
