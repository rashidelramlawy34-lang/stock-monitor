import { useEffect, useState } from 'react';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { useAdvice } from '../hooks/useAdvice.js';
import { useFundamentals } from '../hooks/useFundamentals.js';
import { useMarketData } from '../hooks/useMarketData.js';
import AdviceCard from '../components/AdviceCard.jsx';
import DigestPanel from '../components/DigestPanel.jsx';

export default function AdvisorPage() {
  const { holdings, loading: holdingsLoading } = usePortfolio();
  const { advice, loading, errors, fetchAdvice } = useAdvice();
  const { fundamentals } = useFundamentals(holdings.map(h => h.ticker));
  const { upgrades } = useMarketData(holdings.map(h => h.ticker));
  const [refreshingAll, setRefreshingAll] = useState(false);

  useEffect(() => {
    for (const h of holdings) {
      if (!advice[h.ticker] && !loading[h.ticker]) {
        fetchAdvice(h.ticker);
      }
    }
  }, [holdings]); // eslint-disable-line

  const refreshAll = async () => {
    setRefreshingAll(true);
    await Promise.all(holdings.map(h => fetchAdvice(h.ticker)));
    setRefreshingAll(false);
  };

  const loadingCount = holdings.filter(h => loading[h.ticker]).length;
  const doneCount = holdings.filter(h => advice[h.ticker]).length;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">AI Advisor</h1>
          {holdings.length > 0 && (
            <p className="page-subtitle">
              {loadingCount > 0
                ? `Analyzing ${loadingCount} stock${loadingCount > 1 ? 's' : ''}…`
                : `${doneCount} of ${holdings.length} analyzed`}
            </p>
          )}
        </div>
        {holdings.length > 0 && (
          <button
            onClick={refreshAll}
            disabled={refreshingAll || loadingCount > 0}
            className="btn-outline flex items-center gap-1.5 disabled:opacity-40"
          >
            {refreshingAll ? (
              <><span className="w-3 h-3 border-2 border-[var(--border-2)] border-t-[var(--accent)] rounded-full animate-spin" />Refreshing…</>
            ) : '↻ Refresh All'}
          </button>
        )}
      </div>

      <DigestPanel />

      {holdingsLoading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5 animate-pulse h-40">
              <div className="h-4 bg-[var(--surface-2)] rounded w-1/4 mb-3" />
              <div className="h-2 bg-[var(--surface-2)] rounded w-full mb-2" />
              <div className="h-2 bg-[var(--surface-2)] rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!holdingsLoading && holdings.length === 0 && (
        <p className="text-muted text-sm">Add stocks to your portfolio to get AI advice.</p>
      )}

      {holdings.length > 0 && (
        <>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Buy / hold / sell analysis</h2>

          {doneCount > 0 && (() => {
            const buys = holdings.filter(h => advice[h.ticker]?.recommendation === 'buy').length;
            const sells = holdings.filter(h => advice[h.ticker]?.recommendation === 'sell').length;
            const holds = holdings.filter(h => advice[h.ticker]?.recommendation === 'hold').length;
            return (
              <div className="flex items-center gap-4 mb-4 text-xs">
                {buys > 0 && <span className="flex items-center gap-1.5 text-bull font-bold"><span className="w-2 h-2 rounded-full bg-bull" />{buys} Buy</span>}
                {holds > 0 && <span className="flex items-center gap-1.5 text-warn font-bold"><span className="w-2 h-2 rounded-full bg-warn" />{holds} Hold</span>}
                {sells > 0 && <span className="flex items-center gap-1.5 text-bear font-bold"><span className="w-2 h-2 rounded-full bg-bear" />{sells} Sell</span>}
              </div>
            );
          })()}

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {holdings.map(h => (
              <AdviceCard
                key={h.ticker}
                ticker={h.ticker}
                advice={advice[h.ticker]}
                loading={!!loading[h.ticker]}
                error={errors[h.ticker]}
                fundamentals={fundamentals[h.ticker]}
                onRefresh={fetchAdvice}
              />
            ))}
          </div>

          {/* Analyst upgrades/downgrades feed */}
          {(() => {
            const allUpgrades = holdings.flatMap(h =>
              (upgrades[h.ticker] ?? []).map(u => ({ ...u, ticker: h.ticker }))
            ).sort((a, b) => new Date(b.gradeTime ?? b.date ?? 0) - new Date(a.gradeTime ?? a.date ?? 0));

            if (allUpgrades.length === 0) return null;

            return (
              <div className="card mb-6 overflow-hidden">
                <div className="p-4 border-b border-[var(--border)]">
                  <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>Recent analyst actions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted border-b border-[var(--border)]">
                        <th className="text-left px-4 py-2 font-medium">Ticker</th>
                        <th className="text-left px-4 py-2 font-medium">Firm</th>
                        <th className="text-left px-4 py-2 font-medium">Action</th>
                        <th className="text-left px-4 py-2 font-medium">From → To</th>
                        <th className="text-right px-4 py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUpgrades.slice(0, 30).map((u, i) => {
                        const isUpgrade = u.action?.toLowerCase().includes('upgrade') || u.action?.toLowerCase().includes('initiat');
                        const isDowngrade = u.action?.toLowerCase().includes('downgrade');
                        return (
                          <tr key={i} className="table-row-hover">
                            <td className="px-4 py-2 font-mono font-bold" style={{ color: 'var(--text)' }}>{u.ticker}</td>
                            <td className="px-4 py-2 text-white truncate max-w-[120px]">{u.company ?? '—'}</td>
                            <td className={`px-4 py-2 font-semibold ${isUpgrade ? 'text-[var(--gain)]' : isDowngrade ? 'text-bear' : 'text-warn'}`}>
                              {u.action ?? '—'}
                            </td>
                            <td className="px-4 py-2 text-muted">
                              {u.fromGrade ?? '—'} → {u.toGrade ?? '—'}
                            </td>
                            <td className="px-4 py-2 text-right text-muted">
                              {(u.gradeTime ?? u.date ?? '').slice(0, 10)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
