import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
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

  const switchMode = (m) => { setMode(m); setError(''); setPassword(''); setConfirm(''); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020810]">
      <div className="fixed inset-0 bg-grid-hud bg-grid-hud opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Arc reactor */}
        <div className="flex justify-center mb-8">
          <div className="arc-reactor w-20 h-20">
            <div className="arc-reactor w-10 h-10">
              <div className="w-4 h-4 rounded-full bg-[rgba(0,212,255,0.4)] border-2 border-[#00d4ff]" />
            </div>
          </div>
        </div>

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="hud-title text-2xl mb-1">S.M.I.</h1>
          <p className="text-muted text-[10px] tracking-[0.25em] uppercase">Stark Market Intelligence</p>
        </div>

        {/* Tab switcher */}
        <div className="flex mb-6 border border-[rgba(0,212,255,0.2)] rounded-sm overflow-hidden">
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase transition-all ${
                mode === m
                  ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff]'
                  : 'text-muted hover:text-[#a8d8ea]'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="hud-label block mb-1.5">Username</label>
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
            <label className="hud-label block mb-1.5">Password</label>
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
              <label className="hud-label block mb-1.5">Confirm Password</label>
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

          {error && <p className="text-bear text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-[rgba(0,212,255,0.3)] border-t-[#00d4ff] rounded-full animate-spin" />
                {mode === 'signup' ? 'Creating Account…' : 'Signing In…'}
              </span>
            ) : mode === 'signup' ? 'Create Account →' : 'Sign In →'}
          </button>
        </form>

        <p className="text-muted text-[10px] text-center mt-6 tracking-wide">
          {mode === 'login'
            ? 'No account yet? '
            : 'Already have an account? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[rgba(0,212,255,0.6)] hover:text-[#00d4ff] underline transition-colors"
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
