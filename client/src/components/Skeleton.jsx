export function SkeletonLine({ width = '100%', height = 14, style }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 4, ...style }}
    />
  );
}

export function SkeletonCard({ rows = 3, style }) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      <SkeletonLine width="40%" height={12} />
      <SkeletonLine width="65%" height={28} />
      {rows > 2 && <SkeletonLine width="50%" height={12} />}
    </div>
  );
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 20px' }}>
          <div className="skeleton" style={{ height: 13, width: i === 0 ? '60%' : '80%', borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonPage({ cards = 4 }) {
  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <SkeletonLine width={180} height={22} style={{ marginBottom: 8 }} />
        <SkeletonLine width={120} height={13} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {Array.from({ length: cards }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="card" style={{ padding: 20 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <SkeletonLine width="15%" height={13} />
            <SkeletonLine width="25%" height={13} />
            <SkeletonLine width="20%" height={13} />
            <SkeletonLine width="18%" height={13} />
          </div>
        ))}
      </div>
    </div>
  );
}
