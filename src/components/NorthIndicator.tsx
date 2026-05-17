/** Screen-fixed north arrow (top-right of canvas). */
export function NorthIndicator() {
  return (
    <div className="north-indicator" aria-hidden title="North">
      <span className="north-label">N</span>
      <svg className="north-arrow" viewBox="0 0 24 40" width="24" height="40">
        <path
          d="M12 36 L12 8 M12 8 L5 18 M12 8 L19 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
