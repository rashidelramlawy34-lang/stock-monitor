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

  const addAlert = useCallback(async ({ ticker, type, target_price, trigger_pct }) => {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker,
        type,
        target_price: target_price != null && target_price !== '' ? Number(target_price) : null,
        trigger_pct: trigger_pct != null && trigger_pct !== '' ? Number(trigger_pct) : null,
      }),
    });
    if (!res.ok) { const { error } = await res.json(); throw new Error(error); }
    await fetchAlerts();
  }, [fetchAlerts]);

  const deleteAlert = useCallback(async (id) => {
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    await fetchAlerts();
  }, [fetchAlerts]);

  const snoozeAlert = useCallback(async (id, hours = 24) => {
    await fetch(`/api/alerts/${id}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours }),
    });
    await fetchAlerts();
  }, [fetchAlerts]);

  const resetAlert = useCallback(async (id) => {
    await fetch(`/api/alerts/${id}/reset`, { method: 'POST' });
    await fetchAlerts();
  }, [fetchAlerts]);

  const triggered = alerts.filter(a => a.triggered && (!a.snoozed_until || a.snoozed_until < Date.now() / 1000));
  const snoozed = alerts.filter(a => a.snoozed_until && a.snoozed_until >= Date.now() / 1000);
  const active = alerts.filter(a => !a.triggered && (!a.snoozed_until || a.snoozed_until < Date.now() / 1000));

  return { alerts, active, triggered, snoozed, loading, addAlert, deleteAlert, snoozeAlert, resetAlert, refresh: fetchAlerts };
}
