import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { usePrices } from '../hooks/usePrices.js';
import { useFundamentals } from '../hooks/useFundamentals.js';
import CosmicOrb from '../components/CosmicOrb.jsx';
import { Particles } from '../components/ui/particles.jsx';
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

const ORB_SIZE    = 320;
const PLANET_SIZE = 44;
const LS_KEY      = 'sentinel-hub-v2';
const RINGS       = [220, 295];
const COMET_SPD   = 48;

const PLANET_SPEEDS = {
  portfolio:     3.2, coach:         2.6, discover:      3.8,
  settings:      2.9, institutional: 3.4, trades:        2.3,
  alerts:        0.55, insiders:     0.75, watchlist:     0.45,
  news:          0.65, advisor:      0.85, calendar:      0.40,
};

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
    for (const key of Object.keys(data)) {
      if (data[key]?.ringIdx >= RINGS.length) data[key].ringIdx = RINGS.length - 1;
    }
    return data;
  } catch { return null; }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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

export default function HubPage({ setPage, user }) {
  const { holdings }     = usePortfolio();
  const tickers          = useMemo(() => holdings.map(h => h.ticker), [holdings]);
  const { prices }       = usePrices(tickers);
  const { fundamentals } = useFundamentals(tickers);

  const containerRef  = useRef(null);
  const [cSize, setCSize] = useState({ w: window.innerWidth, h: window.innerHeight - 52 });
  const [warpingId, setWarpingId] = useState(null);
  const [entered, setEntered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) { setEntered(true); return; }
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

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

  useEffect(() => {
    for (const { id } of PLANETS) {
      anglesRef.current[id]  = initOrbits[id].angle;
      ringIdxRef.current[id] = initOrbits[id].ringIdx;
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      cxRef.current = w / 2;
      cyRef.current = h / 2;
      setCSize({ w, h });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    let rafId;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const cx = cxRef.current;
      const cy = cyRef.current;

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

      for (let i = 0; i < 2; i++) {
        cometAngles.current[i] = (cometAngles.current[i] + COMET_SPD * dt) % 360;
        const cel = cometRefs.current[i];
        if (cel) {
          const a  = cometAngles.current[i] * Math.PI / 180;
          const r  = RINGS[i];
          const sz = i === 0 ? 5 : 4;
          cel.style.left = `${cx + Math.sin(a) * r - sz / 2}px`;
          cel.style.top  = `${cy - Math.cos(a) * r - sz / 2}px`;
        }
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleWarp = useCallback((id) => {
    if (prefersReducedMotion) { setPage(id); return; }
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

  const onMouseDown = useCallback((e, id) => {
    e.preventDefault(); e.stopPropagation();
    movedRef.current = false;
    dragRef.current = {
      id,
      rect: containerRef.current.getBoundingClientRect(),
      startX: e.clientX, startY: e.clientY,
    };
    setDraggingId(id);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 5) movedRef.current = true;
      const mx = e.clientX - d.rect.left - cxRef.current;
      const my = e.clientY - d.rect.top  - cyRef.current;
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
        const mx   = d.lastMx ?? 0;
        const my   = d.lastMy ?? 0;
        const dist = Math.hypot(mx, my);
        const angle = ((Math.atan2(mx, -my) * 180 / Math.PI) + 360) % 360;
        const ri    = RINGS.reduce((best, r, i) =>
          Math.abs(dist - r) < Math.abs(dist - RINGS[best]) ? i : best, 0);
        anglesRef.current[d.id]  = angle;
        ringIdxRef.current[d.id] = ri;
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

  // Stats
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
  const cy = cSize.h / 2;

  return (
    <div
      ref={containerRef}
      className="hub-scope"
      style={{
        position: 'relative',
        width: '100%', height: 'calc(100vh - 52px)',
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
      {/* Particles background layer */}
      <Particles
        className="absolute inset-0"
        quantity={60}
        staticity={40}
        ease={60}
        size={0.5}
        color="#b4baff"
        style={{ zIndex: 0 }}
      />

      {/* Ambient nebula glow */}
      <div style={{
        position: 'absolute',
        left: cx - 400, top: cy - 400,
        width: 800, height: 800,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,255,0.08) 0%, rgba(56,178,255,0.04) 40%, transparent 70%)',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* SVG ring layer */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
        <defs>
          <filter id="ring-soft">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {RINGS.map((r, i) => (
          <circle key={`a-${r}`} cx={cx} cy={cy} r={r}
            fill="none" stroke="rgba(124,92,255,1)" strokeWidth="18"
            opacity={i === 0 ? 0.025 : 0.016} filter="url(#ring-soft)" />
        ))}
        {RINGS.map((r, i) => (
          <circle key={r} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={i === 0 ? 'rgba(124,92,255,0.38)' : 'rgba(56,178,255,0.24)'}
            strokeWidth={i === 0 ? 0.7 : 0.55}
          />
        ))}
      </svg>

      {/* Comet dots */}
      {[0, 1].map(i => {
        const sz = i === 0 ? 5 : 4;
        const initA = cometAngles.current[i] * Math.PI / 180;
        return (
          <div
            key={`comet-${i}`}
            ref={el => { cometRefs.current[i] = el; }}
            style={{
              position: 'absolute', width: sz, height: sz, borderRadius: '50%',
              background: i === 0 ? '#7c5cff' : '#38b2ff',
              boxShadow: `0 0 ${sz + 4}px ${i === 0 ? 'rgba(124,92,255,0.95)' : 'rgba(56,178,255,0.75)'}, 0 0 ${sz * 3}px ${i === 0 ? 'rgba(124,92,255,0.3)' : 'rgba(56,178,255,0.3)'}`,
              left: cx + Math.sin(initA) * RINGS[i] - sz / 2,
              top:  cy - Math.cos(initA) * RINGS[i] - sz / 2,
              pointerEvents: 'none', zIndex: 3,
            }}
          />
        );
      })}

      {/* CosmicOrb — R3F plasma energy sphere */}
      <div style={{
        position: 'absolute',
        left: cx - ORB_SIZE / 2,
        top:  cy - ORB_SIZE / 2,
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <CosmicOrb size={ORB_SIZE} />
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
              position: 'absolute', left, top,
              zIndex: isDragging ? 20 : 6,
              cursor: isDragging ? 'grabbing' : 'grab',
              transform: isDragging ? 'scale(1.2)' : 'scale(1)',
              opacity: entered ? 1 : 0,
              transition: isDragging
                ? 'none'
                : `transform 0.18s ease, opacity 0.32s ease ${0.28 + pIdx * 0.055}s`,
            }}
          >
            <div
              style={{
                width: PLANET_SIZE, height: PLANET_SIZE, borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 32%, rgba(124,92,255,0.22) 0%, rgba(56,178,255,0.08) 60%, transparent 100%)',
                border: '1px solid rgba(124,92,255,0.32)',
                boxShadow: '0 0 10px rgba(124,92,255,0.12), inset 0 0 10px rgba(124,92,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(124,92,255,0.7)',
                transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s, color 0.18s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background   = 'radial-gradient(circle at 38% 32%, rgba(124,92,255,0.45) 0%, rgba(56,178,255,0.18) 60%, transparent 100%)';
                e.currentTarget.style.borderColor  = 'rgba(124,92,255,0.75)';
                e.currentTarget.style.boxShadow    = '0 0 18px rgba(124,92,255,0.55), 0 0 40px rgba(124,92,255,0.2), inset 0 0 14px rgba(124,92,255,0.12)';
                e.currentTarget.style.color        = '#7c5cff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background   = 'radial-gradient(circle at 38% 32%, rgba(124,92,255,0.22) 0%, rgba(56,178,255,0.08) 60%, transparent 100%)';
                e.currentTarget.style.borderColor  = 'rgba(124,92,255,0.32)';
                e.currentTarget.style.boxShadow    = '0 0 10px rgba(124,92,255,0.12), inset 0 0 10px rgba(124,92,255,0.06)';
                e.currentTarget.style.color        = 'rgba(124,92,255,0.7)';
              }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div
              ref={el => { labelRefs.current[id] = el; }}
              style={{
                position: 'absolute', top: PLANET_SIZE + 7, left: '50%',
                transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.06em',
                color: 'var(--text-2)', textTransform: 'none',
                pointerEvents: 'none', opacity: 0, transition: 'opacity 0.2s ease',
              }}
            >
              {label}
            </div>
          </div>
        );
      })}

      {/* Greeting card — top-left */}
      <motion.div
        className="card"
        style={{
          position: 'absolute', top: 20, left: 20, zIndex: 10,
          padding: '14px 18px', minWidth: 180,
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -8 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
          {getGreeting()}
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {user?.id ? user.id.charAt(0).toUpperCase() + user.id.slice(1) : 'Investor'}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          {insight}
        </p>
      </motion.div>

      {/* P&L card — top-right */}
      <motion.div
        className="card"
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 10,
          padding: '14px 18px', minWidth: 160,
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : -8 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        {cost > 0 ? (
          <>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Today's P&L</p>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, lineHeight: 1,
              color: todayPos ? 'var(--gain)' : 'var(--loss)',
            }}>
              {todayPos ? '+' : '−'}${Math.abs(today).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div>
                <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>TOTAL</p>
                <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: gainPct >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                  {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(2)}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>UP / DN</p>
                <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-2)' }}>
                  {upCount} / {dnCount}
                </p>
              </div>
              {beta != null && (
                <div>
                  <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>BETA</p>
                  <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: beta < 1 ? 'var(--gain)' : beta < 1.5 ? 'var(--warn)' : 'var(--loss)' }}>
                    {beta.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Portfolio</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No holdings yet</p>
          </>
        )}
      </motion.div>

      {/* Warp overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: '#010409',
          opacity: warpingId ? 1 : 0,
          transition: 'opacity 0.28s ease-in',
          pointerEvents: warpingId ? 'all' : 'none',
        }}
      />
    </div>
  );
}
