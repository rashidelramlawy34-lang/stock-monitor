import { useState, useEffect, useCallback } from 'react';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setWatchlist(await res.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  const addTicker = useCallback(async (ticker, note = '') => {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ticker, note }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || `HTTP ${res.status}`);
    }
    await fetchWatchlist();
  }, [fetchWatchlist]);

  const removeTicker = useCallback(async (ticker) => {
    await fetch(`/api/watchlist/${ticker}`, { method: 'DELETE', credentials: 'include' });
    await fetchWatchlist();
  }, [fetchWatchlist]);

  return { watchlist, loading, error, addTicker, removeTicker, refresh: fetchWatchlist };
}
