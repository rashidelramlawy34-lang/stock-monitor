import { useState, useEffect, useCallback } from 'react';

const BASE = '/api/portfolios';

export function usePortfolios() {
  const [portfolios, setPortfolios] = useState([]);
  const [activeId, setActiveId] = useState(() => localStorage.getItem('activePortfolioId') ?? null);

  const load = useCallback(async () => {
    const res = await fetch(BASE, { credentials: 'include' });
    if (!res.ok) return;
    const list = await res.json();
    setPortfolios(list);
    if (!activeId && list.length > 0) {
      const def = list.find(p => p.is_default) ?? list[0];
      setActiveId(def.id);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (activeId) localStorage.setItem('activePortfolioId', activeId);
  }, [activeId]);

  const setActive = useCallback((id) => setActiveId(id), []);

  const createPortfolio = useCallback(async (name) => {
    const res = await fetch(BASE, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const p = await res.json();
    setPortfolios(prev => [...prev, p]);
    return p;
  }, []);

  const renamePortfolio = useCallback(async (id, name) => {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const p = await res.json();
    setPortfolios(prev => prev.map(x => x.id === id ? p : x));
    return p;
  }, []);

  const deletePortfolio = useCallback(async (id) => {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).error);
    setPortfolios(prev => prev.filter(x => x.id !== id));
    if (activeId === id) {
      const remaining = portfolios.filter(x => x.id !== id);
      const def = remaining.find(p => p.is_default) ?? remaining[0];
      setActiveId(def?.id ?? null);
    }
  }, [activeId, portfolios]);

  const setDefault = useCallback(async (id) => {
    await fetch(`${BASE}/${id}/set-default`, { method: 'POST', credentials: 'include' });
    setPortfolios(prev => prev.map(p => ({ ...p, is_default: p.id === id ? 1 : 0 })));
  }, []);

  const activePortfolio = portfolios.find(p => p.id === activeId) ?? portfolios[0] ?? null;

  return { portfolios, activePortfolio, activeId, setActive, createPortfolio, renamePortfolio, deletePortfolio, setDefault, reload: load };
}
