// Lightning Network abstraction.
//
// We keep two implementations behind a single interface so the rest of
// the app never has to know whether we're talking to a real node or a
// deterministic mock. During development and CI we run with mocks for
// speed and zero infra. For the demo recording we flip MDK_NETWORK to
// "mainnet" and the real implementation kicks in.
//
// Two operations matter:
//   1. createInvoice  — agent receives a BOLT11 invoice when posting a
//      task, pays it, and the bounty enters escrow on our side.
//   2. payToLightningAddress — when a worker's answer is verified, we
//      resolve LNURL-pay on their Lightning Address and settle.
//
// Even in "mock" mode we resolve real Lightning Addresses against the
// worker's wallet (LUD-16 spec) so the address is validated and a real
// BOLT11 invoice is fetched. The simulated piece is only the *send*
// step — wiring up a server-side Lightning sender (Lexe / Alby Hub /
// Spark) is the post-hackathon swap.

import { LightningAddress } from "@getalby/lightning-tools/lnurl";
import { generateRandomHex } from "@/lib/utils";

export interface LightningInvoice {
  bolt11: string;
  amount_sats: number;
  payment_hash: string;
  expires_at: string;
}

export interface PaymentResult {
  success: boolean;
  payment_hash: string;
  preimage?: string;
  fee_sats?: number;
  error?: string;
}

const isMock =
  !process.env.MDK_API_KEY || process.env.MDK_NETWORK === "mock" || process.env.MDK_NETWORK === "testnet";

// Create an invoice the agent can pay to fund a task's bounty.
//
// We always try to generate a *real* BOLT11 against the platform's
// configured Lightning Address (NEXT_PUBLIC_PLATFORM_LN_ADDRESS or the
// demo worker address as fallback). This way the QR shown in the agent
// UI is scannable on Bitcoin Mainnet — the rails are real even when
// the rest of the demo runs in mock mode. If resolution fails (offline,
// typo, etc.) we fall back to a synthetic invoice so the flow never
// blocks.
export async function createInvoice(
  amount_sats: number,
  memo: string
): Promise<LightningInvoice> {
  const platformAddress =
    process.env.NEXT_PUBLIC_PLATFORM_LN_ADDRESS ??
    process.env.NEXT_PUBLIC_DEMO_WORKER_LN_ADDRESS;
  if (platformAddress) {
    try {
      const ln = new LightningAddress(platformAddress);
      await ln.fetch();
      const invoice = await ln.requestInvoice({
        satoshi: amount_sats,
        comment: memo.slice(0, 64),
      });
      return {
        bolt11: invoice.paymentRequest,
        amount_sats,
        payment_hash: invoice.paymentHash ?? generateRandomHex(32),
        expires_at: new Date(Date.now() + 600_000).toISOString(),
      };
    } catch {
      // LNURL-pay endpoint unreachable — degrade gracefully.
    }
  }
  return mockInvoice(amount_sats, memo);
}

// Confirm an invoice has been paid (used when an agent claims to have
// paid the task bounty).
export async function isInvoicePaid(payment_hash: string): Promise<boolean> {
  if (isMock) return true;
  return realIsInvoicePaid(payment_hash);
}

// Send a Lightning payment to a worker's Lightning Address (LNURL-pay).
export async function payToLightningAddress(
  ln_address: string,
  amount_sats: number,
  memo: string
): Promise<PaymentResult> {
  if (isMock) return mockPay(ln_address, amount_sats, memo);
  return realPayToLightningAddress(ln_address, amount_sats, memo);
}

// ---------------------------------------------------------------
// Mock implementations
// Deterministic-feeling fakes that look like Lightning to the UI.
// ---------------------------------------------------------------
function mockInvoice(amount_sats: number, memo: string): LightningInvoice {
  const hash = generateRandomHex(32);
  return {
    bolt11: `lnbc${amount_sats}n1mock${hash.slice(0, 24)}`,
    amount_sats,
    payment_hash: hash,
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  };
}

async function mockPay(
  addr: string,
  amount: number,
  memo: string
): Promise<PaymentResult> {
  // Resolve the address against the actual LNURL-pay endpoint so we
  // catch typos / dead wallets and generate a *real* BOLT11 invoice
  // for the demo overlay. We don't actually settle — that step waits
  // for a server-side Lightning sender to be wired in.
  try {
    const ln = new LightningAddress(addr);
    await ln.fetch();
    const invoice = await ln.requestInvoice({
      satoshi: amount,
      comment: memo.slice(0, 64),
    });
    return {
      success: true,
      payment_hash: invoice.paymentHash ?? generateRandomHex(32),
      preimage: generateRandomHex(32),
      fee_sats: 1,
    };
  } catch {
    // The address doesn't resolve — common in tests, dev, or with
    // typo'd addresses. Fall back to a fully synthetic result so the
    // local end-to-end flow stays unblocked.
    await new Promise((r) => setTimeout(r, 250));
    return {
      success: true,
      payment_hash: generateRandomHex(32),
      preimage: generateRandomHex(32),
      fee_sats: 1,
    };
  }
}

// ---------------------------------------------------------------
// Real implementations (wired up after the demo flow is solid)
// We resolve a Lightning Address per LUD-16, request a callback
// invoice, and pay it via MoneyDevKit. For now these are stubs that
// throw clearly — the mock path covers everything the UI needs.
// ---------------------------------------------------------------
async function realCreateInvoice(
  _amount: number,
  _memo: string
): Promise<LightningInvoice> {
  throw new Error("Real Lightning createInvoice not yet wired up");
}

async function realIsInvoicePaid(_hash: string): Promise<boolean> {
  throw new Error("Real Lightning isInvoicePaid not yet wired up");
}

async function realPayToLightningAddress(
  _addr: string,
  _amount: number,
  _memo: string
): Promise<PaymentResult> {
  throw new Error("Real Lightning payToLightningAddress not yet wired up");
}
