import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import { useBenchmark } from '../hooks/useBenchmark.js';

const RANGES = ['1W', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'];

function getRangeCutoff(range) {
  const now = Date.now() / 1000;
  if (range === 'ALL') return 0;
  if (range === 'YTD') return new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
  const days = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
  return now - (days[range] ?? 0) * 86400;
}

function RangeButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all tracking-wider ${
        active
          ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border-[rgba(0,212,255,0.4)]'
          : 'border-[rgba(0,212,255,0.12)] text-muted hover:text-[#00d4ff] hover:border-[rgba(0,212,255,0.3)]'
      }`}
    >
      {label}
    </button>
  );
}

function pctReturns(closes) {
  if (!closes || closes.length < 2) return [];
  const base = closes[0];
  return closes.map(c => ((c - base) / base) * 100);
}

function buildChartData(portfolioTimestamps, portfolioReturns, benchmarkTimestamps, benchmarkReturns, label) {
  const benchMap = {};
  benchmarkTimestamps.forEach((ts, i) => {
    const date = new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    benchMap[date] = benchmarkReturns[i];
  });

  return portfolioTimestamps.map((ts, i) => {
    const date = new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date,
      ts,
      Portfolio: +portfolioReturns[i].toFixed(2),
      [label]: benchMap[date] != null ? +benchMap[date].toFixed(2) : null,
    };
  });
}

function CustomTooltip({ active, payload, label, bench }) {
  if (!active || !payload?.length) return null;
  const portfolio = payload.find(p => p.dataKey === 'Portfolio');
  const benchmark = payload.find(p => p.dataKey === bench);
  return (
    <div style={{ background: '#070d18', border: '1px solid rgba(0,212,255,0.25)', borderRadius: 8 }}
      className="px-3 py-2.5 text-xs shadow-xl">
      <p className="text-muted mb-2">{label}</p>
      {portfolio && (
        <p className="font-mono font-bold mb-1" style={{ color: portfolio.stroke }}>
          Portfolio: {portfolio.value >= 0 ? '+' : ''}{portfolio.value}%
        </p>
      )}
      {benchmark && benchmark.value != null && (
        <p className="font-mono" style={{ color: 'rgba(0,212,255,0.6)' }}>
          {bench}: {benchmark.value >= 0 ? '+' : ''}{benchmark.value}%
        </p>
      )}
    </div>
  );
}

export default function BenchmarkChart({ holdings, candles }) {
  const [bench, setBench] = useState('SPY');
  const [range, setRange] = useState('1M');
  const { benchmark, loading } = useBenchmark();

  const chartData = useMemo(() => {
    if (!benchmark || !holdings.length) return [];

    const holdingCandles = holdings
      .map(h => candles?.[h.ticker])
      .filter(c => c?.closes?.length > 1);

    if (holdingCandles.length === 0) return [];

    const refCandles = holdingCandles[0];
    const timestamps = refCandles.timestamps;

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

    const full = buildChartData(timestamps, portfolioReturns, bData.timestamps, pctReturns(bData.closes), bench);
    const cutoff = getRangeCutoff(range);
    if (cutoff === 0) return full;
    const filtered = full.filter((_, i) => timestamps[i] >= cutoff);
    return filtered.length >= 2 ? filtered : full;
  }, [benchmark, holdings, candles, bench, range]);

  if (loading) return null;
  if (chartData.length < 2) return null;

  const lastPortfolio = chartData[chartData.length - 1]?.Portfolio ?? 0;
  const portfolioColor = lastPortfolio >= 0 ? '#00e676' : '#ff3355';
  const lastBench = chartData[chartData.length - 1]?.[bench] ?? 0;
  const outperforming = lastPortfolio > lastBench;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="hud-label mb-1">vs Benchmark</p>
          <p className={`text-lg font-bold font-mono ${outperforming ? 'text-bull' : 'text-bear'}`}>
            {outperforming ? '+' : ''}{(lastPortfolio - lastBench).toFixed(2)}% vs {bench}
          </p>
        </div>
        <div className="flex gap-1.5">
          {['SPY', 'QQQ'].map(b => (
            <button
              key={b}
              onClick={() => setBench(b)}
              className={`text-xs font-bold px-3 py-1 rounded-full border transition-all tracking-wider ${
                bench === b
                  ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border-[rgba(0,212,255,0.4)]'
                  : 'border-[rgba(0,212,255,0.15)] text-muted hover:text-[#00d4ff] hover:border-[rgba(0,212,255,0.3)]'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-1.5 mb-4">
        {RANGES.map(r => (
          <RangeButton key={r} label={r} active={range === r} onClick={() => setRange(r)} />
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="0"
            horizontal={true} vertical={false}
            stroke="rgba(0,212,255,0.04)"
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(0,212,255,0.35)', fontSize: 10, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'rgba(0,212,255,0.35)', fontSize: 10, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
            width={52}
          />
          <ReferenceLine y={0} stroke="rgba(0,212,255,0.15)" strokeDasharray="4 4" />
          <Tooltip
            content={<CustomTooltip bench={bench} />}
            cursor={{ stroke: 'rgba(0,212,255,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Line
            type="monotone"
            dataKey="Portfolio"
            stroke={portfolioColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: portfolioColor, stroke: '#010409', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={700}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey={bench}
            stroke="rgba(0,212,255,0.45)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 3"
            activeDot={{ r: 4, fill: '#00d4ff', stroke: '#010409', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-5 mt-3 px-1">
        <span className="flex items-center gap-1.5 text-[10px] text-muted">
          <span className="w-4 h-0.5 rounded-full" style={{ background: portfolioColor }} />
          Portfolio
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted">
          <span className="w-4 h-px" style={{ borderTop: '1.5px dashed rgba(0,212,255,0.45)' }} />
          {bench}
        </span>
      </div>
    </div>
  );
}
