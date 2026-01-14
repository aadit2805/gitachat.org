export function LotusIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      {/* Center petal */}
      <path d="M12 3c-1.5 4-1.5 8 0 12 1.5-4 1.5-8 0-12z" />
      {/* Left petals */}
      <path d="M12 15c-2-3-5-5-8-5 2 4 5 7 8 8z" />
      <path d="M12 15c-1.5-2-3.5-4-6-5 1.5 3.5 4 5.5 6 6z" />
      {/* Right petals */}
      <path d="M12 15c2-3 5-5 8-5-2 4-5 7-8 8z" />
      <path d="M12 15c1.5-2 3.5-4 6-5-1.5 3.5-4 5.5-6 6z" />
      {/* Base */}
      <path d="M8 20c2-2 4-3 4-5 0 2 2 3 4 5" />
    </svg>
  );
}
