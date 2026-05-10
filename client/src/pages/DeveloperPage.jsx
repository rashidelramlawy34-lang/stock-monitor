import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TH = ({ children, right }) => (
  <th style={{ padding: '10px 16px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 400, textAlign: right ? 'right' : 'left' }}>{children}</th>
);

function StatBox({ label, value, color, index }) {
  return (
    <motion.div
      className="card"
      style={{ padding: 16, textAlign: 'center' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, delay: index * 0.05 }}
    >
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: color ?? 'var(--text)' }}>{value}</p>
    </motion.div>
  );
}

export default function DeveloperPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/developer/stats', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Developer console</h1>
          <p className="page-subtitle">System telemetry and account management</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Logged in as <span style={{ color: 'var(--accent)' }}>{user?.name}</span>
          </span>
          <button onClick={logout} className="btn-outline">Sign out</button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="card skeleton" style={{ height: 80 }} />)}
        </div>
      )}

      {error && <div className="card" style={{ padding: 16, color: 'var(--loss)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>Error: {error}</div>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <StatBox index={0} label="Total users"    value={data.totals.total_users}    color="var(--accent)" />
              <StatBox index={1} label="Total holdings" value={data.totals.total_holdings} color="var(--gain)" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <StatBox index={2} label="Total alerts"   value={data.totals.total_alerts}   color="var(--warn)" />
              <StatBox index={3} label="AI analyses"    value={data.totals.total_advice}   color="#8b5cf6" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatBox index={4} label="Cached prices" value={data.totals.cached_prices} />
            <StatBox index={5} label="Cached news"   value={data.totals.cached_news} />
          </div>

          {/* Your account */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Your account</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: 'var(--text-sm)' }}>
              {[
                { label: 'User ID', value: user?.id, mono: true, color: 'var(--accent)' },
                { label: 'Display name', value: user?.name, mono: true },
                { label: 'Session', value: 'Active', mono: true, color: 'var(--gain)' },
              ].map(f => (
                <div key={f.label}>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</p>
                  <p style={{ fontFamily: f.mono ? 'var(--font-mono)' : undefined, color: f.color ?? 'var(--text-2)', fontSize: 'var(--text-xs)' }}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* All accounts */}
          <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>All accounts ({data.users.length})</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <TH>Username</TH>
                    <TH>ID</TH>
                    <TH right>Holdings</TH>
                    <TH right>Alerts</TH>
                    <TH right>Analyses</TH>
                    <TH right>Created</TH>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u.id} className="table-row-hover" style={{ background: u.id === user?.id ? 'var(--surface-2)' : undefined }}>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-2)' }}>{u.name}</span>
                        {u.id === user?.id && (
                          <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: 'var(--surface-2)', color: 'var(--accent)', border: '1px solid var(--border-2)' }}>you</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{u.id}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--gain)' }}>{u.holding_count}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--warn)' }}>{u.alert_count}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#8b5cf6' }}>{u.advice_count}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{timeAgo(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent activity */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>Recent activity (last 20)</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <TH>Type</TH>
                    <TH>Ticker</TH>
                    <TH>User</TH>
                    <TH right>When</TH>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity.map((a, i) => (
                    <tr key={i} className="table-row-hover">
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 8px',
                          borderRadius: 99, border: '1px solid var(--border)',
                          background: a.type === 'holding' ? 'var(--surface-2)' : 'var(--warn-soft)',
                          color: a.type === 'holding' ? 'var(--accent)' : 'var(--warn)',
                        }}>
                          {a.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>{a.detail}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{a.user_id}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{timeAgo(a.ts)}</td>
                    </tr>
                  ))}
                  {data.recentActivity.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No activity yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
            Server time: <span style={{ fontFamily: 'var(--font-mono)' }}>{new Date(data.serverTime * 1000).toISOString()}</span>
          </p>
        </>
      )}
    </div>
  );
}
