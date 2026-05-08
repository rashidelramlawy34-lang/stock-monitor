import { useState, useEffect, useCallback } from 'react';

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) setAlerts(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 15_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const addAlert = useCallback(async ({ ticker, type, target_price }) => {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, type, target_price: Number(target_price) }),
    });
    if (!res.ok) { const { error } = await res.json(); throw new Error(error); }
    await fetchAlerts();
  }, [fetchAlerts]);

  const deleteAlert = useCallback(async (id) => {
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    await fetchAlerts();
  }, [fetchAlerts]);

  const triggered = alerts.filter(a => a.triggered);
  const active = alerts.filter(a => !a.triggered);

  return { alerts, active, triggered, loading, addAlert, deleteAlert, refresh: fetchAlerts };
}
