import { useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist.js';
import { usePrices } from '../hooks/usePrices.js';

function WatchRow({ item, price, onRemove }) {
  const p = price?.price;
  const chg = price?.change_pct;
  const pos = chg >= 0;

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
      <td className="py-3 px-4">
        <span className="font-mono font-bold text-arc tracking-widest">{item.ticker}</span>
        {item.note && <p className="text-xs text-muted mt-0.5">{item.note}</p>}
      </td>
      <td className="py-3 px-4 text-right font-mono">
        {p != null ? <span className="text-[var(--text-2)]">${p.toFixed(2)}</span> : <span className="text-muted">—</span>}
      </td>
      <td className="py-3 px-4 text-right font-mono">
        {chg != null ? (
          <span className={pos ? 'text-bull' : 'text-bear'}>
            {pos ? '+' : ''}{chg.toFixed(2)}%
          </span>
        ) : <span className="text-muted">—</span>}
      </td>
      <td className="py-3 px-4 text-right text-xs text-muted font-mono">
        {new Date(item.added_at * 1000).toLocaleDateString()}
      </td>
      <td className="py-3 px-4 text-right">
        <button
          onClick={() => onRemove(item.ticker)}
          className="text-muted hover:text-bear transition-colors text-xs"
          title="Remove from watchlist"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

export default function WatchlistPage() {
  const { watchlist, loading, error, addTicker, removeTicker } = useWatchlist();
  const { prices } = usePrices(watchlist.map(w => w.ticker));
  const [ticker, setTicker] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await addTicker(ticker.trim().toUpperCase(), note.trim());
      setTicker('');
      setNote('');
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="hud-title text-xl">Watchlist</h1>
        <p className="text-muted text-xs mt-1 tracking-wide">Track stocks without adding them to your portfolio</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Ticker (e.g. TSLA)"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          className="input flex-1 font-mono tracking-widest uppercase"
          maxLength={10}
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="input flex-1"
          maxLength={100}
        />
        <button type="submit" disabled={adding || !ticker.trim()} className="btn-primary whitespace-nowrap">
          {adding ? 'Adding…' : '+ Watch'}
        </button>
      </form>
      {addError && <p className="text-bear text-xs mb-4">{addError}</p>}

      {/* Table */}
      {loading && <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="card h-12 animate-pulse" />)}</div>}
      {error && <p className="text-bear text-sm">Error: {error}</p>}

      {!loading && watchlist.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-muted text-sm">No stocks on your watchlist yet.</p>
          <p className="text-muted text-xs mt-1">Add a ticker above to start watching.</p>
        </div>
      )}

      {!loading && watchlist.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="hud-label text-left py-2.5 px-4 font-normal">Ticker</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Price</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Today</th>
                  <th className="hud-label text-right py-2.5 px-4 font-normal">Added</th>
                  <th className="py-2.5 px-4" />
                </tr>
              </thead>
              <tbody>
                {watchlist.map(w => (
                  <WatchRow key={w.id} item={w} price={prices[w.ticker]} onRemove={removeTicker} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
