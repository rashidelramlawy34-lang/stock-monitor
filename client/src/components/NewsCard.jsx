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
      className="block card p-4 hover:border-accent/40 dark:hover:border-accent/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 leading-snug flex-1">
          {article.headline}
        </p>
        <span className={`shrink-0 ${s.cls}`}>{s.label}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
        {article.source && <span>{article.source}</span>}
        {article.source && date && <span>·</span>}
        {date && <span>{date}</span>}
      </div>
    </a>
  );
}
