import { useAlerts } from '../hooks/useAlerts.js';

export default function AlertBanner() {
  const { triggered, deleteAlert } = useAlerts();
  if (triggered.length === 0) return null;

  return (
    <div className="bg-[#ffaa00]/10 border-b border-[#ffaa00]/30 px-4 py-2">
      <div className="max-w-6xl mx-auto flex flex-wrap gap-2 items-center">
        <span className="hud-label text-[#ffaa00] shrink-0">
          ⚡ Alerts Triggered
        </span>
        {triggered.map(a => (
          <div key={a.id} className="flex items-center gap-1.5 bg-[#ffaa00]/10 border border-[#ffaa00]/40 rounded-full px-2 py-1 text-xs text-[#ffaa00]">
            <span className="font-mono font-bold">{a.ticker}</span>
            <span>{a.type === 'above' ? '↑' : '↓'} ${a.target_price?.toFixed(2)}</span>
            <button
              onClick={() => deleteAlert(a.id)}
              className="ml-1 text-[#ffaa00]/60 hover:text-[#ffaa00] transition-colors"
              title="Dismiss"
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
