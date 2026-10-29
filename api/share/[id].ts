// /r/:id (rewritten here by vercel.json): a tiny HTML page whose meta tags
// make Farcaster and X show the result card. People are redirected to the
// game; crawlers only read the tags. Unknown ids get a generic card so a
// shared link never breaks.
import { MINIAPP_ORIGIN, displayName, fetchShareRow, formatOren, shareIdFromRequest } from '../_lib/shareResult';

export const config = { runtime: 'edge' };

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req: Request): Promise<Response> {
  const origin = new URL(req.url).origin;
  const id = shareIdFromRequest(req);
  const row = await fetchShareRow(id);

  let title = 'NoxBingo: Play Bingo, Win Crypto';
  let description = 'A real-money Solana bingo game. Pay with SOL or OREN, win OREN.';
  if (row) {
    const name = displayName(row) ?? 'A player';
    title = row.outcome === 'win'
      ? `${name} just won ${formatOren(row.amount_oren)} OREN on NoxBingo`
      : `${name} lost ${formatOren(row.amount_oren)} OREN on NoxBingo`;
    description = row.outcome === 'win'
      ? 'Think you can beat that? Play NoxBingo.'
      : 'Your turn to try. Play NoxBingo.';
  }

  const imagePath = row ? `/api/og/${row.id}` : '/api/og/generic';
  const imageUrl = origin + imagePath;
  const pageUrl = row ? `${origin}/r/${row.id}` : origin + '/';

  const embed = (actionType: 'launch_miniapp' | 'launch_frame') => JSON.stringify({
    version: '1',
    imageUrl,
    button: {
      title: '🎱 Play NoxBingo',
      action: {
        type: actionType,
        name: 'NoxBingo',
        url: MINIAPP_ORIGIN + '/miniapp',
        splashImageUrl: MINIAPP_ORIGIN + '/splash.png',
        splashBackgroundColor: '#0B0B45',
      },
    },
  });

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="NoxBingo" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(imageUrl)}" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(imageUrl + '?format=x')}" />
<meta name="fc:miniapp" content="${esc(embed('launch_miniapp'))}" />
<meta name="fc:frame" content="${esc(embed('launch_frame'))}" />
<style>html,body{margin:0;background:#0B0B45;color:#fff;font-family:system-ui,sans-serif}main{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:16px;text-align:center}a{color:#00E5FF}</style>
</head>
<body>
<main>
<p>${esc(title)}</p>
<a href="/">Play NoxBingo</a>
</main>
<script>location.replace('/');</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
}
