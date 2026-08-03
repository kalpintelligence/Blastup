/**
 * Skeleton shimmer components
 * Use these instead of spinners for a polished loading experience.
 */

// ── Stat Card Skeleton ──────────────────────────────────────
export function SkeletonStatCard() {
  return (
    <div className="skeleton-card">
      <div className="flex items-center justify-between">
        <div className="shimmer-text sk-label shimmer" />
        <div className="shimmer-circle shimmer" style={{ width: 16, height: 16 }} />
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
        <div className="shimmer sk-value" />
        <div className="shimmer sk-badge" />
      </div>
    </div>
  );
}

// ── Chat Row Skeleton ──────────────────────────────────────
export function SkeletonChatRow() {
  return (
    <div className="skeleton-chat-row">
      <div className="shimmer-circle shimmer sk-avatar" />
      <div className="sk-body">
        <div className="shimmer sk-name shimmer-text" />
        <div className="shimmer sk-preview shimmer-text" />
      </div>
      <div className="shimmer sk-time shimmer-text" />
    </div>
  );
}

// ── Contact Table Row Skeleton ──────────────────────────────
export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  const widths = ['15%', '28%', '25%', '20%', '12%'];
  return (
    <div className="skeleton-table-row">
      <div className="shimmer-circle shimmer" style={{ width: 36, height: 36, flexShrink: 0 }} />
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="shimmer shimmer-text"
          style={{ width: widths[i] || '20%', height: 12 }}
        />
      ))}
    </div>
  );
}

// ── Log Row Skeleton ────────────────────────────────────────
export function SkeletonLogRow() {
  return (
    <div className="skeleton-log-row">
      <div className="shimmer sk-badge-sm" />
      <div className="shimmer sk-msg shimmer-text" />
      <div className="shimmer sk-time shimmer-text" />
    </div>
  );
}

// ── Bar Chart Skeleton ──────────────────────────────────────
const BAR_HEIGHTS = ['40%', '65%', '90%', '55%', '75%', '45%', '80%'];
export function SkeletonBarChart() {
  return (
    <div className="skeleton-bar-chart">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="skeleton-bar shimmer"
          style={{ height: h, animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}

// ── Profile Header Skeleton ─────────────────────────────────
export function SkeletonProfile() {
  return (
    <div className="skeleton-profile-header">
      <div className="shimmer-circle shimmer sk-avatar-lg" />
      <div className="sk-info">
        <div className="shimmer shimmer-text" style={{ width: '40%', height: 20 }} />
        <div className="shimmer shimmer-text" style={{ width: '25%', height: 13 }} />
        <div className="shimmer shimmer-text" style={{ width: '55%', height: 11 }} />
      </div>
    </div>
  );
}

// ── WhatsApp Status Card Skeleton ───────────────────────────
export function SkeletonStatusCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="flex items-center justify-between">
        <div className="shimmer shimmer-text" style={{ width: '40%', height: 16 }} />
        <div className="shimmer" style={{ width: 80, height: 24, borderRadius: 99 }} />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="shimmer shimmer-text" style={{ width: '30%', height: 11 }} />
          <div className="shimmer shimmer-text" style={{ width: '35%', height: 11 }} />
        </div>
      ))}
    </div>
  );
}

// ── Generic block shimmer ───────────────────────────────────
export function Shimmer({
  width = '100%',
  height = 14,
  radius = 6,
  style = {},
}: {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="shimmer"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
