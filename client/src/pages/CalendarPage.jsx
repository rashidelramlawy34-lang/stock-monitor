import { useState, useEffect } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useFundamentals } from '../hooks/useFundamentals.js';

function weekLabel(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = dt => `${dt.getMonth() + 1}/${dt.getDate()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

function isWithin7Days(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (d - now) / 86400000;
  return diff >= 0 && diff <= 7;
}

export default function CalendarPage() {
  const { holdings } = usePortfolio();
  const { fundamentals } = useFundamentals(holdings.map(h => h.ticker));
  const [econEvents, setEconEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market-data/economic-calendar', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEconEvents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const earningsEvents = holdings
    .filter(h => fundamentals[h.ticker]?.next_earnings_date)
    .map(h => ({
      date: fundamentals[h.ticker].next_earnings_date,
      name: `${h.ticker} Earnings`,
      type: 'earnings',
      ticker: h.ticker,
      estimate: fundamentals[h.ticker].next_earnings_estimate,
    }));

  const allEvents = [
    ...econEvents.map(e => ({
      date: e.time ?? e.date ?? '',
      name: e.event ?? e.name ?? '—',
      type: 'economic',
      prev: e.prev,
      estimate: e.estimate,
      impact: e.impact,
    })),
    ...earningsEvents,
  ]
    .filter(e => e.date && new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const grouped = {};
  for (const e of allEvents) {
    const key = weekLabel(e.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="hud-title text-sm mb-4">Economic Calendar</h2>

      {loading && <p className="text-muted text-sm">Loading events...</p>}

      {!loading && allEvents.length === 0 && (
        <p className="text-muted text-sm">No upcoming events.</p>
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([week, events]) => (
          <div key={week} className="card p-4">
            <p className="hud-label text-[10px] mb-3">Week of {week}</p>
            <div className="space-y-1.5">
              {events.map((e, i) => {
                const soon = isWithin7Days(e.date);
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-2 py-1.5 rounded-full text-xs ${soon ? 'bg-[rgba(255,170,0,0.05)] border border-[rgba(255,170,0,0.15)]' : ''}`}
                  >
                    <span className="text-muted w-[60px] shrink-0">{e.date.slice(0, 10)}</span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${e.type === 'earnings' ? 'bg-[rgba(0,212,255,0.1)] text-arc' : 'bg-[rgba(0,230,118,0.08)] text-[#00e676]'}`}>
                      {e.type === 'earnings' ? 'EARN' : 'ECON'}
                    </span>
                    <span className={`flex-1 ${soon ? 'text-warn' : 'text-white'}`}>{e.name}</span>
                    {e.estimate != null && (
                      <span className="text-muted shrink-0">Est: {e.estimate}</span>
                    )}
                    {e.prev != null && (
                      <span className="text-muted shrink-0 ml-2">Prev: {e.prev}</span>
                    )}
                    {e.impact && (
                      <span className={`shrink-0 text-[10px] ml-2 ${e.impact === 'high' ? 'text-bear' : e.impact === 'medium' ? 'text-warn' : 'text-muted'}`}>
                        {e.impact.toUpperCase()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
