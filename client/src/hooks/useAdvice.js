import { useState, useCallback } from 'react';

export function useAdvice() {
  const [advice, setAdvice] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const fetchAdvice = useCallback(async (ticker) => {
    setLoading(l => ({ ...l, [ticker]: true }));
    try {
      const res = await fetch(`/api/advice/${ticker}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAdvice(a => ({ ...a, [ticker]: data }));
      setErrors(e => ({ ...e, [ticker]: null }));
    } catch (err) {
      setErrors(e => ({ ...e, [ticker]: err.message }));
    } finally {
      setLoading(l => ({ ...l, [ticker]: false }));
    }
  }, []);

  return { advice, loading, errors, fetchAdvice };
}
