export default function EarningsCalendar({ holdings, fundamentals }) {
  if (!holdings?.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = holdings
    .map(h => {
      const f = fundamentals?.[h.ticker];
      if (!f?.next_earnings_date) return null;
      const date = new Date(f.next_earnings_date + 'T00:00:00');
      if (isNaN(date) || date < today) return null;
      const days = Math.round((date - today) / 86400000);
      return { ticker: h.ticker, date, days, company: f.company_name ?? h.ticker };
    })
    .filter(Boolean)
    .sort((a, b) => a.days - b.days);

  if (upcoming.length === 0) return null;

  return (
    <div className="card p-4">
      <p className="hud-label mb-3">Earnings Calendar</p>
      <div className="flex flex-col gap-2">
        {upcoming.map(({ ticker, date, days, company }) => {
          const soon = days <= 14;
          return (
            <div key={ticker} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-semibold text-[#00d4ff] shrink-0">{ticker}</span>
                <span className="text-muted truncate">{company}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[rgba(0,212,255,0.5)] font-mono">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] tracking-wide border ${
                  soon
                    ? 'bg-[#ffaa00]/10 text-[#ffaa00] border-[#ffaa00]/30'
                    : 'bg-[rgba(0,212,255,0.05)] text-muted border-[rgba(0,212,255,0.15)]'
                }`}>
                  {days === 0 ? 'TODAY' : days === 1 ? 'TMRW' : `${days}D`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
