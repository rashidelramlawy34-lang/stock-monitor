import { useState, useRef, useEffect } from 'react';

export default function PortfolioSwitcher({ portfolios = [], activePortfolio, activeId, setActive, createPortfolio, renamePortfolio, deletePortfolio }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createPortfolio(newName.trim());
      setNewName('');
      setCreating(false);
    } catch (err) { alert(err.message); }
  }

  async function handleRename(e, id) {
    e.preventDefault();
    if (!renameVal.trim()) return;
    try {
      await renamePortfolio(id, renameVal.trim());
      setRenaming(null);
    } catch (err) { alert(err.message); }
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-outline"
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
      >
        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activePortfolio?.name ?? 'Portfolio'}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0 }}>
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          width: 208, background: 'var(--surface-1)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          boxShadow: '0 4px 12px rgba(17,24,39,0.10)', zIndex: 50,
        }}>
          <div style={{ padding: '4px 0' }}>
            {portfolios.map(p => {
              const isActive = p.id === activeId;
              return (
                <div key={p.id} className="group" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  {renaming === p.id ? (
                    <form onSubmit={e => handleRename(e, p.id)} style={{ flex: 1, display: 'flex', gap: 4, padding: '4px 8px' }}>
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        className="input flex-1 text-xs px-2 py-0.5"
                        onBlur={() => setRenaming(null)}
                      />
                      <button type="submit" style={{ color: 'var(--gain)', fontSize: 12 }}>✓</button>
                    </form>
                  ) : (
                    <>
                      {isActive && (
                        <span style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: 3, borderRadius: '0 2px 2px 0', background: 'var(--accent)',
                        }} />
                      )}
                      <button
                        onClick={() => { setActive(p.id); setOpen(false); }}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 12px 8px 14px', fontSize: 13, textAlign: 'left',
                          background: isActive ? 'var(--surface-2)' : 'transparent',
                          color: isActive ? 'var(--text)' : 'var(--text-2)',
                          transition: 'background 0.1s',
                          border: 'none', width: '100%', cursor: 'pointer',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {p.name}
                        </span>
                        {p.is_default === 1 && (
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>default</span>
                        )}
                      </button>
                      <div className="hidden group-hover:flex gap-1 pr-2 shrink-0">
                        <button
                          onClick={() => { setRenaming(p.id); setRenameVal(p.name); }}
                          style={{ color: 'var(--text-muted)', fontSize: 10, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="Rename"
                        >✎</button>
                        {!p.is_default && (
                          <button
                            onClick={() => { if (confirm(`Delete "${p.name}"?`)) deletePortfolio(p.id).catch(err => alert(err.message)); }}
                            style={{ color: 'var(--text-muted)', fontSize: 10, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--loss)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            title="Delete"
                          >✕</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', padding: '4px 0' }}>
            {creating ? (
              <form onSubmit={handleCreate} style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
                <input
                  autoFocus
                  placeholder="Portfolio name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="input flex-1 text-xs px-2 py-0.5"
                />
                <button type="submit" style={{ color: 'var(--gain)', fontSize: 12, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer' }}>✓</button>
                <button type="button" onClick={() => setCreating(false)} style={{ color: 'var(--text-muted)', fontSize: 12, padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                style={{ width: '100%', textAlign: 'left', padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                + New portfolio
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
