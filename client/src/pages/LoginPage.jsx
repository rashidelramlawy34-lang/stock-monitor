import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) return setError('Username is required');
    if (!password) return setError('Password is required');
    if (mode === 'signup') {
      if (password.length < 6) return setError('Password must be at least 6 characters');
      if (password !== confirm) return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      const res = await fetch(`/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const signInAsDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: 'demo', password: 'demo' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(''); setPassword(''); setConfirm(''); };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
        style={{ width: '100%', maxWidth: 380 }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* Hex icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <svg viewBox="0 0 40 40" width="40" height="40">
              {[17, 12, 4].map((r, i) => (
                <polygon key={r} points={(() => {
                  const c = 20, pts = [];
                  for (let j = 0; j < 6; j++) {
                    const a = -Math.PI / 2 + j * Math.PI / 3;
                    pts.push(`${(c + Math.cos(a) * r).toFixed(2)},${(c + Math.sin(a) * r).toFixed(2)}`);
                  }
                  return pts.join(' ');
                })()} fill={i === 2 ? '#2563eb' : 'none'} stroke="#2563eb"
                  strokeWidth={i === 0 ? 1.2 : 0.8} opacity={i === 1 ? 0.5 : 1} />
              ))}
            </svg>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            Stock Monitor
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            Portfolio intelligence, built for serious investors
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: '7px 0', fontSize: 'var(--text-sm)', fontWeight: 500,
                  borderRadius: 'calc(var(--radius-sm) - 1px)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: mode === m ? 'var(--surface-1)' : 'transparent',
                  color: mode === m ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 1px 3px rgba(17,24,39,0.08)' : 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 6 }}>Username</label>
              <input
                type="text"
                className="input w-full font-mono"
                placeholder="your-username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                maxLength={40}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                className="input w-full font-mono"
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 6 }}>Confirm password</label>
                <input
                  type="password"
                  className="input w-full font-mono"
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            )}
            {error && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--loss)', margin: 0 }}>{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent: 'center', padding: '10px 0', fontSize: 'var(--text-sm)' }}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                    {mode === 'signup' ? 'Creating account…' : 'Signing in…'}
                  </span>
                : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Demo divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <button
            onClick={signInAsDemo}
            disabled={loading}
            className="btn-outline"
            style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '9px 0', fontSize: 'var(--text-sm)' }}
          >
            Sign in as demo
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Pre-loaded with 10 holdings · no sign-up required
          </p>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
