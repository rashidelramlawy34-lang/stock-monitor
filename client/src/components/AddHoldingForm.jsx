import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MAX_TICKER_LENGTH, normalizeTicker } from '../utils/ticker.js';

export default function AddHoldingForm({ onAdd, open, onClose }) {
  const [form, setForm] = useState({ ticker: '', shares: '', cost_basis: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.ticker.trim()) return setError('Ticker is required');
    if (Number(form.shares) <= 0) return setError('Shares must be > 0');
    if (Number(form.cost_basis) < 0) return setError('Cost basis must be ≥ 0');
    setBusy(true);
    try {
      await onAdd(form);
      setForm({ ticker: '', shares: '', cost_basis: '' });
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const totalCost = Number(form.shares) > 0 && Number(form.cost_basis) > 0
    ? Number(form.shares) * Number(form.cost_basis)
    : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(17, 24, 39, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          {/* Centering shell — not animated, prevents transform conflict */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 101,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <motion.div
              key="dialog"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                pointerEvents: 'all',
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 8px 32px rgba(17, 24, 39, 0.14)',
                padding: 24,
                width: 420,
                maxWidth: 'calc(100vw - 32px)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>Add holding</h2>
                <button onClick={onClose} className="btn-ghost" style={{ fontSize: 18, lineHeight: 1 }}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Ticker</label>
                    <input
                      className="input uppercase font-mono"
                      placeholder="AAPL"
                      value={form.ticker}
                      onChange={e => setForm(f => ({ ...f, ticker: normalizeTicker(e.target.value) }))}
                      maxLength={MAX_TICKER_LENGTH}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Shares</label>
                      <input
                        type="number" min="0" step="any"
                        className="input font-mono w-full"
                        placeholder="10"
                        value={form.shares}
                        onChange={e => setForm(f => ({ ...f, shares: e.target.value }))}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Cost / share ($)</label>
                      <input
                        type="number" min="0" step="any"
                        className="input font-mono w-full"
                        placeholder="150.00"
                        value={form.cost_basis}
                        onChange={e => setForm(f => ({ ...f, cost_basis: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {error && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--loss)', marginTop: 10 }}>{error}</p>}
                {!error && totalCost && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8 }}>
                    Total cost:{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontWeight: 600 }}>
                      ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                  <button type="submit" disabled={busy} className="btn-primary">
                    {busy ? 'Adding…' : 'Add holding'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
