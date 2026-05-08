export function sma(closes, period) {
  const result = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    result[i] = slice.reduce((a, b) => a + b, 0) / period;
  }
  return result;
}

export function ema(closes, period) {
  const result = new Array(closes.length).fill(null);
  const k = 2 / (period + 1);
  let prev = null;
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) continue;
    if (prev === null) {
      prev = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
      result[i] = prev;
    } else {
      prev = closes[i] * k + prev * (1 - k);
      result[i] = prev;
    }
  }
  return result;
}

export function rsi(closes, period = 14) {
  const result = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  const gains = [], losses = [];
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  let avgGain = gains.reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    if (i > period) {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = 100 - 100 / (1 + rs);
  }
  return result;
}

export function macd(closes, fast = 12, slow = 26, signal = 9) {
  const fastEma = ema(closes, fast);
  const slowEma = ema(closes, slow);
  const macdLine = closes.map((_, i) =>
    fastEma[i] !== null && slowEma[i] !== null ? fastEma[i] - slowEma[i] : null
  );

  const macdValues = macdLine.filter(v => v !== null);
  const macdFull = macdLine.map((v, i) => {
    if (v === null) return null;
    const idx = macdLine.slice(0, i + 1).filter(x => x !== null).length - 1;
    return macdValues[idx];
  });

  const signalLine = new Array(closes.length).fill(null);
  const k = 2 / (signal + 1);
  let prev = null;
  let count = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdFull[i] === null) continue;
    count++;
    if (count < signal) continue;
    if (prev === null) {
      const startIdx = closes.length - macdValues.length;
      const slice = macdFull.slice(0, i + 1).filter(v => v !== null).slice(-signal);
      prev = slice.reduce((a, b) => a + b, 0) / signal;
      signalLine[i] = prev;
    } else {
      prev = macdFull[i] * k + prev * (1 - k);
      signalLine[i] = prev;
    }
  }

  const histogram = closes.map((_, i) =>
    macdFull[i] !== null && signalLine[i] !== null ? macdFull[i] - signalLine[i] : null
  );

  return { macdLine: macdFull, signalLine, histogram };
}
