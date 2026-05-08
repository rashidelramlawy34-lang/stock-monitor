import { useAlerts } from '../hooks/useAlerts.js';

export default function AlertBanner() {
  const { triggered, deleteAlert } = useAlerts();
  if (triggered.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
      <div className="max-w-6xl mx-auto flex flex-wrap gap-2 items-center">
        <span className="text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide shrink-0">
          Alerts
        </span>
        {triggered.map(a => (
          <div key={a.id} className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1 text-xs text-amber-800 dark:text-amber-300">
            <span className="font-mono font-bold">{a.ticker}</span>
            <span>{a.type === 'above' ? '↑' : '↓'} ${a.target_price?.toFixed(2)}</span>
            <button
              onClick={() => deleteAlert(a.id)}
              className="ml-1 text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-white transition-colors"
              title="Dismiss"
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
