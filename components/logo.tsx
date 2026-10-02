export function Logo({ size = 32, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#0f766e" />
        <rect x="7" y="16" width="4.5" height="9" rx="1.5" fill="#fff" opacity=".7" />
        <rect x="13.75" y="10" width="4.5" height="15" rx="1.5" fill="#fff" />
        <rect x="20.5" y="6" width="4.5" height="19" rx="1.5" fill="#a3faef" />
      </svg>
      {withWordmark && <span className="text-lg font-bold tracking-tight">Atbit</span>}
    </span>
  );
}
