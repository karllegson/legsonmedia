export default function WorkShellLoading() {
  return (
    <div className="wk-page-loading" aria-busy="true" aria-label="Loading page">
      <div className="wk-page-loading-bar" />
      <div className="wk-stack">
        <div className="wk-card wk-card-pad wk-skeleton-block" style={{ height: 88 }} />
        <div className="wk-stats">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="wk-stat wk-skeleton-block"
              style={{ minHeight: 108 }}
            />
          ))}
        </div>
        <div className="wk-card wk-skeleton-block" style={{ minHeight: 220 }} />
      </div>
    </div>
  );
}
