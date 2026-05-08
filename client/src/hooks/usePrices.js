import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_MS = Number(import.meta.env.VITE_PRICE_REFRESH_MS ?? 30_000);

export function usePrices(tickers) {
  const [prices, setPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const fetchPrices = useCallback(async () => {
    if (tickers.length === 0) return;
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) return;
      const data = await res.json();
      const map = {};
      for (const item of data) map[item.ticker] = item;
      setPrices(map);
      setLastUpdated(new Date());
    } catch { /* silently ignore poll errors */ }
  }, [tickers.join(',')]); // eslint-disable-line

  useEffect(() => {
    fetchPrices();
    timerRef.current = setInterval(fetchPrices, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchPrices]);

  return { prices, lastUpdated, refresh: fetchPrices };
}
