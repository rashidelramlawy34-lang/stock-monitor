import { useAlerts } from '../hooks/useAlerts.js';

export default function AlertBanner() {
  const { triggered, deleteAlert } = useAlerts();
  if (triggered.length === 0) return null;

  return (
    <div style={{
      background: 'var(--warn-soft)',
      borderBottom: '1px solid var(--warn)',
      padding: '8px 20px',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
      }}>
        <span style={{
          fontSize: 12, fontWeight: 500, color: 'var(--warn)',
          fontFamily: 'var(--font-sans)', flexShrink: 0,
        }}>
          Alerts triggered
        </span>
        {triggered.map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(217,119,6,0.1)',
            border: '1px solid rgba(217,119,6,0.3)',
            borderRadius: 'var(--radius-pill)',
            padding: '2px 10px 2px 8px',
            fontSize: 12, color: 'var(--text)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 }}>{a.ticker}</span>
            <span style={{ color: 'var(--text-2)' }}>
              {a.type === 'above' ? '↑' : '↓'} ${a.target_price?.toFixed(2)}
            </span>
            <button
              onClick={() => deleteAlert(a.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 0, lineHeight: 1,
                fontSize: 13, marginLeft: 2,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
