import { useEffect, useState } from 'react';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { useAdvice } from '../hooks/useAdvice.js';
import { useFundamentals } from '../hooks/useFundamentals.js';
import AdviceCard from '../components/AdviceCard.jsx';
import DigestPanel from '../components/DigestPanel.jsx';

export default function AdvisorPage() {
  const { holdings, loading: holdingsLoading } = usePortfolio();
  const { advice, loading, errors, fetchAdvice } = useAdvice();
  const { fundamentals } = useFundamentals(holdings.map(h => h.ticker));
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="hud-title text-xl">AI Advisor</h1>
          {holdings.length > 0 && (
            <p className="text-xs text-muted mt-1 tracking-wide">
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
              <><span className="w-3 h-3 border-2 border-[rgba(0,212,255,0.3)] border-t-[#00d4ff] rounded-full animate-spin" />Refreshing…</>
            ) : '↻ Refresh All'}
          </button>
        )}
      </div>

      <DigestPanel />

      {holdingsLoading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5 animate-pulse h-40">
              <div className="h-4 bg-[rgba(0,212,255,0.08)] rounded w-1/4 mb-3" />
              <div className="h-2 bg-[rgba(0,212,255,0.08)] rounded w-full mb-2" />
              <div className="h-2 bg-[rgba(0,212,255,0.08)] rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!holdingsLoading && holdings.length === 0 && (
        <p className="text-muted text-sm">Add stocks to your portfolio to get AI advice.</p>
      )}

      {holdings.length > 0 && (
        <>
          <h2 className="hud-label mb-3">Buy / Hold / Sell Analysis</h2>

          {doneCount > 0 && (() => {
            const buys = holdings.filter(h => advice[h.ticker]?.recommendation === 'buy').length;
            const sells = holdings.filter(h => advice[h.ticker]?.recommendation === 'sell').length;
            const holds = holdings.filter(h => advice[h.ticker]?.recommendation === 'hold').length;
            return (
              <div className="flex items-center gap-4 mb-4 text-xs">
                {buys > 0 && <span className="flex items-center gap-1.5 text-bull font-bold"><span className="w-2 h-2 rounded-full bg-bull shadow-[0_0_6px_#00e676]" />{buys} Buy</span>}
                {holds > 0 && <span className="flex items-center gap-1.5 text-warn font-bold"><span className="w-2 h-2 rounded-full bg-warn shadow-[0_0_6px_#ffaa00]" />{holds} Hold</span>}
                {sells > 0 && <span className="flex items-center gap-1.5 text-bear font-bold"><span className="w-2 h-2 rounded-full bg-bear shadow-[0_0_6px_#ff3355]" />{sells} Sell</span>}
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
        </>
      )}
    </div>
  );
}
