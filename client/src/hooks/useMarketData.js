import { useState, useEffect } from 'react';

const BASE = '/api/market-data';

async function fetchOne(path) {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export function useMarketData(tickers = []) {
  const [data, setData] = useState({
    shortInterest: {},
    insiders: {},
    institutional: {},
    dividends: {},
    upgrades: {},
    loading: true,
  });

  useEffect(() => {
    if (tickers.length === 0) {
      setData({ shortInterest: {}, insiders: {}, institutional: {}, dividends: {}, upgrades: {}, loading: false });
      return;
    }

    let cancelled = false;

    async function load() {
      const results = await Promise.all(
        tickers.flatMap(t => [
          fetchOne(`${BASE}/short-interest/${t}`).then(v => ['si', t, v]),
          fetchOne(`${BASE}/insiders/${t}`).then(v => ['ins', t, v]),
          fetchOne(`${BASE}/institutional/${t}`).then(v => ['inst', t, v]),
          fetchOne(`${BASE}/dividends/${t}`).then(v => ['div', t, v]),
          fetchOne(`${BASE}/upgrades/${t}`).then(v => ['upg', t, v]),
        ])
      );

      if (cancelled) return;

      const shortInterest = {}, insiders = {}, institutional = {}, dividends = {}, upgrades = {};
      for (const [type, ticker, val] of results) {
        if (type === 'si')   shortInterest[ticker]  = val;
        if (type === 'ins')  insiders[ticker]        = val;
        if (type === 'inst') institutional[ticker]   = val;
        if (type === 'div')  dividends[ticker]       = val;
        if (type === 'upg')  upgrades[ticker]        = val;
      }

      setData({ shortInterest, insiders, institutional, dividends, upgrades, loading: false });
    }

    load();
    return () => { cancelled = true; };
  }, [tickers.join(',')]);

  return data;
}
