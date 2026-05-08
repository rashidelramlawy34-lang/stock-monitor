import { useState, useEffect, useCallback } from 'react';

export function usePortfolio() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHoldings = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHoldings(await res.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  const addHolding = useCallback(async ({ ticker, shares, cost_basis }) => {
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, shares: Number(shares), cost_basis: Number(cost_basis) }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error);
    }
    await fetchHoldings();
  }, [fetchHoldings]);

  const removeHolding = useCallback(async (ticker) => {
    const res = await fetch(`/api/portfolio/${ticker}`, { method: 'DELETE' });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error);
    }
    await fetchHoldings();
  }, [fetchHoldings]);

  return { holdings, loading, error, addHolding, removeHolding, refresh: fetchHoldings };
}
