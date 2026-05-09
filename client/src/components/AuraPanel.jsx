import { useState } from 'react';

const MESSAGES = [
  { label: 'Summary',  text: 'Portfolio outperforming SPY by +4.21% over 3 months. Top holding driving YTD gains.' },
  { label: 'Risk',     text: 'TSLA correlation to portfolio dropped — adds diversification but increases beta.' },
  { label: 'Earnings', text: 'Check calendar for upcoming earnings. Monitor implied move vs position size.' },
];

const ACTIONS = ['Rebalance', 'Risk scan', 'Screener', 'Ask AI'];

export default function AuraPanel() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, width: 304, zIndex: 50,
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      transform: open ? 'translateY(0)' : 'translateY(calc(100% - 40px))',
      transition: 'transform 0.22s ease',
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--border)' : 'none',
          userSelect: 'none',
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent)', flexShrink: 0,
        }} />
        <span style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text)',
          flex: 1, fontFamily: 'var(--font-sans)',
        }}>
          AI Advisor
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {open ? 'analyzing…' : 'show'}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" stroke="var(--text-muted)"
          strokeWidth="1.5" fill="none"
          style={{ transform: open ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M3 5l3 3 3-3" />
        </svg>
      </div>

      {/* Messages */}
      <div style={{ padding: '12px 14px', maxHeight: 180, overflowY: 'auto' }}>
        {MESSAGES.map((m, i) => (
          <div key={i} style={{
            fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55,
            marginBottom: i < MESSAGES.length - 1 ? 10 : 0,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text)',
              marginRight: 6, fontFamily: 'var(--font-sans)',
            }}>
              {m.label}
            </span>
            {m.text}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        padding: '0 14px 12px',
        borderTop: '1px solid var(--border)',
        paddingTop: 10,
      }}>
        {ACTIONS.map(a => (
          <button key={a} className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
