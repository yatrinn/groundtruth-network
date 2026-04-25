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
export async function createInvoice(
  amount_sats: number,
  memo: string
): Promise<LightningInvoice> {
  if (isMock) return mockInvoice(amount_sats, memo);
  return realCreateInvoice(amount_sats, memo);
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
  _addr: string,
  _amount: number,
  _memo: string
): Promise<PaymentResult> {
  // Tiny delay so the UI shows a believable settlement animation.
  await new Promise((r) => setTimeout(r, 350));
  return {
    success: true,
    payment_hash: generateRandomHex(32),
    preimage: generateRandomHex(32),
    fee_sats: 1,
  };
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
