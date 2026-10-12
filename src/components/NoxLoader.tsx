import { useId } from 'react';

/**
 * Loading indicator: the NOX "N" sitting in its glowing circle, with a
 * bright arc of light orbiting the ring. Use it anywhere a spinner would
 * go — it replaces the plain spinning circle.
 *
 *   <NoxLoader />                       // 96px
 *   <NoxLoader size={64} label="Connecting..." />
 */
interface NoxLoaderProps {
  size?: number;
  label?: string;
}

// Ring geometry in the 512-unit logo space.
const RING_R = 156;
const RING_LEN = 2 * Math.PI * RING_R;

const LOADER_CSS = `
@keyframes nox-loader-orbit { to { transform: rotate(360deg); } }
@keyframes nox-loader-breathe { 0%, 100% { opacity: .75; } 50% { opacity: 1; } }
.nox-loader-orbit { transform-origin: 256px 256px; animation: nox-loader-orbit 1.15s linear infinite; }
.nox-loader-breathe { animation: nox-loader-breathe 2.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .nox-loader-orbit { animation-duration: 4s; }
}
`;

function NoxLoader({ size = 96, label }: NoxLoaderProps) {
  // Unique ids so several loaders on one page never share gradients.
  const uid = useId().replace(/:/g, '');
  const discId = 'nox-disc-' + uid;
  const nId = 'nox-n-' + uid;

  return (
    <div
      role="status"
      aria-label={label || 'Loading'}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
    >
      <style>{LOADER_CSS}</style>
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        style={{ overflow: 'visible', filter: 'drop-shadow(0 0 14px rgba(0,190,235,0.35))' }}
      >
        <defs>
          <radialGradient id={discId} cx="42%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#2b2a88" />
            <stop offset="100%" stopColor="#14145c" />
          </radialGradient>
          <linearGradient id={nId} x1="207" y1="198" x2="305" y2="308" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F4D326" />
            <stop offset="100%" stopColor="#A9A0BD" />
          </linearGradient>
        </defs>

        {/* The disc and a faint, steady ring — the logo at rest */}
        <circle cx="256" cy="256" r={RING_R} fill={`url(#${discId})`} />
        <circle cx="256" cy="256" r={RING_R} fill="none" stroke="#00B4DC" strokeWidth="10" opacity="0.28" />

        {/* The bright arc that orbits the ring */}
        <g className="nox-loader-orbit">
          <circle
            cx="256"
            cy="256"
            r={RING_R}
            fill="none"
            stroke="#00D5FF"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${RING_LEN * 0.3} ${RING_LEN}`}
          />
        </g>

        {/* The N */}
        <path
          className="nox-loader-breathe"
          d="M207 308 V198 H238 L275 262 V198 H305 V308 H274 L237 244 V308 Z"
          fill={`url(#${nId})`}
        />
      </svg>
      {label && (
        <span style={{ color: '#5C5C9E', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </span>
      )}
    </div>
  );
}

export default NoxLoader;