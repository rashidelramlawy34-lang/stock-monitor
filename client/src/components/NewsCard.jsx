const SENTIMENT = {
  bullish: { label: 'Bullish', cls: 'badge-bull' },
  bearish: { label: 'Bearish', cls: 'badge-bear' },
  neutral: { label: 'Neutral', cls: 'badge-neutral' },
};

export default function NewsCard({ article }) {
  const s = SENTIMENT[article.sentiment] ?? SENTIMENT.neutral;
  const date = article.published_at
    ? new Date(article.published_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <a
      href={article.url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block card p-4 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[#a8d8ea] group-hover:text-[#00d4ff] leading-snug flex-1 transition-colors">
          {article.headline}
        </p>
        <span className={`shrink-0 ${s.cls}`}>{s.label}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        {article.source && <span>{article.source}</span>}
        {article.source && date && <span>·</span>}
        {date && <span>{date}</span>}
      </div>
    </a>
  );
}
