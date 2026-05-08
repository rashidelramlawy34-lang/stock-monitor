import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter a name to continue');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020810]">
      {/* Grid overlay */}
      <div className="fixed inset-0 bg-grid-hud bg-grid-hud opacity-40 pointer-events-none" />

      <div className="relative z-10 text-center space-y-8 w-full max-w-sm px-6">
        {/* Arc reactor */}
        <div className="flex justify-center">
          <div className="arc-reactor w-24 h-24">
            <div className="arc-reactor w-12 h-12">
              <div className="w-5 h-5 rounded-full bg-[rgba(0,212,255,0.4)] border-2 border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.8)]" />
            </div>
          </div>
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <h1 className="hud-title text-3xl">S.M.I.</h1>
          <p className="text-[rgba(0,212,255,0.4)] text-xs tracking-[0.3em] uppercase">
            Stark Market Intelligence
          </p>
          <p className="text-muted text-[10px] tracking-widest uppercase mt-1">
            Advanced Portfolio Analytics System v2.0
          </p>
        </div>

        <hr className="hud-divider" />

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="hud-label block mb-2">Identify Yourself</label>
            <input
              type="text"
              className="input w-full text-center font-mono text-sm"
              placeholder="Enter your name…"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={40}
            />
          </div>

          {error && (
            <p className="text-bear text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="btn-primary w-full justify-center"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-[rgba(0,212,255,0.3)] border-t-[#00d4ff] rounded-full animate-spin" />
                Initializing…
              </span>
            ) : 'Access System →'}
          </button>
        </form>

        <p className="text-muted text-[10px] tracking-wide">
          Your portfolio is saved under your name
        </p>
      </div>
    </div>
  );
}
