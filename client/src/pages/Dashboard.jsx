import { usePortfolio } from '../hooks/usePortfolio.js';
import { usePrices } from '../hooks/usePrices.js';
import { useFundamentals } from '../hooks/useFundamentals.js';
import { useCandles } from '../hooks/useCandles.js';
import AddHoldingForm from '../components/AddHoldingForm.jsx';
import HoldingRow from '../components/HoldingRow.jsx';
import SectorChart from '../components/SectorChart.jsx';
import EarningsCalendar from '../components/EarningsCalendar.jsx';
import PortfolioChart from '../components/PortfolioChart.jsx';

function totalValue(holdings, prices) {
  return holdings.reduce((sum, h) => {
    const p = prices[h.ticker]?.price;
    return sum + (p != null ? p * h.shares : 0);
  }, 0);
}
function totalCost(holdings) {
  return holdings.reduce((sum, h) => sum + h.cost_basis * h.shares, 0);
}
function dailyPnL(holdings, prices) {
  let gain = 0;
  for (const h of holdings) {
    const p = prices[h.ticker];
    if (!p?.price || !p?.change_pct) continue;
    const mv = p.price * h.shares;
    gain += mv * (p.change_pct / 100);
  }
  return gain;
}

function portfolioBeta(holdings, prices, fundamentals) {
  let weightedBeta = 0, totalVal = 0;
  for (const h of holdings) {
    const p = prices[h.ticker]?.price;
    const beta = fundamentals[h.ticker]?.beta;
    if (!p || !beta) continue;
    const val = p * h.shares;
    weightedBeta += beta * val;
    totalVal += val;
  }
  return totalVal > 0 ? weightedBeta / totalVal : null;
}

function exportCSV(holdings, prices, fundamentals) {
  const headers = ['Ticker', 'Shares', 'Cost/Share', 'Current Price', 'Market Value', 'P&L', 'P&L %', 'Beta', 'Analyst Target', 'Upside %'];
  const rows = holdings.map(h => {
    const p = prices[h.ticker]?.price;
    const f = fundamentals[h.ticker];
    const mv = p ? p * h.shares : '';
    const pl = p ? (p - h.cost_basis) * h.shares : '';
    const plPct = p ? ((p - h.cost_basis) / h.cost_basis * 100).toFixed(2) : '';
    const upside = f?.target_mean && p ? ((f.target_mean - p) / p * 100).toFixed(2) : '';
    return [h.ticker, h.shares, h.cost_basis, p?.toFixed(2) ?? '', mv ? mv.toFixed(2) : '', pl ? pl.toFixed(2) : '', plPct, f?.beta ?? '', f?.target_mean ?? '', upside];
  });
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `portfolio_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card p-4">
      <p className="hud-label mb-2">{label}</p>
      <p className={`text-2xl font-bold font-mono tracking-tight ${color || 'text-[#a8d8ea]'}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { holdings, loading, error, addHolding, removeHolding } = usePortfolio();
  const { prices, lastUpdated, refresh: refreshPrices } = usePrices(holdings.map(h => h.ticker));
  const { fundamentals } = useFundamentals(holdings.map(h => h.ticker));
  const { candles } = useCandles(holdings.map(h => h.ticker));

  const value = totalValue(holdings, prices);
  const cost = totalCost(holdings);
  const gain = value - cost;
  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
  const todayGain = dailyPnL(holdings, prices);
  const beta = portfolioBeta(holdings, prices, fundamentals);

  const betaColor = beta == null ? '' : beta < 1 ? 'text-bull' : beta < 1.5 ? 'text-warn' : 'text-bear';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="hud-title text-xl">Portfolio</h1>
          <p className="text-muted text-xs mt-1 tracking-wide">
            {lastUpdated
              ? <>Prices updated {lastUpdated.toLocaleTimeString()}</>
              : 'Fetching prices…'}
          </p>
        </div>
        {holdings.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(holdings, prices, fundamentals)}
              className="btn-outline flex items-center gap-1"
            >
              ↓ CSV
            </button>
            <button onClick={refreshPrices} className="btn-outline flex items-center gap-1">
              ↻ Refresh
            </button>
          </div>
        )}
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Portfolio Value"
          value={cost > 0 ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          sub={`${holdings.length} holding${holdings.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Today's P&L"
          value={cost > 0 && todayGain !== 0 ? `${todayGain >= 0 ? '+' : ''}$${Math.abs(todayGain).toFixed(2)}` : '—'}
          sub={cost > 0 && todayGain !== 0 ? 'vs yesterday close' : undefined}
          color={todayGain >= 0 ? 'text-bull' : 'text-bear'}
        />
        <StatCard
          label="Total P&L"
          value={cost > 0 ? `${gain >= 0 ? '+' : ''}$${Math.abs(gain).toFixed(2)}` : '—'}
          sub={cost > 0 ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}% since cost` : undefined}
          color={gain >= 0 ? 'text-bull' : 'text-bear'}
        />
        <StatCard
          label="Portfolio Beta"
          value={beta != null ? beta.toFixed(2) : '—'}
          sub={beta != null ? (beta < 1 ? 'Low volatility' : beta < 1.5 ? 'Moderate risk' : 'High volatility') : undefined}
          color={betaColor}
        />
      </div>

      {/* Portfolio chart */}
      {holdings.length > 0 && <PortfolioChart />}

      {/* Side panels */}
      {holdings.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <SectorChart holdings={holdings} prices={prices} fundamentals={fundamentals} />
          <EarningsCalendar holdings={holdings} fundamentals={fundamentals} />
        </div>
      )}

      {/* Holdings table */}
      <section className="card mb-6">
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,212,255,0.1)]">
          <h2 className="hud-label">Holdings</h2>
        </div>

        {loading && <p className="p-6 text-muted text-sm">Loading…</p>}
        {error && <p className="p-6 text-bear text-sm">Error: {error}</p>}

        {!loading && holdings.length === 0 && (
          <p className="p-6 text-muted text-sm">No holdings yet. Add your first stock below.</p>
        )}

        {!loading && holdings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="hud-label text-left py-2.5 px-4 font-normal">Ticker</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Price</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Today</th>
                  <th className="hud-label py-2.5 px-4 font-normal">7D</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Shares</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Cost</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">P&L</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Upside</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <HoldingRow
                    key={h.ticker}
                    holding={h}
                    price={prices[h.ticker]}
                    candles={candles[h.ticker]}
                    fundamentals={fundamentals[h.ticker]}
                    onRemove={removeHolding}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-[rgba(0,212,255,0.1)]">
          <AddHoldingForm onAdd={addHolding} />
        </div>
      </section>
    </div>
  );
}
