import { useState, useEffect } from 'react';

function KeyField({ label, keyName, description, current, onChange }) {
  const [show, setShow] = useState(false);
  const isSet = current === '***set***';

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            placeholder={isSet ? '••••••••••••••••••••••••' : 'Paste your key here…'}
            onChange={e => onChange(keyName, e.target.value)}
            className="input w-full pr-10 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isSet
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
        }`}>
          {isSet ? 'Set' : 'Not set'}
        </span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState({});   // what the server has
  const [draft, setDraft] = useState({});   // pending user edits
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
      // Refresh saved state
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">
          API keys are stored securely in your local database and never leave your machine.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* AI Keys */}
        <div className="card p-5 flex flex-col gap-5">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">AI Analysis</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Powers the AI Advisor, Weekly Digest, and Discover scan.</p>
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
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">Market Data</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Required for live prices, fundamentals, and news. Free tier at finnhub.io.</p>
          </div>

          <KeyField
            label="Finnhub API Key"
            keyName="FINNHUB_API_KEY"
            description="Get your free key at finnhub.io → Dashboard"
            current={saved['FINNHUB_API_KEY'] ?? ''}
            onChange={handleChange}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !hasDraft}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Keys'}
          </button>

          {success && (
            <span className="text-sm text-bull font-medium">
              ✓ Keys saved successfully
            </span>
          )}
          {error && (
            <span className="text-sm text-bear">{error}</span>
          )}
        </div>
      </form>

      {/* Info box */}
      <div className="mt-8 card p-4 bg-slate-50 dark:bg-[#0f1623]">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">How keys are used</p>
        <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-1.5 list-disc list-inside">
          <li><span className="font-medium text-slate-700 dark:text-slate-300">Anthropic</span> — AI Advisor analysis, Weekly Digest, and Discover deep analysis</li>
          <li><span className="font-medium text-slate-700 dark:text-slate-300">Finnhub</span> — Real-time prices, fundamentals, analyst ratings, earnings calendar, and news</li>
          <li>Keys set via environment variables (in <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">.env</code>) take precedence over keys saved here</li>
          <li>Keys are only used server-side — they are never sent to the browser</li>
        </ul>
      </div>
    </div>
  );
}
