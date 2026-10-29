// Shared by the share page (/r/:id) and the card image (/api/og/:id).
// Files under api/_lib are not routes.

export type ShareRow = {
  id: string;
  outcome: 'win' | 'loss';
  amount_oren: number;
  jackpot_oren: number;
  nox_bonus: number;
  display_name: string | null;
  name_source: 'farcaster' | 'typed' | null;
};

const ID_RE = /^[A-Za-z0-9]{10}$/;

// The Mini App's manifest is signed for this domain, so "Play" buttons
// launch it from here even when the share link is on another domain.
export const MINIAPP_ORIGIN = (process.env.MINIAPP_ORIGIN || 'https://nox-bingo-8x9m.vercel.app').replace(/\/$/, '');

/** Result id from ?id= (Vercel route param) or the last path segment. */
export function shareIdFromRequest(req: Request): string | null {
  const url = new URL(req.url);
  const candidate = url.searchParams.get('id') || url.pathname.split('/').filter(Boolean).pop() || '';
  return ID_RE.test(candidate) ? candidate : null;
}

export async function fetchShareRow(id: string | null): Promise<ShareRow | null> {
  if (!id) return null;
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key) {
    console.error('[share] SUPABASE_URL / SUPABASE_ANON_KEY not set');
    return null;
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/share_results?id=eq.${id}&select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as ShareRow[];
    const row = rows[0];
    if (!row || (row.outcome !== 'win' && row.outcome !== 'loss')) return null;
    return {
      ...row,
      amount_oren: Number(row.amount_oren) || 0,
      jackpot_oren: Number(row.jackpot_oren) || 0,
      nox_bonus: Number(row.nox_bonus) || 0,
    };
  } catch (err) {
    console.error('[share] fetch failed:', err);
    return null;
  }
}

export function formatOren(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** "@mayowa" for Farcaster names, "Mayowa" for typed ones, null if unset. */
export function displayName(row: ShareRow): string | null {
  if (!row.display_name) return null;
  return row.name_source === 'farcaster' ? '@' + row.display_name : row.display_name;
}
