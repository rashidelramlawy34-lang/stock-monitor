import { useState, useCallback } from 'react';

export function useNews() {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const fetchNews = useCallback(async (ticker) => {
    setLoading(l => ({ ...l, [ticker]: true }));
    try {
      const res = await fetch(`/api/news/${ticker}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCache(c => ({ ...c, [ticker]: data }));
      setErrors(e => ({ ...e, [ticker]: null }));
    } catch (err) {
      setErrors(e => ({ ...e, [ticker]: err.message }));
    } finally {
      setLoading(l => ({ ...l, [ticker]: false }));
    }
  }, []);

  return { news: cache, loading, errors, fetchNews };
}
