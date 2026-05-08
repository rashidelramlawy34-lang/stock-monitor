const RISK_BADGE = {
  'Low':       'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  'Medium':    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'High':      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'Very High': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
};

export default function HRHRCard({ candidate }) {
  const {
    ticker, company_name, sector,
    current_price: price, target_mean, upside_pct,
    beta, score,
    strong_buy = 0, buy_count = 0, hold_count = 0, sell_count = 0, strong_sell = 0,
    logo_url,
    risk_label = 'Medium',
    bull_case,
    entry_zone,
    key_catalyst,
    conviction,
  } = candidate;

  const riskCls = RISK_BADGE[risk_label] ?? RISK_BADGE['Medium'];
  const hasUpside = target_mean != null && upside_pct != null && upside_pct !== 0;
  const upPos = (upside_pct ?? 0) >= 0;
  const totalAnalysts = strong_buy + buy_count + hold_count + sell_count + strong_sell;
  const buyPct = totalAnalysts > 0 ? Math.round((strong_buy + buy_count) / totalAnalysts * 100) : 0;
  const convictionPct = conviction != null ? Math.round(conviction * 100) : null;
  const initials = ticker.slice(0, 2).toUpperCase();

  return (
    <div className="card p-5 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {logo_url
            ? <img
                src={logo_url}
                alt=""
                className="w-7 h-7 rounded object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
            : null}
          <span
            className={`w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 ${logo_url ? 'hidden' : 'flex'}`}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 leading-none">{ticker}</p>
            {(company_name || sector) && (
              <p className="text-xs text-slate-500 dark:text-slate-500 truncate mt-0.5">
                {company_name}{company_name && sector ? ' · ' : ''}{sector}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${riskCls}`}>{risk_label}</span>
          {hasUpside && (
            <span className={`text-sm font-bold ${upPos ? 'text-bull' : 'text-bear'}`}>
              {upPos ? '+' : ''}{upside_pct.toFixed(1)}% {upPos ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-[#1e2d45]" />

      {/* Bull case */}
      {bull_case && (
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Bull Case</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{bull_case}</p>
        </div>
      )}

      {/* Entry zone + catalyst */}
      <div className="flex flex-wrap gap-2">
        {entry_zone && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <span className="opacity-60">Entry</span> {entry_zone}
          </span>
        )}
        {key_catalyst && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            ⚡ {key_catalyst}
          </span>
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-[#1e2d45]" />

      {/* Conviction bar */}
      {convictionPct != null && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-medium">Conviction</span>
            <span className="font-mono">{convictionPct}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${convictionPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-500">
        {totalAnalysts > 0 && (
          <span>
            <span className="text-bull font-medium">{strong_buy + buy_count} buy</span>
            {' · '}
            <span>{hold_count} hold</span>
            {(sell_count + strong_sell) > 0 && (
              <><span>{' · '}</span><span className="text-bear">{sell_count + strong_sell} sell</span></>
            )}
          </span>
        )}
        {beta != null && <span>β {beta.toFixed(2)}</span>}
        {target_mean != null && price != null && (
          <span>Target ${target_mean.toFixed(0)}</span>
        )}
      </div>
    </div>
  );
}
