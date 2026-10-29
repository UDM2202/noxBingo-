import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useAppEnv } from '../appEnv';
import type { ShareResult } from '../hooks/useMultiplayer';

const NAME_STORAGE_KEY = 'noxbingo-share-name';

function cleanTypedName(raw: string): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001f\u007f<>@]/g, '').slice(0, 20);
}

function formatOren(amount: number): string {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function buildShareText(result: ShareResult, name: string | null): string {
  if (result.outcome === 'win') {
    const jackpot = result.jackpotOren > 0 ? ` + ${formatOren(result.jackpotOren)} OREN jackpot!` : '';
    return `${name ?? 'I'} just won ${formatOren(result.amountOren)} OREN on NoxBingo 🎱${jackpot} Think you can beat that?`;
  }
  return `${name ?? 'I'} lost ${formatOren(result.amountOren)} OREN on NoxBingo. Your turn to try 🎱`;
}

interface SharePanelProps {
  result: ShareResult;
  onSetShareName: (resultId: string, displayName: string, source: 'farcaster' | 'typed') => void;
}

/**
 * Lets the player share their game result to Farcaster or X. Sharing is
 * always their choice; the name on the card is set once per result.
 */
function SharePanel({ result, onSetShareName }: SharePanelProps) {
  const env = useAppEnv();
  const [fcUsername, setFcUsername] = useState<string | null>(null);
  const [typedName, setTypedName] = useState(() => {
    try { return cleanTypedName(localStorage.getItem(NAME_STORAGE_KEY) || ''); } catch { return ''; }
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (env !== 'miniapp') return;
    let cancelled = false;
    sdk.context
      .then(ctx => {
        const username = ctx?.user?.username;
        if (!cancelled && username && /^[a-z0-9_.-]{1,20}$/.test(username)) setFcUsername(username);
      })
      .catch(() => { /* no username, share without one */ });
    return () => { cancelled = true; };
  }, [env]);

  const trimmedTyped = typedName.trim();
  const shownName = fcUsername ? '@' + fcUsername : trimmedTyped || null;
  const shareUrl = `${window.location.origin}/r/${result.resultId}`;
  const text = buildShareText(result, shownName);

  // Send the card's name before the first share. Not awaited: the popup
  // must open within the click, and the card is fetched later anyway.
  function lockInName() {
    if (result.nameSaved) return;
    if (fcUsername) {
      onSetShareName(result.resultId, fcUsername, 'farcaster');
    } else if (trimmedTyped) {
      try { localStorage.setItem(NAME_STORAGE_KEY, trimmedTyped); } catch { /* ignore */ }
      onSetShareName(result.resultId, trimmedTyped, 'typed');
    }
  }

  function openExternal(url: string) {
    if (env === 'miniapp') sdk.actions.openUrl(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  }

  function shareFarcaster() {
    lockInName();
    if (env === 'miniapp') {
      sdk.actions.composeCast({ text, embeds: [shareUrl] }).catch(err => console.error('composeCast failed', err));
      return;
    }
    openExternal(`https://farcaster.xyz/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(shareUrl)}`);
  }

  function shareX() {
    lockInName();
    openExternal(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`);
  }

  async function copyLink() {
    lockInName();
    const isTouch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    if (env === 'web' && isTouch && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text, url: shareUrl });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', shareUrl);
    }
  }

  const buttonStyle = { flex: '1 1 0', minWidth: '96px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' } as const;

  return (
    <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,255,0.2)', textAlign: 'left' }}>
      <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5C5C9E', marginBottom: '10px', textAlign: 'center' }}>Share your result</p>
      {!fcUsername && (
        <label style={{ display: 'block', marginBottom: '12px' }}>
          <span style={{ display: 'block', fontSize: '12px', color: '#8B8BD4', marginBottom: '4px' }}>Name to show on your card</span>
          <input
            value={typedName}
            onChange={e => setTypedName(cleanTypedName(e.target.value))}
            disabled={result.nameSaved}
            maxLength={20}
            placeholder="Optional"
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: '#1A1A5E', color: '#fff', fontSize: '14px', opacity: result.nameSaved ? 0.6 : 1 }}
          />
        </label>
      )}
      {fcUsername && (
        <p style={{ fontSize: '12px', color: '#8B8BD4', marginBottom: '12px', textAlign: 'center' }}>Sharing as <span style={{ color: '#00E5FF' }}>@{fcUsername}</span></p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={shareFarcaster} style={{ ...buttonStyle, border: '1px solid rgba(138,99,210,0.6)', background: 'rgba(138,99,210,0.18)', color: '#C9B6F2' }}>Farcaster</button>
        <button onClick={shareX} style={{ ...buttonStyle, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', color: '#fff' }}>Share on X</button>
        <button onClick={copyLink} style={{ ...buttonStyle, border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>{copied ? 'Copied' : 'Copy link'}</button>
      </div>
    </div>
  );
}

export default SharePanel;
