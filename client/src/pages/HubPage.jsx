import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { usePrices } from '../hooks/usePrices.js';
import { useFundamentals } from '../hooks/useFundamentals.js';
import {
  PortfolioIcon, NewsIcon, AdvisorIcon, AlertsIcon, DiscoverIcon,
  SettingsIcon, WatchlistIcon, CoachIcon, TradesIcon,
  InsidersIcon, InstitutionalIcon, CalendarIcon,
} from '../components/icons/NavIcons';

function totalValue(holdings, prices) {
  return holdings.reduce((s, h) => s + (prices[h.ticker]?.price ?? 0) * h.shares, 0);
}
function totalCost(holdings) {
  return holdings.reduce((s, h) => s + h.cost_basis * h.shares, 0);
}
function dailyPnL(holdings, prices) {
  return holdings.reduce((s, h) => {
    const p = prices[h.ticker];
    if (!p?.price || p.change_pct == null) return s;
    return s + p.price * h.shares * (p.change_pct / 100);
  }, 0);
}
function portfolioBeta(holdings, prices, fundamentals) {
  let w = 0, t = 0;
  for (const h of holdings) {
    const p = prices[h.ticker]?.price;
    const b = fundamentals[h.ticker]?.beta;
    if (!p || !b) continue;
    const v = p * h.shares;
    w += b * v; t += v;
  }
  return t > 0 ? w / t : null;
}

const ORB_SIZE    = 280;
const PLANET_SIZE = 44;
const STATS_H     = 68;
const LS_KEY      = 'sentinel-hub-v2';
const RINGS     = [220, 295];
const COMET_SPD = 48;

// Inner ring noticeably faster, outer ring slow and weighty
const PLANET_SPEEDS = {
  portfolio:     3.2,
  coach:         2.6,
  discover:      3.8,
  settings:      2.9,
  institutional: 3.4,
  trades:        2.3,
  alerts:        0.55,
  insiders:      0.75,
  watchlist:     0.45,
  news:          0.65,
  advisor:       0.85,
  calendar:      0.40,
};

// 6 planets per ring, evenly spaced 60° apart, inner/outer offset by 30°
const PLANET_DEFAULTS = {
  portfolio:     { angle: 30,  ringIdx: 0 },
  coach:         { angle: 90,  ringIdx: 0 },
  discover:      { angle: 150, ringIdx: 0 },
  settings:      { angle: 210, ringIdx: 0 },
  institutional: { angle: 270, ringIdx: 0 },
  trades:        { angle: 330, ringIdx: 0 },
  alerts:        { angle: 0,   ringIdx: 1 },
  insiders:      { angle: 60,  ringIdx: 1 },
  watchlist:     { angle: 120, ringIdx: 1 },
  news:          { angle: 180, ringIdx: 1 },
  advisor:       { angle: 240, ringIdx: 1 },
  calendar:      { angle: 300, ringIdx: 1 },
};

const PLANETS = [
  { id: 'portfolio',     label: 'Portfolio',     Icon: PortfolioIcon },
  { id: 'watchlist',     label: 'Watchlist',     Icon: WatchlistIcon },
  { id: 'news',          label: 'Intel Feed',    Icon: NewsIcon },
  { id: 'advisor',       label: 'AI Advisor',    Icon: AdvisorIcon },
  { id: 'coach',         label: 'AI Coach',      Icon: CoachIcon },
  { id: 'alerts',        label: 'Alerts',        Icon: AlertsIcon },
  { id: 'discover',      label: 'Discover',      Icon: DiscoverIcon },
  { id: 'insiders',      label: 'Insiders',      Icon: InsidersIcon },
  { id: 'institutional', label: 'Institutional', Icon: InstitutionalIcon },
  { id: 'calendar',      label: 'Calendar',      Icon: CalendarIcon },
  { id: 'trades',        label: 'Trade Log',     Icon: TradesIcon },
  { id: 'settings',      label: 'Settings',      Icon: SettingsIcon },
];

function loadSaved() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null');
    if (!data) return null;
    // Clamp stale ringIdx values (e.g. from old 3-ring layouts)
    for (const key of Object.keys(data)) {
      if (data[key]?.ringIdx >= RINGS.length) data[key].ringIdx = RINGS.length - 1;
    }
    return data;
  } catch { return null; }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function toXY(angle, ringIdx, cx, cy) {
  const ri = Math.min(ringIdx ?? 0, RINGS.length - 1);
  const r  = RINGS[ri];
  const a  = angle * Math.PI / 180;
  return {
    left: cx + Math.sin(a) * r - PLANET_SIZE / 2,
    top:  cy - Math.cos(a) * r - PLANET_SIZE / 2,
  };
}

export default function HubPage({ setPage, user, onLogout }) {
  const { holdings }     = usePortfolio();
  const tickers          = useMemo(() => holdings.map(h => h.ticker), [holdings]);
  const { prices }       = usePrices(tickers);
  const { fundamentals } = useFundamentals(tickers);

  const containerRef  = useRef(null);
  const [cSize, setCSize] = useState({ w: window.innerWidth, h: window.innerHeight - 40 });
  const [warpingId, setWarpingId] = useState(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [entered, setEntered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Mount reveal: fade in container, then planets stagger in
  useEffect(() => {
    if (prefersReducedMotion) { setEntered(true); return; }
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // All RAF state in refs — no React re-renders per frame
  const anglesRef    = useRef({});
  const ringIdxRef   = useRef({});
  const planetRefs   = useRef({});
  const labelRefs    = useRef({});
  const cometRefs    = useRef([null, null]);
  const cometAngles  = useRef([0, 180]);
  const cxRef        = useRef(0);
  const cyRef        = useRef(0);
  const dragRef      = useRef(null);
  const movedRef     = useRef(false);
  const [draggingId, setDraggingId] = useState(null);

  const [initOrbits] = useState(() => {
    const saved = loadSaved();
    return Object.fromEntries(PLANETS.map(({ id }) => {
      const def = PLANET_DEFAULTS[id];
      return [id, { angle: saved?.[id]?.angle ?? def.angle, ringIdx: saved?.[id]?.ringIdx ?? def.ringIdx }];
    }));
  });

  // Seed angle/ring refs from initial orbits
  useEffect(() => {
    for (const { id } of PLANETS) {
      anglesRef.current[id]  = initOrbits[id].angle;
      ringIdxRef.current[id] = initOrbits[id].ringIdx;
    }
  }, []); // eslint-disable-line

  // Track container size
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      cxRef.current = w / 2;
      cyRef.current = (h - STATS_H) / 2;
      setCSize({ w, h });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // RAF animation loop — direct DOM mutations, zero React overhead
  useEffect(() => {
    let rafId;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const cx = cxRef.current;
      const cy = cyRef.current;

      // Planet orbits
      for (const { id } of PLANETS) {
        if (dragRef.current?.id === id) continue;
        const next = ((anglesRef.current[id] ?? 0) + (PLANET_SPEEDS[id] ?? 1) * dt) % 360;
        anglesRef.current[id] = next;
        const ri = Math.min(ringIdxRef.current[id] ?? 0, RINGS.length - 1);
        const el = planetRefs.current[id];
        if (el) {
          const a = next * Math.PI / 180;
          el.style.left = `${cx + Math.sin(a) * RINGS[ri] - PLANET_SIZE / 2}px`;
          el.style.top  = `${cy - Math.cos(a) * RINGS[ri] - PLANET_SIZE / 2}px`;
        }
      }

      // Comet dots
      for (let i = 0; i < 2; i++) {
        cometAngles.current[i] = (cometAngles.current[i] + COMET_SPD * dt) % 360;
        const cel = cometRefs.current[i];
        if (cel) {
          const a  = cometAngles.current[i] * Math.PI / 180;
          const r  = RINGS[i];
          const sz = i === 0 ? 5 : i === 1 ? 4 : 3;
          cel.style.left = `${cx + Math.sin(a) * r - sz / 2}px`;
          cel.style.top  = `${cy - Math.cos(a) * r - sz / 2}px`;
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Parallax on mouse move ─────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion) return;
    const onMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setParallax({
        x: ((e.clientX - cx) / cx) * 4,
        y: ((e.clientY - cy) / cy) * 4,
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [prefersReducedMotion]);

  // ── Warp navigation ───────────────────────────────────────
  const handleWarp = useCallback((id) => {
    if (prefersReducedMotion) {
      setPage(id);
      return;
    }
    // Fade other planets, pulse clicked planet
    for (const { id: pid } of PLANETS) {
      const el = planetRefs.current[pid];
      if (!el) continue;
      if (pid === id) {
        el.style.transform = 'scale(1.3)';
        el.style.transition = 'transform 0.15s ease-out, opacity 0.2s';
      } else {
        el.style.opacity = '0.2';
        el.style.transition = 'opacity 0.2s';
      }
    }
    setWarpingId(id);
    setTimeout(() => setPage(id), 480);
  }, [setPage, prefersReducedMotion]);

  const handleWarpRef = useRef(handleWarp);
  handleWarpRef.current = handleWarp;

  // ── Drag ──────────────────────────────────────────────────
  const onMouseDown = useCallback((e, id) => {
    e.preventDefault();
    e.stopPropagation();
    movedRef.current = false;
    dragRef.current = {
      id,
      rect: containerRef.current.getBoundingClientRect(),
      startX: e.clientX,
      startY: e.clientY,
    };
    setDraggingId(id);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 5) movedRef.current = true;

      // Free-float: follow mouse exactly, no ring snap during drag
      const mx = e.clientX - d.rect.left - cxRef.current;
      const my = e.clientY - d.rect.top  - cyRef.current;

      // Store for snap-on-release
      dragRef.current.lastMx = mx;
      dragRef.current.lastMy = my;

      const el = planetRefs.current[d.id];
      if (el) {
        el.style.left = `${cxRef.current + mx - PLANET_SIZE / 2}px`;
        el.style.top  = `${cyRef.current + my - PLANET_SIZE / 2}px`;
      }
    };

    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      if (!movedRef.current) {
        handleWarpRef.current(d.id);
      } else {
        // Snap to nearest ring at release
        const mx   = d.lastMx ?? 0;
        const my   = d.lastMy ?? 0;
        const dist = Math.hypot(mx, my);
        const angle = ((Math.atan2(mx, -my) * 180 / Math.PI) + 360) % 360;
        const ri    = RINGS.reduce((best, r, i) =>
          Math.abs(dist - r) < Math.abs(dist - RINGS[best]) ? i : best, 0);

        anglesRef.current[d.id]  = angle;
        ringIdxRef.current[d.id] = ri;

        // Snap the DOM element onto the ring
        const el = planetRefs.current[d.id];
        if (el) {
          const a = angle * Math.PI / 180;
          el.style.left = `${cxRef.current + Math.sin(a) * RINGS[ri] - PLANET_SIZE / 2}px`;
          el.style.top  = `${cyRef.current - Math.cos(a) * RINGS[ri] - PLANET_SIZE / 2}px`;
        }

        const save = {};
        for (const { id } of PLANETS) {
          save[id] = { angle: anglesRef.current[id], ringIdx: ringIdxRef.current[id] };
        }
        localStorage.setItem(LS_KEY, JSON.stringify(save));
      }
      dragRef.current = null;
      setDraggingId(null);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [setPage]);

  const handleReset = () => {
    localStorage.removeItem(LS_KEY);
    for (const { id } of PLANETS) {
      const def = PLANET_DEFAULTS[id];
      anglesRef.current[id]  = def.angle;
      ringIdxRef.current[id] = def.ringIdx;
    }
  };

  // ── Stats ──────────────────────────────────────────────────
  const value   = totalValue(holdings, prices);
  const cost    = totalCost(holdings);
  const gain    = value - cost;
  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
  const today   = dailyPnL(holdings, prices);
  const beta    = portfolioBeta(holdings, prices, fundamentals);
  const upCount = holdings.filter(h => (prices[h.ticker]?.change_pct ?? 0) >= 0).length;
  const dnCount = holdings.length - upCount;
  const todayPos = today >= 0;

  const insight = useMemo(() => {
    if (!holdings.length) return 'Add holdings to begin tracking.';
    const top = [...holdings].sort((a, b) =>
      (prices[b.ticker]?.change_pct ?? 0) - (prices[a.ticker]?.change_pct ?? 0)
    )[0];
    const pct = cost > 0 ? (today / cost) * 100 : 0;
    if (pct > 0.01)  return `Portfolio +${pct.toFixed(2)}% today. ${top?.ticker} leading.`;
    if (pct < -0.01) return `Portfolio ${pct.toFixed(2)}% today. Monitor positions.`;
    return 'Analyzing market conditions…';
  }, [holdings, prices, today, cost]);

  const cx = cSize.w / 2;
  const cy = (cSize.h - STATS_H) / 2;

  const STATS = [
    { label: 'VALUE',  value: cost > 0 ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—', color: undefined },
    { label: 'TOTAL',  value: cost > 0 ? `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(2)}%` : '—', color: gainPct >= 0 ? 'var(--bull)' : 'var(--bear)' },
    { label: 'UP / DN',value: holdings.length ? `${upCount} / ${dnCount}` : '—', color: undefined },
    { label: 'BETA',   value: beta != null ? beta.toFixed(2) : '—', color: beta == null ? undefined : beta < 1 ? 'var(--bull)' : beta < 1.5 ? 'var(--amber)' : 'var(--bear)' },
  ];

  return (
    <div
      ref={containerRef}
      className="hub-scope"
      style={{
        position: 'relative', flex: 1,
        width: '100%', height: 'calc(100vh - 40px)',
        overflow: 'hidden',
        background: '#06081a',
        color: '#eaecff',
        cursor: draggingId ? 'grabbing' : 'default',
        userSelect: 'none',
        transform: warpingId ? 'scale(0.95)' : 'scale(1)',
        opacity: entered ? 1 : 0,
        transition: 'transform 0.28s ease-out, opacity 0.55s ease',
      }}
    >
      {/* Controls */}
      <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
        <span style={{ fontFamily: 'var(--font-brand)', fontSize: 8, letterSpacing: '0.2em', color: 'var(--text-2)' }}>
          DRAG TO REARRANGE
        </span>
        <button
          className="aura-action"
          onClick={handleReset}
          style={{ fontSize: 8.5, padding: '4px 12px', letterSpacing: '0.18em', opacity: 1 }}
        >
          RESET
        </button>
        {onLogout && (
          <button
            className="aura-action"
            onClick={onLogout}
            style={{ fontSize: 8.5, padding: '4px 12px', letterSpacing: '0.18em', opacity: 0.7 }}
          >
            SIGN OUT
          </button>
        )}
      </div>

      {/* Ambient nebula glow — moves with parallax */}
      <div style={{
        position: 'absolute',
        left: cx - 430, top: cy - 430,
        width: 860, height: 860,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.055) 0%, rgba(0,212,255,0.02) 40%, transparent 72%)',
        pointerEvents: 'none', zIndex: 1,
        transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
        transition: 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)',
      }} />

      {/* SVG ring layer */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
        <defs>
          <filter id="ring-soft">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="rg0" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,212,255,0)" />
            <stop offset="92%" stopColor="rgba(0,212,255,0.22)" />
            <stop offset="100%" stopColor="rgba(0,212,255,0)" />
          </radialGradient>
          <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,212,255,0)" />
            <stop offset="92%" stopColor="rgba(0,212,255,0.14)" />
            <stop offset="100%" stopColor="rgba(0,212,255,0)" />
          </radialGradient>
        </defs>
        {/* Soft wide glow aura per ring */}
        {RINGS.map((r, i) => (
          <circle key={`a-${r}`} cx={cx} cy={cy} r={r}
            fill="none" stroke="rgba(0,212,255,1)" strokeWidth="18"
            opacity={i === 0 ? 0.025 : 0.016} filter="url(#ring-soft)" />
        ))}
        {/* Crisp thin rings */}
        {RINGS.map((r, i) => (
          <circle key={r} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={i === 0 ? 'rgba(0,212,255,0.38)' : 'rgba(0,212,255,0.24)'}
            strokeWidth={i === 0 ? 0.7 : 0.55}
          />
        ))}
      </svg>

      {/* Comet dots — one per ring, RAF-animated */}
      {[0, 1].map(i => {
        const sz = i === 0 ? 5 : 4;
        const initA = cometAngles.current[i] * Math.PI / 180;
        return (
          <div
            key={`comet-${i}`}
            ref={el => { cometRefs.current[i] = el; }}
            style={{
              position: 'absolute',
              width: sz, height: sz,
              borderRadius: '50%',
              background: '#00d4ff',
              boxShadow: `0 0 ${sz + 4}px rgba(0,212,255,${i === 0 ? 0.95 : 0.75}), 0 0 ${sz * 3}px rgba(0,212,255,0.3)`,
              left: cx + Math.sin(initA) * RINGS[i] - sz / 2,
              top:  cy - Math.cos(initA) * RINGS[i] - sz / 2,
              pointerEvents: 'none', zIndex: 3,
            }}
          />
        );
      })}

      {/* Center orb */}
      <div style={{
        position: 'absolute',
        left: cx - ORB_SIZE / 2, top: cy - ORB_SIZE / 2,
        width: ORB_SIZE, height: ORB_SIZE,
        borderRadius: '50%',
        background: [
          'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.09) 0%, transparent 22%)',
          'radial-gradient(circle at 28% 26%, rgba(124,92,255,0.46) 0%, rgba(56,178,255,0.14) 38%, transparent 62%)',
          'radial-gradient(circle at 72% 76%, rgba(0,2,14,0.92) 0%, transparent 50%)',
          'radial-gradient(circle at 50% 50%, #0a0620 0%, #04020e 100%)',
        ].join(', '),
        border: '1px solid rgba(124,92,255,0.28)',
        boxShadow: [
          '0 0 0 2px rgba(124,92,255,0.06)',
          '0 0 50px rgba(124,92,255,0.32)',
          '0 0 120px rgba(56,178,255,0.12)',
          '0 0 240px rgba(124,92,255,0.06)',
          'inset -28px -28px 70px rgba(0,0,0,0.78)',
          'inset 16px 16px 45px rgba(124,92,255,0.08)',
        ].join(', '),
        animation: 'orbPulse 2.8s ease-in-out infinite',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 0, padding: 30,
        zIndex: 5, textAlign: 'center', overflow: 'hidden',
      }}>
        {/* Specular highlight — soft bright ellipse top-left */}
        <div style={{
          position: 'absolute', top: '8%', left: '12%',
          width: '48%', height: '36%', borderRadius: '50%',
          background: 'radial-gradient(ellipse at 40% 38%, rgba(255,255,255,0.16) 0%, rgba(124,92,255,0.08) 55%, transparent 100%)',
          filter: 'blur(10px)', pointerEvents: 'none',
        }} />

        {/* Latitude lines — scaleY flattened circles to mimic globe perspective */}
        <div style={{
          position: 'absolute', inset: '30%', borderRadius: '50%',
          border: '1px solid rgba(124,92,255,0.16)',
          transform: 'scaleY(0.25)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: '18%', borderRadius: '50%',
          border: '1px solid rgba(56,178,255,0.10)',
          transform: 'scaleY(0.18)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: '8%', borderRadius: '50%',
          border: '1px solid rgba(124,92,255,0.12)',
          transform: 'scaleY(0.08)', pointerEvents: 'none',
        }} />

        {/* Rotating accent arcs */}
        <div style={{
          position: 'absolute', inset: -5, borderRadius: '50%',
          border: '1px solid transparent',
          borderTopColor: 'rgba(124,92,255,0.55)',
          borderRightColor: 'rgba(56,178,255,0.20)',
          animation: 'spin 9s linear infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          border: '1px solid transparent',
          borderBottomColor: 'rgba(56,178,255,0.28)',
          borderLeftColor: 'rgba(124,92,255,0.12)',
          animation: 'spin 15s linear infinite reverse',
          pointerEvents: 'none',
        }} />

        {/* Content — fades in 400ms after mount */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
          initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? {} : { delay: 0.4, duration: 0.4, ease: 'easeOut' }}
        >
          <span style={{ fontFamily: 'var(--font-brand)', fontSize: 7, letterSpacing: '0.26em', color: 'var(--muted)', marginBottom: 2 }}>
            {getGreeting()}
          </span>
          {user?.id && (
            <span style={{ fontFamily: 'var(--font-brand)', fontSize: 9, letterSpacing: '0.16em', color: 'var(--text)', textTransform: 'uppercase', marginBottom: 4 }}>
              {user.id}
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-brand)', fontSize: 6.5, letterSpacing: '0.24em', color: 'rgba(124,92,255,0.8)', marginBottom: 10 }}>
            AURA IS ANALYZING
          </span>
          {cost > 0 ? (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, lineHeight: 1,
              color: todayPos ? 'var(--bull)' : 'var(--bear)',
              textShadow: todayPos ? '0 0 24px rgba(0,230,118,0.5)' : '0 0 24px rgba(255,51,85,0.5)',
            }}>
              {todayPos ? '+' : '−'}${Math.abs(today).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--dim)' }}>—</span>
          )}
          <p style={{ fontSize: 8, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 160, marginTop: 8, opacity: 0.8 }}>
            {insight}
          </p>
        </motion.div>
      </div>

      {/* Planet nodes */}
      {PLANETS.map(({ id, label, Icon }, pIdx) => {
        const { angle, ringIdx } = initOrbits[id];
        const { left, top } = toXY(angle, ringIdx, cx, cy);
        const isDragging = draggingId === id;

        return (
          <div
            key={id}
            ref={el => { planetRefs.current[id] = el; }}
            onMouseDown={e => onMouseDown(e, id)}
            onMouseEnter={e => {
              if (!dragRef.current) e.currentTarget.style.transform = 'scale(1.45)';
              if (labelRefs.current[id]) labelRefs.current[id].style.opacity = '1';
            }}
            onMouseLeave={e => {
              if (!dragRef.current) e.currentTarget.style.transform = 'scale(1)';
              if (labelRefs.current[id]) labelRefs.current[id].style.opacity = '0';
            }}
            style={{
              position: 'absolute',
              left, top,
              zIndex: isDragging ? 20 : 6,
              cursor: isDragging ? 'grabbing' : 'grab',
              transform: isDragging ? 'scale(1.2)' : 'scale(1)',
              opacity: entered ? 1 : 0,
              transition: isDragging
                ? 'none'
                : `transform 0.18s ease, opacity 0.32s ease ${0.28 + pIdx * 0.055}s`,
            }}
          >
            {/* Planet circle */}
            <div
              style={{
                width: PLANET_SIZE, height: PLANET_SIZE,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 32%, rgba(0,212,255,0.14) 0%, rgba(0,212,255,0.05) 60%, transparent 100%)',
                border: '1px solid rgba(0,212,255,0.25)',
                boxShadow: '0 0 10px rgba(0,212,255,0.08), inset 0 0 10px rgba(0,212,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(0,212,255,0.55)',
                transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s, color 0.18s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background   = 'radial-gradient(circle at 38% 32%, rgba(0,212,255,0.28) 0%, rgba(0,212,255,0.1) 60%, transparent 100%)';
                e.currentTarget.style.borderColor  = 'rgba(0,212,255,0.7)';
                e.currentTarget.style.boxShadow    = '0 0 18px rgba(0,212,255,0.45), 0 0 40px rgba(0,212,255,0.15), inset 0 0 14px rgba(0,212,255,0.1)';
                e.currentTarget.style.color        = '#00d4ff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background   = 'radial-gradient(circle at 38% 32%, rgba(0,212,255,0.14) 0%, rgba(0,212,255,0.05) 60%, transparent 100%)';
                e.currentTarget.style.borderColor  = 'rgba(0,212,255,0.25)';
                e.currentTarget.style.boxShadow    = '0 0 10px rgba(0,212,255,0.08), inset 0 0 10px rgba(0,212,255,0.04)';
                e.currentTarget.style.color        = 'rgba(0,212,255,0.55)';
              }}
            >
              <Icon className="w-5 h-5" />
            </div>

            {/* Label — hidden by default, shown on parent hover */}
            <div
              ref={el => { labelRefs.current[id] = el; }}
              style={{
                position: 'absolute',
                top: PLANET_SIZE + 7,
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-brand)',
                fontSize: 7,
                letterSpacing: '0.18em',
                color: 'var(--cyan)',
                textTransform: 'uppercase',
                pointerEvents: 'none',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                textShadow: '0 0 8px rgba(0,212,255,0.5)',
              }}
            >
              {label}
            </div>
          </div>
        );
      })}

      {/* Warp-to-black overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: '#010409',
          opacity: warpingId ? 1 : 0,
          transition: 'opacity 0.28s ease-in',
          pointerEvents: warpingId ? 'all' : 'none',
        }}
      />

      {/* Bottom stats bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0, height: STATS_H,
        background: 'linear-gradient(0deg, rgba(1,4,9,0.98) 0%, rgba(1,4,9,0.82) 65%, transparent 100%)',
        borderTop: '1px solid rgba(0,212,255,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 56, zIndex: 8, pointerEvents: 'none',
      }}>
        {STATS.map(({ label, value: v, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-brand)', fontSize: 8, letterSpacing: '0.24em', color: 'var(--text-2)', marginBottom: 5 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: color ?? 'var(--text)', letterSpacing: '0.02em' }}>
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
