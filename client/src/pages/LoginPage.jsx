import { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Wallet } from 'lucide-react';

function AuraMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20.5 5.6 33.8 34h-7.3l-2.7-6.2H13.7L11 34H4.2L17.4 5.6h3.1Zm.8 16.5-2.5-6.2-2.6 6.2h5.1Z"
        fill="#9eefff"
      />
      <path d="M20.5 5.6 33.8 34h-7.3l-2.7-6.2H13.7L11 34H4.2L17.4 5.6h3.1Z" fill="#8b7cff" opacity=".55" />
      <path d="M11.2 27.3c5.2-7.9 11-10.8 18.3-8.7" stroke="#EAFDFF" strokeOpacity=".72" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const runTransition = userData => {
    if (prefersReducedMotion) {
      onLogin(userData);
      return;
    }
    if (overlayRef.current) overlayRef.current.style.opacity = '1';
    window.setTimeout(() => onLogin(userData), 320);
  };

  const submit = async (user, pass) => {
    setLoading(true);
    setError('');
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
    if (!username.trim()) return setError('Email or username is required');
    if (!password) return setError('Password is required');
    if (mode === 'signup') {
      if (password.length < 6) return setError('Password must be at least 6 characters');
      if (password !== confirm) return setError('Passwords do not match');
      setLoading(true);
      setError('');
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

  const switchMode = nextMode => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirm('');
  };

  const signInAsDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/demo', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      runTransition(data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="aura-login" aria-label="Aura sign in">
      <div className="aura-login__bg" />
      <div ref={overlayRef} className="aura-login__overlay" />

      <section className="aura-login__stage">
        <motion.div
          className="aura-login__visual"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: 'easeOut' }}
          aria-hidden="true"
        >
          <div className="aura-login__orb-caption">
            <AuraMark size={30} />
            <span>Aura Financial Trading Hub</span>
          </div>
        </motion.div>

        <section className="aura-login__form-zone">
          <motion.div
            className="aura-login__card"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 95, damping: 18, delay: 0.1 }}
          >
            <div className="aura-login__brand">
              <AuraMark />
              <span>Aura</span>
            </div>

            <div className="aura-login__copy">
              <h1>{mode === 'login' ? 'Welcome Back,' : 'Create Account,'}</h1>
              <p>{mode === 'login' ? 'Sign in to your trading hub.' : 'Start inside your trading hub.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="aura-login__form">
              <label className="sr-only" htmlFor="aura-username">Email or Username</label>
              <input
                id="aura-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                maxLength={40}
                placeholder="Email or Username"
                className="aura-login__input"
              />

              <div className="aura-login__password-wrap">
                <label className="sr-only" htmlFor="aura-password">Password</label>
                <input
                  id="aura-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="aura-login__input"
                />
                <button
                  type="button"
                  className="aura-login__eye"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === 'signup' && (
                <>
                  <label className="sr-only" htmlFor="aura-confirm">Confirm password</label>
                  <input
                    id="aura-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    className="aura-login__input"
                  />
                </>
              )}

              <div className="aura-login__meta-row">
                <button type="button" className="aura-login__text-btn">Forgot Password?</button>
              </div>

              {error && <p className="aura-login__error">{error}</p>}

              <button type="submit" disabled={loading} className="aura-login__btn-primary">
                {loading ? (mode === 'signup' ? 'Creating...' : 'Logging in...') : (mode === 'signup' ? 'Create Account' : 'Login')}
              </button>
            </form>

            <button
              type="button"
              disabled={loading}
              onClick={() => setError('Wallet connection is a visual placeholder in this build.')}
              className="aura-login__btn-wallet"
            >
              <Wallet size={15} />
              <span>Connect Wallet</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={signInAsDemo}
              className="aura-login__btn-demo"
            >
              {loading ? 'Preparing demo...' : 'Demo Login'}
            </button>

            <p className="aura-login__footer">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="aura-login__link">
                {mode === 'login' ? 'Create one.' : 'Sign in.'}
              </button>
            </p>
          </motion.div>
        </section>
      </section>
    </main>
  );
}
