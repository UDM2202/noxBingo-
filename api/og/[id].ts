// /api/og/:id: the share card image. 1200x800 (3:2, what Farcaster
// requires) by default, 1200x630 with ?format=x. Unknown ids render a
// generic "Play NoxBingo" card.
//
// Elements are built with createElement instead of JSX so this file
// doesn't depend on how Vercel picks up the project's JSX settings.
import { createElement as h, type ReactElement, type ReactNode } from 'react';
import { ImageResponse } from '@vercel/og';
import { displayName, fetchShareRow, formatOren, shareIdFromRequest, type ShareRow } from '../_lib/shareResult';

export const config = { runtime: 'edge' };

const NAVY = '#0B0B45';
const CYAN = '#00E5FF';
const GOLD = '#FFD700';
const LAVENDER = '#8B8BD4';

function badge(text: string, color: string): ReactNode {
  return h('div', {
    style: {
      display: 'flex', padding: '10px 22px', borderRadius: 999, fontSize: 30, fontWeight: 700,
      color, border: `2px solid ${color}`, background: 'rgba(255,255,255,0.05)',
    },
  }, text);
}

function resultBody(row: ShareRow, compact: boolean): ReactNode {
  const name = displayName(row);
  const isWin = row.outcome === 'win';
  const badges: ReactNode[] = [];
  if (row.jackpot_oren > 0) badges.push(badge(`+${formatOren(row.jackpot_oren)} OREN JACKPOT`, GOLD));
  if (row.nox_bonus > 0) badges.push(badge(`+${formatOren(row.nox_bonus)} NOX BONUS`, CYAN));

  return h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 16 : 24 } },
    name
      ? h('div', { style: { display: 'flex', fontSize: compact ? 44 : 52, color: '#fff', fontWeight: 600 } }, name)
      : null,
    h('div', {
      style: {
        display: 'flex', fontSize: compact ? 104 : 120, fontWeight: 800, letterSpacing: '-0.02em',
        color: isWin ? GOLD : LAVENDER,
      },
    }, `${isWin ? 'WON' : 'LOST'} ${formatOren(row.amount_oren)} OREN`),
    badges.length > 0
      ? h('div', { style: { display: 'flex', gap: 16, marginTop: 8 } }, ...badges)
      : null,
  );
}

function genericBody(compact: boolean): ReactNode {
  return h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 } },
    h('div', { style: { display: 'flex', fontSize: compact ? 96 : 112, fontWeight: 800, color: GOLD } }, 'Play NoxBingo'),
    h('div', { style: { display: 'flex', fontSize: 36, color: LAVENDER } }, 'Real-money bingo on Solana. Win OREN.'),
  );
}

export default async function handler(req: Request): Promise<Response> {
  const compact = new URL(req.url).searchParams.get('format') === 'x';
  const width = 1200;
  const height = compact ? 630 : 800;
  const row = await fetchShareRow(shareIdFromRequest(req));

  const card = h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: compact ? '40px 56px' : '56px 64px',
      background: `radial-gradient(ellipse at 50% 40%, #1A1A5E 0%, ${NAVY} 70%)`,
      color: '#fff', fontFamily: 'sans-serif',
    },
  },
    h('div', { style: { display: 'flex', alignItems: 'center', fontSize: 48, fontWeight: 800, letterSpacing: '0.04em' } },
      h('span', { style: { color: CYAN } }, 'NOX'),
      h('span', { style: { color: '#fff' } }, 'BINGO'),
    ),
    row ? resultBody(row, compact) : genericBody(compact),
    h('div', {
      style: {
        display: 'flex', fontSize: 30, color: CYAN, padding: '10px 28px', borderRadius: 12,
        border: '1px solid rgba(0,229,255,0.4)', background: 'rgba(0,229,255,0.08)',
      },
    }, 'Play at noxbingo.io'),
  );

  return new ImageResponse(card as ReactElement, {
    width,
    height,
    headers: { 'Cache-Control': 'public, immutable, no-transform, max-age=86400' },
  });
}
