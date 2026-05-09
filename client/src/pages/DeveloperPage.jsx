import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatBox({ label, value, color }) {
  return (
    <div className="card p-4 text-center">
      <p className="hud-label mb-2">{label}</p>
      <p className={`text-3xl font-bold font-mono ${color || 'text-arc'}`}>{value}</p>
    </div>
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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="hud-title text-xl">Developer Console</h1>
          <p className="text-muted text-xs mt-1 tracking-wide">System telemetry and account management</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted font-mono">
            Logged in as <span className="text-arc">{user?.name}</span>
          </span>
          <button onClick={logout} className="btn-outline text-xs">Sign Out</button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="card p-4 h-20 animate-pulse" />)}
        </div>
      )}

      {error && <div className="card p-4 text-bear text-sm mb-6">Error: {error}</div>}

      {data && (
        <>
          {/* System stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatBox label="Total Users"    value={data.totals.total_users}    color="text-arc" />
            <StatBox label="Total Holdings" value={data.totals.total_holdings} color="text-bull" />
            <StatBox label="Total Alerts"   value={data.totals.total_alerts}   color="text-warn" />
            <StatBox label="AI Analyses"    value={data.totals.total_advice}   color="text-[#8b5cf6]" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <StatBox label="Cached Prices" value={data.totals.cached_prices} />
            <StatBox label="Cached News"   value={data.totals.cached_news} />
          </div>

          {/* Your account */}
          <div className="card p-5 mb-6">
            <h2 className="hud-label mb-4">Your Account</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted text-xs mb-0.5">User ID</p>
                <p className="font-mono text-[var(--accent)]">{user?.id}</p>
              </div>
              <div>
                <p className="text-muted text-xs mb-0.5">Display Name</p>
                <p className="font-mono text-[var(--text-2)]">{user?.name}</p>
              </div>
              <div>
                <p className="text-muted text-xs mb-0.5">Session</p>
                <p className="font-mono text-bull text-xs">Active</p>
              </div>
            </div>
          </div>

          {/* All accounts */}
          <div className="card mb-6 overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="hud-label">All Accounts ({data.users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="hud-label text-left py-2.5 px-4 font-normal">Username</th>
                    <th className="hud-label text-left py-2.5 px-4 font-normal">ID</th>
                    <th className="hud-label text-right py-2.5 px-4 font-normal">Holdings</th>
                    <th className="hud-label text-right py-2.5 px-4 font-normal">Alerts</th>
                    <th className="hud-label text-right py-2.5 px-4 font-normal">Analyses</th>
                    <th className="hud-label text-right py-2.5 px-4 font-normal">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u.id} className={`table-row-hover ${u.id === user?.id ? 'bg-[var(--surface-2)]' : ''}`}>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-[var(--text-2)]">{u.name}</span>
                        {u.id === user?.id && (
                          <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border-2)] tracking-widest">YOU</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted text-xs">{u.id}</td>
                      <td className="py-3 px-4 text-right font-mono text-bull">{u.holding_count}</td>
                      <td className="py-3 px-4 text-right font-mono text-warn">{u.alert_count}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#8b5cf6]">{u.advice_count}</td>
                      <td className="py-3 px-4 text-right font-mono text-muted text-xs">{timeAgo(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent activity */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="hud-label">Recent Activity (last 20)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="hud-label text-left py-2.5 px-4 font-normal">Type</th>
                    <th className="hud-label text-left py-2.5 px-4 font-normal">Ticker</th>
                    <th className="hud-label text-left py-2.5 px-4 font-normal">User</th>
                    <th className="hud-label text-right py-2.5 px-4 font-normal">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity.map((a, i) => (
                    <tr key={i} className="table-row-hover">
                      <td className="py-2.5 px-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border tracking-widest uppercase ${
                          a.type === 'holding'
                            ? 'bg-[var(--surface-2)] text-[var(--accent)] border-[var(--border-2)]'
                            : 'bg-[var(--warn-soft)] text-warn border-[var(--border)]'
                        }`}>
                          {a.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[var(--accent)] tracking-widest">{a.detail}</td>
                      <td className="py-2.5 px-4 font-mono text-muted text-xs">{a.user_id}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-muted text-xs">{timeAgo(a.ts)}</td>
                    </tr>
                  ))}
                  {data.recentActivity.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-muted text-sm">No activity yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-muted text-xs text-center mt-4">
            Server time: <span className="font-mono">{new Date(data.serverTime * 1000).toISOString()}</span>
          </p>
        </>
      )}
    </div>
  );
}
