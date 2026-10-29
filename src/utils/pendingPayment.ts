/**
 * Remembers an entry-fee payment that went through on-chain but hasn't
 * been confirmed by the server yet.
 *
 * Without this, a failed server check left the player with no option but
 * to pay again, and every retry took another payment. With it, a retry
 * re-sends the SAME transaction for checking, so the player is never
 * charged twice. The server only accepts each transaction once, so
 * re-sending is always safe.
 *
 * Stored in this browser only, one pending payment per wallet.
 */

export type PendingPayment = {
  wallet: string;
  signature: string;
  bundleId: string;
  bundleLabel: string;
  currency: 'OREN' | 'SOL';
  amount: number;
  createdAt: number;
};

const STORAGE_KEY = 'noxbingo-pending-payments';
// Old entries are dropped after a week. By then the payment has either been
// confirmed or needs a manual refund from support.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function readAll(): Record<string, PendingPayment> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, PendingPayment>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked (private mode etc.). The payment still went through;
    // it just can't be remembered after a reload.
  }
}

export function loadPendingPayment(wallet: string): PendingPayment | null {
  const entry = readAll()[wallet];
  if (!entry || typeof entry.signature !== 'string') return null;
  if (Date.now() - entry.createdAt > MAX_AGE_MS) {
    clearPendingPayment(wallet);
    return null;
  }
  return entry;
}

export function savePendingPayment(payment: PendingPayment) {
  const all = readAll();
  all[payment.wallet] = payment;
  writeAll(all);
}

export function clearPendingPayment(wallet: string) {
  const all = readAll();
  if (all[wallet]) {
    delete all[wallet];
    writeAll(all);
  }
}
