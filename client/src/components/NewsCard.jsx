import { useState, useEffect } from 'react';

const SENTIMENT = {
  bullish: { label: 'Bullish', cls: 'badge-bull' },
  bearish: { label: 'Bearish', cls: 'badge-bear' },
  neutral: { label: 'Neutral', cls: 'badge-neutral' },
};

const PINNED_KEY = 'smi_pinned_articles';

function getPinned() {
  try { return new Set(JSON.parse(localStorage.getItem(PINNED_KEY) ?? '[]')); }
  catch { return new Set(); }
}
function savePinned(set) {
  localStorage.setItem(PINNED_KEY, JSON.stringify([...set]));
}

export function getPinnedUrls() { return getPinned(); }

export default function NewsCard({ article, showTicker }) {
  const key = article.url || article.headline;
  const [pinned, setPinned] = useState(() => getPinned().has(key));

  useEffect(() => {
    setPinned(getPinned().has(key));
  }, [key]);

  const togglePin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const set = getPinned();
    if (set.has(key)) set.delete(key);
    else set.add(key);
    savePinned(set);
    setPinned(set.has(key));
    window.dispatchEvent(new Event('smi-pins-changed'));
  };

  const s = SENTIMENT[article.sentiment] ?? SENTIMENT.neutral;
  const date = article.published_at
    ? new Date(article.published_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <a
      href={article.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block card p-4 transition-colors group relative"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[#a8d8ea] group-hover:text-[#00d4ff] leading-snug flex-1 transition-colors">
          {article.headline}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={togglePin}
            className={`text-xs transition-colors p-0.5 rounded ${pinned ? 'text-[#ffaa00]' : 'text-muted hover:text-[#ffaa00]'}`}
            title={pinned ? 'Unpin' : 'Pin article'}
          >
            {pinned ? '★' : '☆'}
          </button>
          <span className={`shrink-0 ${s.cls}`}>{s.label}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        {showTicker && article._sourceTicker && (
          <span className="font-mono font-bold text-arc tracking-widest">{article._sourceTicker}</span>
        )}
        {showTicker && article._sourceTicker && (article.source || date) && <span>·</span>}
        {article.source && <span>{article.source}</span>}
        {article.source && date && <span>·</span>}
        {date && <span>{date}</span>}
      </div>
    </a>
  );
}
