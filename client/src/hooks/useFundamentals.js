import { useState, useCallback, useEffect, useRef } from 'react';

export function useFundamentals(tickers = []) {
  const [fundamentals, setFundamentals] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const fetchedRef = useRef(new Set());

  const fetchFundamentals = useCallback(async (ticker) => {
    setLoading(l => ({ ...l, [ticker]: true }));
    try {
      const res = await fetch(`/api/fundamentals/${ticker}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFundamentals(f => ({ ...f, [ticker]: data }));
      setErrors(e => ({ ...e, [ticker]: null }));
    } catch (err) {
      setErrors(e => ({ ...e, [ticker]: err.message }));
    } finally {
      setLoading(l => ({ ...l, [ticker]: false }));
    }
  }, []);

  useEffect(() => {
    for (const ticker of tickers) {
      if (!fetchedRef.current.has(ticker)) {
        fetchedRef.current.add(ticker);
        fetchFundamentals(ticker);
      }
    }
  }, [tickers.join(','), fetchFundamentals]); // eslint-disable-line

  return { fundamentals, loading, errors, fetchFundamentals };
}
