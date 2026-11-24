/**
 * abbasapplio logo: a rounded violet gradient tile with a waveform mark.
 * Drawn as inline SVG so it stays crisp at any size and needs no asset file.
 */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="abbasapplio"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="abbas-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#abbas-grad)" />
      <g stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
        <line x1="12" y1="24" x2="12" y2="24" opacity="0" />
        <line x1="12" y1="20" x2="12" y2="28" />
        <line x1="18.5" y1="14" x2="18.5" y2="34" />
        <line x1="25" y1="10" x2="25" y2="38" />
        <line x1="31.5" y1="15" x2="31.5" y2="33" />
        <line x1="38" y1="21" x2="38" y2="27" />
      </g>
    </svg>
  );
}
