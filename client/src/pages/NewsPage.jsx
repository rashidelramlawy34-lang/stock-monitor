import { useState, useEffect } from 'react';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { useNews } from '../hooks/useNews.js';
import NewsCard from '../components/NewsCard.jsx';

const SENTIMENT_FILTERS = ['All', 'Bullish', 'Bearish', 'Neutral'];

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

  const SENTIMENT_STYLE = {
    All:     { active: 'bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border-[rgba(0,212,255,0.4)]' },
    Bullish: { active: 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/40' },
    Bearish: { active: 'bg-[#ff3355]/10 text-[#ff3355] border-[#ff3355]/40' },
    Neutral: { active: 'bg-[#ffaa00]/10 text-[#ffaa00] border-[#ffaa00]/40' },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="hud-title text-xl">Intel Feed</h1>
          {allArticles.length > 0 && (
            <p className="text-xs text-muted mt-1 tracking-wide">
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
            className="btn-ghost text-xs disabled:opacity-40"
          >
            {isLoading ? 'Loading…' : '↻ Refresh'}
          </button>
        )}
      </div>

      {/* Ticker tabs */}
      {holdings.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {holdings.map(h => (
            <button
              key={h.ticker}
              onClick={() => { setActiveTicker(h.ticker); setSentimentFilter('All'); }}
              className={`px-3 py-1.5 rounded-sm text-sm font-mono font-bold transition-all border tracking-widest ${
                activeTicker === h.ticker
                  ? 'bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border-[rgba(0,212,255,0.5)] shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                  : 'border-[rgba(0,212,255,0.15)] text-muted hover:text-[#00d4ff] hover:border-[rgba(0,212,255,0.3)]'
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
              className={`text-xs font-bold px-2.5 py-1 rounded-sm border transition-all tracking-wider uppercase ${
                sentimentFilter === s
                  ? SENTIMENT_STYLE[s].active
                  : 'bg-transparent border-[rgba(0,212,255,0.15)] text-muted hover:border-[rgba(0,212,255,0.3)] hover:text-[#a8d8ea]'
              }`}
            >
              {s}{s !== 'All' && counts[s] > 0 ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>
      )}

      {holdings.length === 0 && (
        <p className="text-muted text-sm">Add stocks to your portfolio to see news.</p>
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
        <p className="text-muted text-sm">
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
