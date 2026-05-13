import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const push = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++nextId;
    setToasts(t => [...t, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      {/* Toast container — fixed top-right */}
      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 32, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 32, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={() => clearTimeout(timers.current[toast.id])}
              onMouseLeave={() => {
                timers.current[toast.id] = setTimeout(() => dismiss(toast.id), 2000);
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--surface-1)',
                border: `1px solid ${
                  toast.type === 'success' ? 'rgba(22,163,74,0.3)' :
                  toast.type === 'error'   ? 'rgba(220,38,38,0.3)' :
                  'var(--border-2)'
                }`,
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                boxShadow: '0 4px 16px rgba(17,24,39,0.12)',
                minWidth: 240, maxWidth: 360,
                fontSize: 'var(--text-sm)',
                color: 'var(--text)',
              }}>
                {toast.type === 'success' && <span style={{ color: 'var(--gain)', fontSize: 14 }}>✓</span>}
                {toast.type === 'error'   && <span style={{ color: 'var(--loss)', fontSize: 14 }}>✕</span>}
                {toast.type === 'info'    && <span style={{ color: 'var(--accent)', fontSize: 14 }}>·</span>}
                <span style={{ flex: 1 }}>{toast.message}</span>
                <button
                  onClick={() => dismiss(toast.id)}
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                >×</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
