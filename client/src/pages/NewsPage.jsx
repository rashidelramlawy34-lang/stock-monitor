import { useState, useEffect } from 'react';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { useNews } from '../hooks/useNews.js';
import NewsCard from '../components/NewsCard.jsx';

const SENTIMENT_FILTERS = ['All', 'Bullish', 'Bearish', 'Neutral'];

const SENTIMENT_CHIP = {
  'All':     'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  'Bullish': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  'Bearish': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  'Neutral': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
};

export default function NewsPage() {
  const { holdings } = usePortfolio();
  const { news, loading, errors, fetchNews } = useNews();
  const [activeTicker, setActiveTicker] = useState(null);
  const [sentimentFilter, setSentimentFilter] = useState('All');

  useEffect(() => {
    if (holdings.length > 0 && !activeTicker) {
      setActiveTicker(holdings[0].ticker);
    }
  }, [holdings, activeTicker]);

  useEffect(() => {
    if (activeTicker && !news[activeTicker]) fetchNews(activeTicker);
  }, [activeTicker, news, fetchNews]);

  const allArticles = activeTicker ? (news[activeTicker] ?? []) : [];
  const articles = sentimentFilter === 'All'
    ? allArticles
    : allArticles.filter(a => a.sentiment?.toLowerCase() === sentimentFilter.toLowerCase());
  const isLoading = activeTicker ? loading[activeTicker] : false;
  const error = activeTicker ? errors[activeTicker] : null;

  const counts = {
    Bullish: allArticles.filter(a => a.sentiment === 'bullish').length,
    Bearish: allArticles.filter(a => a.sentiment === 'bearish').length,
    Neutral: allArticles.filter(a => a.sentiment === 'neutral').length,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">News Feed</h1>
          {allArticles.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
              {allArticles.length} articles
              {counts.Bullish > 0 && <span className="text-bull ml-2">↑ {counts.Bullish} bullish</span>}
              {counts.Bearish > 0 && <span className="text-bear ml-2">↓ {counts.Bearish} bearish</span>}
            </p>
          )}
        </div>
        {activeTicker && (
          <button
            onClick={() => fetchNews(activeTicker)}
            disabled={isLoading}
            className="btn-ghost text-xs disabled:opacity-50"
          >
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        )}
      </div>

      {holdings.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {holdings.map(h => (
            <button
              key={h.ticker}
              onClick={() => { setActiveTicker(h.ticker); setSentimentFilter('All'); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-colors border ${
                activeTicker === h.ticker
                  ? 'bg-accent text-white border-accent'
                  : 'border-slate-200 dark:border-[#1e2d45] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {h.ticker}
            </button>
          ))}
        </div>
      )}

      {/* Sentiment filter */}
      {allArticles.length > 0 && (
        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
          {SENTIMENT_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                sentimentFilter === s
                  ? SENTIMENT_CHIP[s] + ' ring-1 ring-offset-1 ring-current'
                  : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {s}{s !== 'All' && counts[s] > 0 ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>
      )}

      {holdings.length === 0 && (
        <p className="text-slate-500 dark:text-slate-500 text-sm">Add stocks to your portfolio to see news.</p>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
      )}

      {error && <p className="text-bear text-sm">Error: {error}</p>}

      {!isLoading && !error && articles.length === 0 && activeTicker && (
        <p className="text-slate-500 dark:text-slate-500 text-sm">
          {sentimentFilter !== 'All'
            ? `No ${sentimentFilter.toLowerCase()} articles for ${activeTicker}.`
            : `No recent news found for ${activeTicker}.`}
        </p>
      )}

      {!isLoading && articles.length > 0 && (
        <div className="flex flex-col gap-3">
          {articles.map(a => <NewsCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}
