import { useState, useEffect } from 'react';

function KeyField({ label, keyName, description, current, onChange }) {
  const [show, setShow] = useState(false);
  const isSet = current === '***set***';

  return (
    <div className="flex flex-col gap-2">
      <label className="hud-label">{label}</label>
      <p className="text-xs text-muted">{description}</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            placeholder={isSet ? '••••••••••••••••••••••••' : 'Paste your key here…'}
            onChange={e => onChange(keyName, e.target.value)}
            className="input w-full pr-14 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-[#00d4ff] text-xs transition-colors"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-sm border tracking-wider uppercase ${
          isSet
            ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/30'
            : 'bg-[rgba(0,212,255,0.05)] text-muted border-[rgba(0,212,255,0.15)]'
        }`}>
          {isSet ? '✓ Set' : 'Not Set'}
        </span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState({});
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => setSaved(d))
      .catch(() => {});
  }, []);

  const handleChange = (key, value) => {
    setDraft(d => ({ ...d, [key]: value }));
    setSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await fetch('/api/settings').then(r => r.json());
      setSaved(updated);
      setDraft({});
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasDraft = Object.keys(draft).some(k => draft[k] !== '');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="hud-title text-xl">Settings</h1>
        <p className="text-xs text-muted mt-1 tracking-wide">
          API keys are stored in your local database and never leave your machine.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* AI Keys */}
        <div className="card p-5 flex flex-col gap-5">
          <div>
            <h2 className="hud-label mb-0.5">AI Analysis</h2>
            <p className="text-xs text-muted mt-1">Powers the AI Advisor, Portfolio Digest, and Discover scan.</p>
          </div>

          <KeyField
            label="Anthropic API Key"
            keyName="ANTHROPIC_API_KEY"
            description="Get your key at console.anthropic.com → API Keys"
            current={saved['ANTHROPIC_API_KEY'] ?? ''}
            onChange={handleChange}
          />
        </div>

        {/* Market Data Keys */}
        <div className="card p-5 flex flex-col gap-5">
          <div>
            <h2 className="hud-label mb-0.5">Market Data</h2>
            <p className="text-xs text-muted mt-1">Required for live prices, fundamentals, and news. Free tier at finnhub.io.</p>
          </div>

          <KeyField
            label="Finnhub API Key"
            keyName="FINNHUB_API_KEY"
            description="Get your free key at finnhub.io → Dashboard"
            current={saved['FINNHUB_API_KEY'] ?? ''}
            onChange={handleChange}
          />
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !hasDraft}
            className="btn-primary"
          >
            {saving ? 'Saving…' : 'Save Keys'}
          </button>

          {success && (
            <span className="text-sm text-bull font-bold">
              ✓ Keys saved
            </span>
          )}
          {error && (
            <span className="text-sm text-bear">{error}</span>
          )}
        </div>
      </form>

      {/* Info */}
      <div className="mt-8 card p-4 bg-[rgba(0,212,255,0.03)]">
        <p className="hud-label mb-3">How Keys Are Used</p>
        <ul className="text-xs text-[rgba(0,212,255,0.5)] space-y-1.5 list-disc list-inside">
          <li><span className="text-[#a8d8ea] font-medium">Anthropic</span> — AI Advisor analysis, Portfolio Digest, and Discover deep analysis</li>
          <li><span className="text-[#a8d8ea] font-medium">Finnhub</span> — Real-time prices, fundamentals, analyst ratings, earnings calendar, and news</li>
          <li>Keys set via environment variables take precedence over keys saved here</li>
          <li>Keys are only used server-side — never sent to the browser</li>
        </ul>
      </div>
    </div>
  );
}
