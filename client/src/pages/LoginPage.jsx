import { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { gsap } from 'gsap';
import { Globe } from '../components/ui/globe.jsx';
import { Particles } from '../components/ui/particles.jsx';

const LOGIN_GLOBE_CONFIG = {
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.9,
  mapSamples: 20000,
  mapBrightness: 2.5,
  baseColor: [0.38, 0.52, 1.0],
  markerColor: [0.65, 0.48, 1.0],
  glowColor: [0.35, 0.55, 1.0],
  markers: [
    { location: [40.7128, -74.006],   size: 0.05 },
    { location: [51.5074, -0.1278],   size: 0.05 },
    { location: [35.6762, 139.6503],  size: 0.04 },
    { location: [1.3521, 103.8198],   size: 0.03 },
    { location: [48.8566, 2.3522],    size: 0.03 },
    { location: [22.3193, 114.1694],  size: 0.04 },
    { location: [37.7749, -122.4194], size: 0.04 },
    { location: [-33.8688, 151.2093], size: 0.03 },
    { location: [19.076, 72.8777],    size: 0.03 },
    { location: [55.7558, 37.6173],   size: 0.03 },
  ],
  onRender: () => {},
};

const ORB_SIZE = 460;

export default function LoginPage({ onLogin }) {
  const [mode, setMode]         = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const cardRef        = useRef(null);
  const overlayRef     = useRef(null);
  const globeWrapperRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Warp transition — GSAP scale-up Globe + fade to black, then onLogin
  const runTransition = userData => {
    if (prefersReducedMotion) { onLogin(userData); return; }
    const tl = gsap.timeline({ onComplete: () => onLogin(userData) });
    tl.to(cardRef.current, { opacity: 0, y: -16, duration: 0.5, ease: 'power2.in' });
    if (globeWrapperRef.current) {
      tl.to(globeWrapperRef.current, { scale: 4, duration: 1.4, ease: 'expo.inOut' }, '-=0.2');
    }
    tl.to(overlayRef.current, { opacity: 1, duration: 0.35 }, '-=0.35');
  };

  const submit = async (user, pass) => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      runTransition(data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!username.trim()) return setError('Username is required');
    if (!password) return setError('Password is required');
    if (mode === 'signup') {
      if (password.length < 6) return setError('Password must be at least 6 characters');
      if (password !== confirm) return setError('Passwords do not match');
      setLoading(true); setError('');
      try {
        const res = await fetch('/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: username.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        runTransition(data.user);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
      return;
    }
    submit(username.trim(), password);
  };

  const signInAsDemo = () => submit('demo', 'demo');
  const switchMode   = m => { setMode(m); setError(''); setPassword(''); setConfirm(''); };

  return (
    <div className="aura-login">
      {/* Particle background */}
      <Particles
        className="absolute inset-0"
        quantity={50}
        staticity={45}
        ease={60}
        size={0.45}
        color="#b4baff"
        style={{ zIndex: 0 }}
      />

      {/* Warp overlay */}
      <div ref={overlayRef} className="aura-login__overlay" />

      {/* Globe orb — absolutely centered in left half */}
      <div
        ref={globeWrapperRef}
        style={{
          position: 'absolute',
          left: '28%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: ORB_SIZE, height: ORB_SIZE,
          zIndex: 5,
          transformOrigin: 'center center',
        }}
      >
        {/* Outer glow halo */}
        <div style={{
          position: 'absolute',
          inset: -50,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,255,0.38) 0%, rgba(56,178,255,0.22) 35%, rgba(124,92,255,0.08) 65%, transparent 80%)',
          filter: 'blur(24px)',
          pointerEvents: 'none',
          animation: 'orbPulse 3.2s ease-in-out infinite',
        }} />
        {/* Clipped globe canvas */}
        <div style={{
          width: '100%', height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: [
            '0 0 0 1px rgba(124,92,255,0.4)',
            '0 0 50px rgba(124,92,255,0.55)',
            '0 0 100px rgba(56,178,255,0.28)',
            '0 0 200px rgba(124,92,255,0.14)',
          ].join(', '),
        }}>
          <Globe config={LOGIN_GLOBE_CONFIG} className="w-full h-full" />
        </div>
      </div>

      {/* Layout: branding bottom-left, form right */}
      <div className="aura-login__layout">
        {/* Left — branding text over the orb */}
        <div className="aura-login__hero">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.7, ease: 'easeOut' }}
            className="aura-login__hero-text"
          >
            <div className="aura-login__wordmark">Stock Monitor</div>
            <p className="aura-login__tagline">Your portfolio. Live. Intelligent.</p>
          </motion.div>
        </div>

        {/* Right — glass login card */}
        <motion.div
          ref={cardRef}
          className="aura-login__card"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={prefersReducedMotion
            ? { duration: 0.2 }
            : { type: 'spring', stiffness: 100, damping: 18, delay: 0.15 }}
        >
          <div className="aura-login__tabs">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`aura-login__tab${mode === m ? ' aura-login__tab--active' : ''}`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="aura-login__form">
            <div className="aura-login__field">
              <label className="aura-login__label">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                maxLength={40}
                placeholder="your-username"
                className="aura-login__input"
              />
            </div>

            <div className="aura-login__field">
              <label className="aura-login__label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="aura-login__input"
              />
            </div>

            {mode === 'signup' && (
              <div className="aura-login__field">
                <label className="aura-login__label">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="aura-login__input"
                />
              </div>
            )}

            {error && <p className="aura-login__error">{error}</p>}

            <button type="submit" disabled={loading} className="aura-login__btn-primary">
              {loading ? (mode === 'signup' ? 'Creating…' : 'Signing in…') : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <div className="aura-login__divider"><span>or</span></div>

          <button onClick={signInAsDemo} disabled={loading} className="aura-login__btn-demo">
            Sign in as demo
          </button>
          <p className="aura-login__demo-hint">Pre-loaded with 10 holdings · no sign-up required</p>

          <p className="aura-login__footer">
            {mode === 'login' ? 'New here? ' : 'Already have one? '}
            <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="aura-login__link">
              {mode === 'login' ? 'Create account →' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
