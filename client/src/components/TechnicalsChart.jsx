import { useMemo } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts';
import { sma, rsi, macd } from '../utils/technicals';

function fmt(ts) {
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function TechnicalsChart({ closes = [], timestamps = [], ticker = '' }) {
  const data = useMemo(() => {
    if (closes.length < 30) return null;
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const rsiVals = rsi(closes, 14);
    const { macdLine, signalLine, histogram } = macd(closes);

    return closes.map((price, i) => ({
      ts: timestamps?.[i] ?? i,
      price: +price.toFixed(2),
      sma20: sma20[i] !== null ? +sma20[i].toFixed(2) : null,
      sma50: sma50[i] !== null ? +sma50[i].toFixed(2) : null,
      rsi: rsiVals[i] !== null ? +rsiVals[i].toFixed(1) : null,
      macd: macdLine[i] !== null ? +macdLine[i].toFixed(4) : null,
      signal: signalLine[i] !== null ? +signalLine[i].toFixed(4) : null,
      hist: histogram[i] !== null ? +histogram[i].toFixed(4) : null,
    }));
  }, [closes, timestamps]);

  if (!data) return <p className="text-muted text-xs p-4">Not enough data (need 30+ candles)</p>;

  const lastRsi = [...data].reverse().find(d => d.rsi !== null)?.rsi ?? null;
  const rsiColor = lastRsi === null ? '#00d4ff' : lastRsi > 70 ? '#ff3355' : lastRsi < 30 ? '#00e676' : '#00d4ff';

  return (
    <div className="space-y-4">
      {/* Price + MAs */}
      <div>
        <p className="hud-label text-[10px] mb-1 px-1">{ticker} · Price + SMA</p>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
            <XAxis dataKey="ts" tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(0,212,255,0.3)' }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'rgba(0,212,255,0.3)' }} width={50} />
            <Tooltip
              contentStyle={{ background: '#0a1828', border: '1px solid rgba(0,212,255,0.3)', fontSize: 11 }}
              labelFormatter={fmt}
            />
            <Line type="monotone" dataKey="price" stroke="#00d4ff" dot={false} strokeWidth={1.5} name="Price" />
            <Line type="monotone" dataKey="sma20" stroke="#ffaa00" dot={false} strokeWidth={1} strokeDasharray="4 2" name="SMA20" connectNulls />
            <Line type="monotone" dataKey="sma50" stroke="#ff3355" dot={false} strokeWidth={1} strokeDasharray="4 2" name="SMA50" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI */}
      <div>
        <p className="hud-label text-[10px] mb-1 px-1">RSI(14) · <span style={{ color: rsiColor }}>{lastRsi?.toFixed(1) ?? '--'}</span></p>
        <ResponsiveContainer width="100%" height={80}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
            <XAxis dataKey="ts" tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(0,212,255,0.3)' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'rgba(0,212,255,0.3)' }} width={30} />
            <ReferenceLine y={70} stroke="rgba(255,51,85,0.4)" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="rgba(0,230,118,0.4)" strokeDasharray="3 3" />
            <Tooltip contentStyle={{ background: '#0a1828', border: '1px solid rgba(0,212,255,0.3)', fontSize: 11 }} labelFormatter={fmt} />
            <Line type="monotone" dataKey="rsi" stroke={rsiColor} dot={false} strokeWidth={1.5} name="RSI" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* MACD */}
      <div>
        <p className="hud-label text-[10px] mb-1 px-1">MACD(12,26,9)</p>
        <ResponsiveContainer width="100%" height={80}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.06)" />
            <XAxis dataKey="ts" tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(0,212,255,0.3)' }} />
            <YAxis tick={{ fontSize: 9, fill: 'rgba(0,212,255,0.3)' }} width={40} />
            <ReferenceLine y={0} stroke="rgba(0,212,255,0.2)" />
            <Tooltip contentStyle={{ background: '#0a1828', border: '1px solid rgba(0,212,255,0.3)', fontSize: 11 }} labelFormatter={fmt} />
            <Bar dataKey="hist" fill="rgba(0,212,255,0.3)" name="Hist" />
            <Line type="monotone" dataKey="macd" stroke="#00d4ff" dot={false} strokeWidth={1} name="MACD" connectNulls />
            <Line type="monotone" dataKey="signal" stroke="#ffaa00" dot={false} strokeWidth={1} strokeDasharray="3 2" name="Signal" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
