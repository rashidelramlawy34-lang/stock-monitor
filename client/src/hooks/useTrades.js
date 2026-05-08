import { useState, useEffect, useCallback } from 'react';

export function useTrades() {
  const [trades, setTrades] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrades = useCallback(async () => {
    try {
      const [tradesRes, summaryRes] = await Promise.all([
        fetch('/api/trades', { credentials: 'include' }),
        fetch('/api/trades/summary', { credentials: 'include' }),
      ]);
      if (!tradesRes.ok) throw new Error(`HTTP ${tradesRes.status}`);
      if (!summaryRes.ok) throw new Error(`HTTP ${summaryRes.status}`);
      setTrades(await tradesRes.json());
      setSummary(await summaryRes.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const addTrade = useCallback(async (trade) => {
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(trade),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || `HTTP ${res.status}`);
    }
    await fetchTrades();
  }, [fetchTrades]);

  const deleteTrade = useCallback(async (id) => {
    await fetch(`/api/trades/${id}`, { method: 'DELETE', credentials: 'include' });
    await fetchTrades();
  }, [fetchTrades]);

  return { trades, summary, loading, error, addTrade, deleteTrade, refresh: fetchTrades };
}
