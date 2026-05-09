import { useMarket } from '../hooks/useMarket';
import { useEffect, useState } from 'react';

const INDICES = [
  { key: 'SPY', label: 'S&P 500' },
  { key: 'QQQ', label: 'Nasdaq' },
  { key: 'DIA', label: 'Dow' },
];

function isMarketOpen() {
  const now = new Date();
  const et  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day  = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
}

function pad(n) { return String(n).padStart(2, '0'); }

export default function MarketBar({ page, setPage, pageLabel }) {
  const { indices } = useMarket();
  const [time, setTime] = useState(new Date());
  const [tick, setTick] = useState(true);

  useEffect(() => {
    const id = setInterval(() => { setTime(new Date()); setTick(t => !t); }, 1000);
    return () => clearInterval(id);
  }, []);

  const open = isMarketOpen();
  const et   = new Date(time.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hh   = pad(et.getHours());
  const mm   = pad(et.getMinutes());
  const ss   = pad(et.getSeconds());
  const isHub = !page || page === 'hub';

  return (
    <div style={{
      height: 44, flexShrink: 0,
      display: 'flex', alignItems: 'center',
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--border)',
      position: 'relative', zIndex: 10,
    }}>

      {/* App name / back to hub */}
      <button
        onClick={() => setPage?.('hub')}
        style={{
          display: 'flex', alignItems: 'center', gap: 0,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 20px', height: '100%', flexShrink: 0,
          borderRight: '1px solid var(--border)',
        }}
      >
        <span style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text)',
          fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em',
        }}>
          Stock Monitor
        </span>
        {!isHub && (
          <span style={{
            fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'var(--font-sans)', marginLeft: 10,
            borderLeft: '1px solid var(--border)', paddingLeft: 10,
          }}>
            {pageLabel}
          </span>
        )}
      </button>

      {/* Active page underline tab (non-hub only) */}
      {!isHub && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          pointerEvents: 'none', display: 'flex',
        }}>
          <div style={{
            width: 142, height: 2,
            background: 'var(--accent)',
          }} />
        </div>
      )}

      {/* Index tickers */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px', overflow: 'hidden',
      }}>
        {INDICES.map(({ key, label }, i) => {
          const d   = indices[key];
          const pos = d ? d.change_pct >= 0 : null;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: 7, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{
                fontSize: 11, color: 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', fontWeight: 400,
              }}>
                {label}
              </span>
              {d ? (
                <>
                  <span style={{
                    color: 'var(--text)', fontWeight: 500,
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                  }}>
                    {d.price?.toFixed(2)}
                  </span>
                  <span style={{
                    color: pos ? 'var(--gain)' : 'var(--loss)',
                    fontSize: 11, fontFamily: 'var(--font-mono)',
                  }}>
                    {pos ? '+' : ''}{d.change_pct?.toFixed(2)}%
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>—</span>
              )}
              {i < INDICES.length - 1 && (
                <span style={{ width: 1, height: 12, background: 'var(--border)', display: 'inline-block' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Right: market status + clock */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: open ? 'var(--gain)' : 'var(--text-muted)',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 11, color: open ? 'var(--text-2)' : 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
          }}>
            {open ? 'Market open' : 'Market closed'}
          </span>
        </div>

        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--text-2)', letterSpacing: '0.02em',
        }}>
          {hh}
          <span style={{ opacity: tick ? 1 : 0.2 }}>:</span>
          {mm}
          <span style={{ opacity: tick ? 1 : 0.2 }}>:</span>
          {ss}
          <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 10 }}>ET</span>
        </span>
      </div>
    </div>
  );
}
