export default function DividendPanel({ dividends = {}, holdings = [], prices = {} }) {
  const rows = holdings.map(h => {
    const divList = dividends[h.ticker];
    if (!Array.isArray(divList) || divList.length === 0) return null;
    const latest = divList[0];
    const annualDiv = (latest.amount ?? 0) * (latest.frequency === 'quarterly' ? 4 : latest.frequency === 'monthly' ? 12 : 1);
    const currentPrice = prices[h.ticker]?.price ?? h.cost_basis ?? 0;
    const yieldPct = currentPrice > 0 ? (annualDiv / currentPrice) * 100 : 0;
    const yieldOnCost = h.cost_basis > 0 ? (annualDiv / h.cost_basis) * 100 : 0;
    const annualIncome = annualDiv * (h.shares ?? 0);
    const nextExDate = latest.exDate ?? latest.ex_date ?? null;
    return { ticker: h.ticker, annualDiv, yieldPct, yieldOnCost, annualIncome, nextExDate };
  }).filter(Boolean);

  if (rows.length === 0) return null;

  const totalIncome = rows.reduce((s, r) => s + r.annualIncome, 0);
  const totalValue = holdings.reduce((s, h) => s + (prices[h.ticker]?.price ?? h.cost_basis ?? 0) * (h.shares ?? 0), 0);
  const weightedYield = totalValue > 0 ? (totalIncome / totalValue) * 100 : 0;

  return (
    <div className="card p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="hud-label text-xs">Dividend Income</h3>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-[10px] text-muted">Annual Income</p>
            <p className="text-sm font-bold text-[#00e676]">${totalIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted">Portfolio Yield</p>
            <p className="text-sm font-bold text-arc">{weightedYield.toFixed(2)}%</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted border-b border-[rgba(0,212,255,0.1)]">
              <th className="text-left py-1.5 font-medium">Ticker</th>
              <th className="text-right py-1.5 font-medium">Annual Div</th>
              <th className="text-right py-1.5 font-medium">Yield</th>
              <th className="text-right py-1.5 font-medium">Yield/Cost</th>
              <th className="text-right py-1.5 font-medium">Income/yr</th>
              <th className="text-right py-1.5 font-medium">Ex-Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.ticker} className="table-row-hover">
                <td className="py-1.5 font-bold text-arc">{r.ticker}</td>
                <td className="text-right py-1.5 text-white">${r.annualDiv.toFixed(2)}</td>
                <td className="text-right py-1.5 text-[#00e676]">{r.yieldPct.toFixed(2)}%</td>
                <td className="text-right py-1.5 text-muted">{r.yieldOnCost.toFixed(2)}%</td>
                <td className="text-right py-1.5 text-white">${r.annualIncome.toFixed(2)}</td>
                <td className="text-right py-1.5 text-muted">{r.nextExDate ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
