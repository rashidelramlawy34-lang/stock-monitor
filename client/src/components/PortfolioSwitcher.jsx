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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.04)] hover:border-[rgba(0,212,255,0.4)] transition-all text-sm text-arc"
      >
        <span className="font-semibold max-w-[140px] truncate">{activePortfolio?.name ?? 'Portfolio'}</span>
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M19 9l-7 7-7-7" /></svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 card z-50 shadow-xl">
          <div className="py-1">
            {portfolios.map(p => (
              <div key={p.id} className="flex items-center group">
                {renaming === p.id ? (
                  <form onSubmit={e => handleRename(e, p.id)} className="flex-1 flex gap-1 px-2 py-1">
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      className="input flex-1 text-xs px-2 py-0.5"
                      onBlur={() => setRenaming(null)}
                    />
                    <button type="submit" className="text-[#00e676] text-xs">✓</button>
                  </form>
                ) : (
                  <>
                    <button
                      onClick={() => { setActive(p.id); setOpen(false); }}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${p.id === activeId ? 'text-arc' : 'text-[rgba(0,212,255,0.6)] hover:text-arc'}`}
                    >
                      {p.id === activeId && <span className="text-[8px]">●</span>}
                      <span className="truncate">{p.name}</span>
                      {p.is_default === 1 && <span className="ml-auto text-[9px] text-muted">default</span>}
                    </button>
                    <div className="hidden group-hover:flex gap-1 pr-2 shrink-0">
                      <button
                        onClick={() => { setRenaming(p.id); setRenameVal(p.name); }}
                        className="text-muted hover:text-arc text-[10px] px-1"
                        title="Rename"
                      >✎</button>
                      {!p.is_default && (
                        <button
                          onClick={() => { if (confirm(`Delete "${p.name}"?`)) deletePortfolio(p.id).catch(err => alert(err.message)); }}
                          className="text-muted hover:text-bear text-[10px] px-1"
                          title="Delete"
                        >✕</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[rgba(0,212,255,0.1)] py-1">
            {creating ? (
              <form onSubmit={handleCreate} className="flex gap-1 px-2 py-1">
                <input
                  autoFocus
                  placeholder="Portfolio name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="input flex-1 text-xs px-2 py-0.5"
                />
                <button type="submit" className="text-[#00e676] text-xs px-1">✓</button>
                <button type="button" onClick={() => setCreating(false)} className="text-muted text-xs px-1">✕</button>
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full text-left px-3 py-1.5 text-xs text-muted hover:text-arc transition-colors"
              >
                + New Portfolio
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
