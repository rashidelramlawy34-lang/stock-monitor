import { useState, useEffect, useCallback } from 'react';

export function useMarket() {
  const [indices, setIndices] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMarket = useCallback(async () => {
    try {
      const res = await fetch('/api/prices/market');
      if (!res.ok) return;
      const data = await res.json();
      const map = {};
      for (const item of data) map[item.ticker] = item;
      setIndices(map);
      setLastUpdated(new Date());
    } catch {}
  }, []);

  useEffect(() => {
    fetchMarket();
    const id = setInterval(fetchMarket, 30_000);
    return () => clearInterval(id);
  }, [fetchMarket]);

  return { indices, lastUpdated };
}
