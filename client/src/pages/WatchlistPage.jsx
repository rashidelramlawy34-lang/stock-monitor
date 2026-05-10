import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWatchlist } from '../hooks/useWatchlist.js';
import { usePrices } from '../hooks/usePrices.js';
import { SkeletonPage } from '../components/Skeleton.jsx';

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 120, damping: 18, delay: i * 0.03 },
  }),
};

function WatchRow({ item, price, onRemove, index }) {
  const p = price?.price;
  const chg = price?.change_pct;
  const pos = (chg ?? 0) >= 0;

  return (
    <motion.tr
      custom={index}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      style={{ borderTop: '1px solid var(--border)' }}
      className="table-row-hover"
    >
      <td style={{ padding: '14px 20px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)', fontSize: 'var(--text-sm)' }}>
          {item.ticker}
        </span>
        {item.note && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.note}</p>}
      </td>
      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>
        {p != null ? `$${p.toFixed(2)}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </td>
      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
        {chg != null
          ? <span style={{ color: pos ? 'var(--gain)' : 'var(--loss)' }}>{pos ? '+' : ''}{chg.toFixed(2)}%</span>
          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </td>
      <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {new Date(item.added_at * 1000).toLocaleDateString()}
      </td>
      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
        <button
          onClick={() => onRemove(item.ticker)}
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, transition: 'color 0.12s' }}
          title="Remove"
          onMouseEnter={e => e.currentTarget.style.color = 'var(--loss)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >✕</button>
      </td>
    </motion.tr>
  );
}

export default function WatchlistPage() {
  const { watchlist, loading, error, addTicker, removeTicker } = useWatchlist();
  const { prices } = usePrices(watchlist.map(w => w.ticker));
  const [ticker, setTicker] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await addTicker(ticker.trim().toUpperCase(), note.trim());
      setTicker('');
      setNote('');
      setShowForm(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <SkeletonPage cards={3} />;

  const upCount   = watchlist.filter(w => (prices[w.ticker]?.change_pct ?? 0) >= 0).length;
  const avgChange = watchlist.length > 0
    ? watchlist.reduce((s, w) => s + (prices[w.ticker]?.change_pct ?? 0), 0) / watchlist.length
    : null;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-subtitle">Track stocks without adding them to your portfolio</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add ticker'}
        </button>
      </div>

      {/* Stat strip */}
      {watchlist.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}
        >
          {[
            { label: 'Watching',   value: `${watchlist.length}` },
            { label: 'Up today',   value: `${upCount} / ${watchlist.length}` },
            { label: 'Avg change', value: avgChange != null ? `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%` : '—',
              color: avgChange != null ? (avgChange >= 0 ? 'var(--gain)' : 'var(--loss)') : undefined },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 20px', minWidth: 120 }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color ?? 'var(--text)' }}>
                {s.value}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Add form — animated */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden', marginBottom: 16 }}
          >
            <form onSubmit={handleAdd} className="card" style={{ padding: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Ticker</label>
                <input
                  type="text" placeholder="AAPL"
                  value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  className="input font-mono"
                  style={{ width: 100 }}
                  maxLength={10} autoFocus
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Note (optional)</label>
                <input
                  type="text" placeholder="e.g. Watching for earnings"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="input" maxLength={100}
                />
              </div>
              <button type="submit" disabled={adding || !ticker.trim()} className="btn-primary">
                {adding ? 'Adding…' : 'Add'}
              </button>
            </form>
            {addError && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--loss)', marginTop: 6 }}>{addError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--loss)', marginBottom: 16 }}>Error: {error}</p>}

      {/* Empty state */}
      {!loading && watchlist.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Nothing here yet</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 20 }}>Add tickers to track prices without committing them to your portfolio</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Add your first ticker</button>
        </div>
      )}

      {/* Table */}
      {watchlist.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Ticker', 'Price', 'Today', 'Added', ''].map((h, i) => (
                    <th key={h + i} style={{
                      padding: '10px 20px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
                      fontWeight: 400, textAlign: i === 0 ? 'left' : 'right',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {watchlist.map((w, i) => (
                  <WatchRow key={w.id} item={w} price={prices[w.ticker]} onRemove={removeTicker} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
