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
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 12 }}>Earnings calendar</p>
      <div className="flex flex-col gap-2">
        {upcoming.map(({ ticker, date, days, company }) => {
          const soon = days <= 14;
          return (
            <div key={ticker} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-semibold text-[var(--accent)] shrink-0">{ticker}</span>
                <span className="text-muted truncate">{company}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[var(--text-2)] font-mono">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] tracking-wide border ${
                  soon
                    ? 'bg-[var(--warn-soft)] text-warn border-[var(--border)]'
                    : 'bg-[var(--surface-2)] text-muted border-[var(--border)]'
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
