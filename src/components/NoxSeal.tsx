/**
 * The NOX sigil coin: a gold ring around an eight-pointed star, the same
 * mark as the NOX banner. Shared by the bingo card (stamped on called
 * numbers) and the quantum caller.
 *
 * `plain` drops the inner dotted ring (used on the bonus cell, which
 * already has its own pulsing gold ring). `dim` fades it (free space).
 */
interface NoxSealProps {
  size?: number | string;
  plain?: boolean;
  dim?: boolean;
}

function NoxSeal({ size = 40, plain = false, dim = false }: NoxSealProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" style={{ opacity: dim ? 0.55 : 1 }}>
      {/* Dark disc keeps a number readable if something passes behind the coin */}
      <circle cx="20" cy="20" r="17.5" fill="rgba(10,10,60,0.55)" />
      <circle cx="20" cy="20" r="18" fill="rgba(255,215,0,0.07)" stroke="rgba(255,215,0,0.85)" strokeWidth="1.5" />
      {!plain && (
        <circle cx="20" cy="20" r="14.5" fill="none" stroke="rgba(255,215,0,0.35)" strokeWidth="0.8" strokeDasharray="1.5 2.2" />
      )}
      <path
        d="M20 5 L22.4 17.6 L35 20 L22.4 22.4 L20 35 L17.6 22.4 L5 20 L17.6 17.6 Z"
        fill="rgba(255,215,0,0.14)"
        stroke="rgba(255,215,0,0.5)"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.8 9.8 L17 17 M30.2 9.8 L23 17 M9.8 30.2 L17 23 M30.2 30.2 L23 23"
        stroke="rgba(255,215,0,0.4)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default NoxSeal;