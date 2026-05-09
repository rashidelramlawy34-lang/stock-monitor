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

function PriceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map(p => [p.dataKey, p]));
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', borderRadius: 8 }}
      className="px-3 py-2.5 text-xs shadow-xl">
      <p className="text-muted mb-2">{fmt(label)}</p>
      {byKey.price && <p className="font-mono font-bold text-[var(--accent)]">${byKey.price.value.toFixed(2)}</p>}
      {byKey.sma20?.value != null && <p className="font-mono text-[var(--warn)] mt-0.5">SMA20 ${byKey.sma20.value.toFixed(2)}</p>}
      {byKey.sma50?.value != null && <p className="font-mono text-[var(--loss)] mt-0.5">SMA50 ${byKey.sma50.value.toFixed(2)}</p>}
    </div>
  );
}

function RsiTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  const color = val > 70 ? '#dc2626' : val < 30 ? '#16a34a' : '#3b82f6';
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', borderRadius: 8 }}
      className="px-3 py-2.5 text-xs shadow-xl">
      <p className="text-muted mb-1">{fmt(label)}</p>
      <p className="font-mono font-bold" style={{ color }}>RSI {val?.toFixed(1)}</p>
    </div>
  );
}

function MacdTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map(p => [p.dataKey, p]));
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', borderRadius: 8 }}
      className="px-3 py-2.5 text-xs shadow-xl">
      <p className="text-muted mb-2">{fmt(label)}</p>
      {byKey.macd?.value != null && <p className="font-mono text-[var(--accent)]">MACD {byKey.macd.value.toFixed(4)}</p>}
      {byKey.signal?.value != null && <p className="font-mono text-[var(--warn)] mt-0.5">Signal {byKey.signal.value.toFixed(4)}</p>}
    </div>
  );
}

const AXIS_STYLE = { fill: '#6b7280', fontSize: 10, fontFamily: 'Inter' };
const GRID_PROPS = { strokeDasharray: '0', horizontal: true, vertical: false, stroke: 'rgba(17,24,39,0.06)' };
const CURSOR_PROPS = { stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '4 4' };

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
  const rsiColor = lastRsi === null ? '#3b82f6' : lastRsi > 70 ? '#dc2626' : lastRsi < 30 ? '#16a34a' : '#3b82f6';

  return (
    <div className="space-y-3">
      {/* Price + MAs */}
      <div>
        <p className="hud-label text-[10px] mb-2 px-1">{ticker} · Price + Moving Averages</p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} syncId="technicals">
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="ts" tickFormatter={fmt} tick={AXIS_STYLE} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={['auto', 'auto']} tick={AXIS_STYLE} axisLine={false} tickLine={false} width={52}
              tickFormatter={v => `$${v.toFixed(0)}`} />
            <Tooltip content={<PriceTooltip />} cursor={CURSOR_PROPS} />
            <Line type="monotone" dataKey="price" stroke="#3b82f6" dot={false} strokeWidth={2} name="Price"
              activeDot={{ r: 5, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="sma20" stroke="#d97706" dot={false} strokeWidth={1.5} strokeDasharray="5 3" name="SMA20" connectNulls
              activeDot={{ r: 4, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="sma50" stroke="#dc2626" dot={false} strokeWidth={1.5} strokeDasharray="5 3" name="SMA50" connectNulls
              activeDot={{ r: 4, fill: '#dc2626', stroke: '#ffffff', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-1.5 px-1">
          <span className="flex items-center gap-1.5 text-[10px] text-muted">
            <span className="w-3 h-0.5 rounded-full bg-[#3b82f6]" />Price
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted">
            <span className="w-3 h-px" style={{ borderTop: '1.5px dashed #d97706' }} />SMA20
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted">
            <span className="w-3 h-px" style={{ borderTop: '1.5px dashed #dc2626' }} />SMA50
          </span>
        </div>
      </div>

      {/* RSI */}
      <div>
        <p className="hud-label text-[10px] mb-2 px-1">
          RSI(14) · <span style={{ color: rsiColor }}>{lastRsi?.toFixed(1) ?? '--'}</span>
          {lastRsi !== null && (
            <span className="ml-2 normal-case font-normal text-muted" style={{ fontFamily: 'Inter', letterSpacing: 0 }}>
              {lastRsi > 70 ? '— overbought' : lastRsi < 30 ? '— oversold' : '— neutral'}
            </span>
          )}
        </p>
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} syncId="technicals">
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="ts" tickFormatter={fmt} tick={AXIS_STYLE} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={AXIS_STYLE} axisLine={false} tickLine={false} width={30} ticks={[0, 30, 50, 70, 100]} />
            <ReferenceLine y={70} stroke="rgba(220,38,38,0.35)" strokeDasharray="4 3" />
            <ReferenceLine y={30} stroke="rgba(22,163,74,0.35)" strokeDasharray="4 3" />
            <Tooltip content={<RsiTooltip />} cursor={CURSOR_PROPS} />
            <Line type="monotone" dataKey="rsi" stroke={rsiColor} dot={false} strokeWidth={2} name="RSI" connectNulls
              activeDot={{ r: 4, fill: rsiColor, stroke: '#ffffff', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* MACD */}
      <div>
        <p className="hud-label text-[10px] mb-2 px-1">MACD (12, 26, 9)</p>
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} syncId="technicals">
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="ts" tickFormatter={fmt} tick={AXIS_STYLE} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={44} />
            <ReferenceLine y={0} stroke="#d1d5db" />
            <Tooltip content={<MacdTooltip />} cursor={CURSOR_PROPS} />
            <Bar dataKey="hist" name="Hist" fill="rgba(59,130,246,0.2)" activeBar={{ fill: 'rgba(59,130,246,0.45)' }} />
            <Line type="monotone" dataKey="macd" stroke="#3b82f6" dot={false} strokeWidth={1.5} name="MACD" connectNulls
              activeDot={{ r: 4, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="signal" stroke="#d97706" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Signal" connectNulls
              activeDot={{ r: 4, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
