import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { useNews } from '../hooks/useNews.js';
import NewsCard, { getPinnedUrls } from '../components/NewsCard.jsx';

const SENTIMENT_FILTERS = ['All', 'Bullish', 'Bearish', 'Neutral'];
const ALL_TAB = '__ALL__';

function SentimentTrend({ articles }) {
  const data = useMemo(() => {
    if (articles.length === 0) return [];
    const buckets = {};
    for (const a of articles) {
      if (!a.published_at) continue;
      const d = new Date(a.published_at * 1000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!buckets[key]) buckets[key] = { key, bullish: 0, bearish: 0, neutral: 0, ts: a.published_at };
      if (a.sentiment === 'bullish') buckets[key].bullish++;
      else if (a.sentiment === 'bearish') buckets[key].bearish++;
      else buckets[key].neutral++;
    }
    return Object.values(buckets).sort((a, b) => a.ts - b.ts).slice(-14);
  }, [articles]);

  if (data.length < 3) return null;

  return (
    <div className="card p-4 mb-5">
      <p style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>Sentiment trend (14 days)</p>
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={data} barSize={8} barGap={2}>
          <Tooltip
            contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', borderRadius: 4 }}
            labelStyle={{ color: 'var(--text-muted)', fontSize: 10 }}
            itemStyle={{ fontSize: 10 }}
            formatter={(v, name) => [v, name.charAt(0).toUpperCase() + name.slice(1)]}
          />
          <Bar dataKey="bullish" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="neutral" stackId="a" fill="#d97706" />
          <Bar dataKey="bearish" stackId="a" fill="#dc2626" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1.5 text-[9px] text-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16a34a]" />Bullish</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#d97706]" />Neutral</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#dc2626]" />Bearish</span>
      </div>
    </div>
  );
}

const SENTIMENT_STYLE = {
  All:     { active: 'bg-[var(--surface-2)] text-[var(--accent)] border-[var(--accent)]' },
  Bullish: { active: 'bg-gain-soft text-gain border-gain' },
  Bearish: { active: 'bg-loss-soft text-loss border-loss' },
  Neutral: { active: 'bg-warn-soft text-warn border-warn' },
};

export default function NewsPage() {
  const { holdings } = usePortfolio();
  const { news, loading, errors, fetchNews } = useNews();
  const [activeTicker, setActiveTicker] = useState(ALL_TAB);
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [pinnedUrls, setPinnedUrls] = useState(() => getPinnedUrls());

  useEffect(() => {
    const handler = () => setPinnedUrls(getPinnedUrls());
    window.addEventListener('smi-pins-changed', handler);
    return () => window.removeEventListener('smi-pins-changed', handler);
  }, []);

  useEffect(() => {
    if (activeTicker === ALL_TAB) {
      for (const h of holdings) {
        if (!news[h.ticker]) fetchNews(h.ticker);
      }
    }
  }, [activeTicker, holdings, news, fetchNews]);

  useEffect(() => {
    if (activeTicker !== ALL_TAB && !news[activeTicker]) fetchNews(activeTicker);
  }, [activeTicker, news, fetchNews]);

  const unifiedArticles = useMemo(() => {
    if (activeTicker !== ALL_TAB) return news[activeTicker] ?? [];
    const seen = new Set();
    const all = [];
    for (const h of holdings) {
      for (const a of news[h.ticker] ?? []) {
        const key = a.url || a.headline;
        if (!seen.has(key)) { seen.add(key); all.push({ ...a, _sourceTicker: h.ticker }); }
      }
    }
    return all.sort((a, b) => (b.published_at ?? 0) - (a.published_at ?? 0));
  }, [activeTicker, holdings, news]);

  const allArticles = unifiedArticles;
  const filtered = sentimentFilter === 'All'
    ? allArticles
    : allArticles.filter(a => a.sentiment?.toLowerCase() === sentimentFilter.toLowerCase());

  const pinnedArticles = allArticles.filter(a => pinnedUrls.has(a.url || a.headline));
  const unpinnedFiltered = filtered.filter(a => !pinnedUrls.has(a.url || a.headline));

  const isLoadingAll = activeTicker === ALL_TAB && holdings.some(h => loading[h.ticker]);
  const isLoading = activeTicker === ALL_TAB ? isLoadingAll : (loading[activeTicker] ?? false);
  const error = activeTicker === ALL_TAB ? null : (errors[activeTicker] ?? null);

  const counts = {
    Bullish: allArticles.filter(a => a.sentiment === 'bullish').length,
    Bearish: allArticles.filter(a => a.sentiment === 'bearish').length,
    Neutral: allArticles.filter(a => a.sentiment === 'neutral').length,
  };

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">News</h1>
          {allArticles.length > 0 && (
            <p className="text-xs text-muted mt-1">
              {allArticles.length} articles
              {counts.Bullish > 0 && <span className="text-bull ml-2">↑ {counts.Bullish} bullish</span>}
              {counts.Bearish > 0 && <span className="text-bear ml-2">↓ {counts.Bearish} bearish</span>}
            </p>
          )}
        </div>
        {activeTicker && (
          <button
            onClick={() => fetchNews(activeTicker === ALL_TAB ? holdings[0]?.ticker : activeTicker)}
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
          <button
            onClick={() => { setActiveTicker(ALL_TAB); setSentimentFilter('All'); }}
            className={activeTicker === ALL_TAB ? 'btn-outline' : 'btn-ghost'}
            style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', fontWeight: 600, ...(activeTicker === ALL_TAB ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : {}) }}
          >
            All
          </button>
          {holdings.map(h => (
            <button
              key={h.ticker}
              onClick={() => { setActiveTicker(h.ticker); setSentimentFilter('All'); }}
              className={activeTicker === h.ticker ? 'btn-outline' : 'btn-ghost'}
              style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', fontWeight: 600, ...(activeTicker === h.ticker ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : {}) }}
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
              className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                sentimentFilter === s
                  ? SENTIMENT_STYLE[s].active
                  : 'bg-transparent border-[var(--border)] text-muted hover:border-[var(--border-2)] hover:text-[var(--text)]'
              }`}
            >
              {s}{s !== 'All' && counts[s] > 0 ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>
      )}

      {/* Sentiment trend chart */}
      {allArticles.length > 0 && <SentimentTrend articles={allArticles} />}

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

      {!isLoading && !error && filtered.length === 0 && activeTicker && (
        <p className="text-muted text-sm">
          {sentimentFilter !== 'All'
            ? `No ${sentimentFilter.toLowerCase()} articles for ${activeTicker}.`
            : `No recent news found for ${activeTicker}.`}
        </p>
      )}

      {/* Pinned articles */}
      {!isLoading && pinnedArticles.length > 0 && (
        <div className="mb-5">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--warn)', fontWeight: 600, marginBottom: 8 }}>★ Pinned</p>
          <div className="flex flex-col gap-3">
            {pinnedArticles.map((a, i) => (
              <NewsCard key={`pin-${a.id ?? i}`} article={a} showTicker={activeTicker === ALL_TAB} />
            ))}
          </div>
          <hr style={{ marginTop: 16, border: 'none', borderTop: '1px solid var(--border)' }} />
        </div>
      )}

      {!isLoading && unpinnedFiltered.length > 0 && (
        <div className="flex flex-col gap-3">
          {unpinnedFiltered.map((a, i) => <NewsCard key={a.id ?? i} article={a} showTicker={activeTicker === ALL_TAB} />)}
        </div>
      )}
    </div>
  );
}
