import { useState, useCallback, useEffect, useRef } from 'react';

export function useCandles(tickers = []) {
  const [candles, setCandles] = useState({});
  const [loading, setLoading] = useState({});
  const fetchedRef = useRef(new Set());

  const fetchCandles = useCallback(async (ticker) => {
    setLoading(l => ({ ...l, [ticker]: true }));
    try {
      const res = await fetch(`/api/candles/${ticker}`);
      if (!res.ok) return;
      const data = await res.json();
      setCandles(c => ({ ...c, [ticker]: data }));
    } finally {
      setLoading(l => ({ ...l, [ticker]: false }));
    }
  }, []);

  useEffect(() => {
    for (const ticker of tickers) {
      if (!fetchedRef.current.has(ticker)) {
        fetchedRef.current.add(ticker);
        fetchCandles(ticker);
      }
    }
  }, [tickers.join(','), fetchCandles]); // eslint-disable-line

  return { candles, loading, fetchCandles };
}
