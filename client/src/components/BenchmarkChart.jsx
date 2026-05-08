import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useBenchmark } from '../hooks/useBenchmark.js';

function pctReturns(closes) {
  if (!closes || closes.length < 2) return [];
  const base = closes[0];
  return closes.map(c => ((c - base) / base) * 100);
}

function buildChartData(portfolioTimestamps, portfolioReturns, benchmarkTimestamps, benchmarkReturns, label) {
  // Align by date string
  const benchMap = {};
  benchmarkTimestamps.forEach((ts, i) => {
    const date = new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    benchMap[date] = benchmarkReturns[i];
  });

  return portfolioTimestamps.map((ts, i) => {
    const date = new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date,
      Portfolio: +portfolioReturns[i].toFixed(2),
      [label]: benchMap[date] != null ? +benchMap[date].toFixed(2) : null,
    };
  });
}

export default function BenchmarkChart({ holdings, candles }) {
  const [bench, setBench] = useState('SPY');
  const { benchmark, loading } = useBenchmark();

  const chartData = useMemo(() => {
    if (!benchmark || !holdings.length) return [];

    // Compute weighted portfolio returns
    // Use the shortest candle series that has data
    const holdingCandles = holdings
      .map(h => candles?.[h.ticker])
      .filter(c => c?.closes?.length > 1);

    if (holdingCandles.length === 0) return [];

    // Use first holding's timestamps as reference
    const refCandles = holdingCandles[0];
    const timestamps = refCandles.timestamps;

    // Weighted avg daily % return (equal weight for simplicity)
    const portfolioReturns = refCandles.closes.map((_, idx) => {
      let total = 0, count = 0;
      for (const c of holdingCandles) {
        if (c.closes[idx] != null && c.closes[0] != null) {
          total += ((c.closes[idx] - c.closes[0]) / c.closes[0]) * 100;
          count++;
        }
      }
      return count > 0 ? total / count : 0;
    });

    const bData = benchmark[bench];
    if (!bData?.closes?.length) return [];

    return buildChartData(timestamps, portfolioReturns, bData.timestamps, pctReturns(bData.closes), bench);
  }, [benchmark, holdings, candles, bench]);

  if (loading) return null;
  if (chartData.length < 2) return null;

  const isPositive = (chartData[chartData.length - 1]?.Portfolio ?? 0) >= 0;
  const portfolioColor = isPositive ? '#00e676' : '#ff3355';

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="hud-label">Portfolio vs Benchmark</h2>
        <div className="flex gap-1">
          {['SPY', 'QQQ'].map(b => (
            <button
              key={b}
              onClick={() => setBench(b)}
              className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all tracking-wider ${
                bench === b
                  ? 'bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border-[rgba(0,212,255,0.4)]'
                  : 'border-[rgba(0,212,255,0.15)] text-muted hover:text-[#00d4ff]'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(0,212,255,0.4)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'rgba(0,212,255,0.4)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
          />
          <Tooltip
            contentStyle={{ background: '#0d1526', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 4, fontSize: 11 }}
            formatter={(v, name) => [`${v >= 0 ? '+' : ''}${v}%`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
          <Line type="monotone" dataKey="Portfolio" stroke={portfolioColor} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey={bench} stroke="rgba(0,212,255,0.5)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
