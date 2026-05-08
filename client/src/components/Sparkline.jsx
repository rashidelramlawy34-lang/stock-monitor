import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const Sparkline = React.memo(function Sparkline({ closes, positive, ticker }) {
  if (!closes || closes.length < 2) {
    return <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>;
  }
  const data = closes.map(v => ({ v }));
  const color = positive ? '#22c55e' : '#ef4444';
  const gradId = `sg-${ticker ?? (positive ? 'pos' : 'neg')}`;

  return (
    <div style={{ width: 72, height: 28, display: 'inline-block' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone" dataKey="v"
            stroke={color} strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false} isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export default Sparkline;
