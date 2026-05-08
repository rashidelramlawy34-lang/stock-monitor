import { useState, useEffect, useCallback } from 'react';

export function useHRHR() {
  const [candidates, setCandidates] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const fetchCache = useCallback(async () => {
    try {
      const res = await fetch('/api/hrhr');
      if (!res.ok) return;
      const data = await res.json();
      setCandidates(data.results ?? []);
      setGeneratedAt(data.generated_at);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCache(); }, [fetchCache]);

  const refresh = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      await fetch('/api/hrhr/refresh', { method: 'POST' });
      // Poll until generated_at changes
      const startAt = generatedAt;
      let attempts = 0;
      const poll = async () => {
        await fetchCache();
        attempts++;
        if (attempts < 24) setTimeout(poll, 5000); // poll up to 2 min
        else setScanning(false);
      };
      // Start polling after 5s
      setTimeout(() => {
        const checkDone = async () => {
          const res = await fetch('/api/hrhr');
          const data = await res.json();
          if (data.generated_at !== startAt || attempts > 20) {
            setCandidates(data.results ?? []);
            setGeneratedAt(data.generated_at);
            setScanning(false);
          } else {
            attempts++;
            setTimeout(checkDone, 5000);
          }
        };
        checkDone();
      }, 5000);
    } catch (err) {
      setError(err.message);
      setScanning(false);
    }
  }, [generatedAt, fetchCache]);

  return { candidates, generatedAt, loading, scanning, error, refresh };
}
