import { useState, useCallback } from 'react';

export function useCoach() {
  const [analysis, setAnalysis] = useState(undefined); // undefined = not fetched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCached = useCallback(async () => {
    try {
      const res = await fetch('/api/coach', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalysis(data); // null means cache miss/expired
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/coach/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      setAnalysis(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { analysis, loading, error, fetchCached, refresh };
}
