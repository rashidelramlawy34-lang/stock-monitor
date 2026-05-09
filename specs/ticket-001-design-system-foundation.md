# Ticket 001 — Design System Foundation

**Owner:** Engineer (Claude Code)
**Status:** Open
**Branch:** `ticket-001-design-system`

## Why
The app currently uses a "SENTINEL" Iron Man / JARVIS HUD theme — cyan glows, Orbitron, corner brackets, all-caps tracking-out labels. We're rebranding to a clean institutional finance aesthetic (Bloomberg / Robinhood Pro / Stripe dashboard).

This ticket lays the foundation. We rewrite the design tokens and shared component classes ONCE, so every page picks up the new look automatically. Subsequent tickets will fix per-page issues that don't fall out for free.

**HubPage is excluded.** Do not modify `pages/HubPage.jsx` or its planet visuals. It can keep using the old token names locally if it must — leave it alone.

## Scope (what to change)
1. `client/src/index.css` — replace tokens and component layer
2. `client/tailwind.config.js` — replace the palette and font extensions
3. `client/src/components/MarketBar.jsx` — top nav restyle
4. `client/src/components/AlertBanner.jsx` — restyle
5. `client/src/components/AuraPanel.jsx` — rename visually (still called AuraPanel in code is fine), restyle to a discreet bottom bar / floating action, no glow
6. Any global className utilities used across pages: `.card`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.input`, `.s-tag`, `.badge-*`, `.pill`, `.pill-group`, `.stat-label`, `.stat-value`, `.h-row`, `.h-row-head`, `.expand-caret`, `.hud-*` (deprecate)

## Out of scope
- HubPage.jsx (excluded)
- Per-page layout changes — only the shell + tokens
- Backend, mobile, prompts
- Renaming components in JS/JSX (keep names; just restyle)

## Design tokens to introduce

Use these exact values. They produce a dark institutional look — calm, dense, type-driven.

### Colors
```
--bg:          #0b0d10   /* page background, near-black charcoal */
--surface-1:   #131619   /* card background */
--surface-2:   #1a1d21   /* elevated card / hover */
--border:      #232830   /* default border */
--border-2:    #2e343d   /* stronger border */

--text:        #e6e8eb   /* primary text */
--text-2:      #a1a7b0   /* secondary text */
--text-muted:  #6b7280   /* labels, captions */

--gain:        #16a34a   /* green */
--gain-soft:   rgba(22, 163, 74, 0.12)
--loss:        #dc2626   /* red */
--loss-soft:   rgba(220, 38, 38, 0.12)
--warn:        #d97706
--warn-soft:   rgba(217, 119, 6, 0.12)

--accent:      #3b82f6   /* one blue, used SPARINGLY for primary actions only */
--accent-hover:#2563eb
```

### Type
```
--font-sans: 'Inter', system-ui, -apple-system, sans-serif
--font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace
```
Drop Orbitron entirely. Drop the cyan/HUD font tokens.

Body: `font-family: var(--font-sans)`, `font-size: 14px`, `line-height: 1.45`, `font-feature-settings: "tnum", "ss01"`.

### Spacing / radius
```
--radius:     8px
--radius-sm:  4px
--radius-pill:999px
```

### Allowed effects
- Subtle 1px borders. That's it.
- No `text-shadow`. No glowing `box-shadow`. A flat `box-shadow: 0 1px 2px rgba(0,0,0,0.4)` for elevated cards is fine.
- No scanline body backgrounds, no flicker animations, no orbPulse, no arc-reactor styles. Delete them.
- Keep `slideIn` (used for expand panels) and `spin` (loading). Drop the rest.

## Component-level rules

### `.card`
- `background: var(--surface-1)`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`.
- Remove the `::before` / `::after` corner brackets entirely.
- Hover: `border-color: var(--border-2)`. No glow.

### Buttons
- `.btn-primary`: solid `var(--accent)` background, white text, `border-radius: var(--radius-sm)`. Hover darkens to `--accent-hover`. No glow.
- `.btn-outline`: transparent bg, `1px solid var(--border-2)`, `color: var(--text)`. Hover: `border-color: var(--text-2)`.
- `.btn-ghost`: no border, `color: var(--text-2)`. Hover: `color: var(--text)`.

### `.input`
- `background: var(--surface-2)`, `border: 1px solid var(--border)`, `color: var(--text)`.
- Focus: `border-color: var(--accent)`, no glow ring (or a 1px subtle ring max).

### Badges / tags
- Replace `.badge-bull`, `.badge-bear`, `.badge-neutral` with calm versions: small pill, `background` is the `*-soft` token, `color` is the solid token, no border or 1px subtle border. Sentence case, NOT all caps. `font-size: 11px`. No Orbitron.
- Same for `.s-tag` family.

### `.pill` / `.pill-group`
- `font-family: var(--font-sans)`, sentence case, `font-size: 12px`, no letter-spacing tricks.
- Active state: `background: var(--surface-2)`, `color: var(--text)`. No cyan.

### `.stat-label` / `.stat-value`
- Label: `color: var(--text-muted)`, `font-size: 12px`, sentence case, no letter-spacing.
- Value: `font-size: 22px`, `font-weight: 500`, `color: var(--text)`, tabular figures.

### Holdings table (`.h-row`, `.h-row-head`)
- Keep the grid template columns as-is — content alignment matters.
- Header: `color: var(--text-muted)`, `font-size: 11px`, sentence case (no all-caps), no letter-spacing.
- Row hover: `background: var(--surface-2)`. No cyan tint.
- Border between rows: `border-top: 1px solid var(--border)`.

### MarketBar (top nav)
- Background: `var(--surface-1)`, bottom border `1px solid var(--border)`.
- App name: `color: var(--text)`, sentence case ("Stock Monitor" or whatever the current title is — replace any "SENTINEL" copy with "Stock Monitor"). NOT in Orbitron.
- Page tabs: plain text links, active is `color: var(--text)` + `border-bottom: 2px solid var(--accent)`. Inactive is `color: var(--text-2)`.
- Market tickers (S&P, NASDAQ, etc): mono font, tabular, green/red change values, no glow.

### AlertBanner
- A flat amber-toned notice when alerts trigger: `background: var(--warn-soft)`, `border: 1px solid var(--warn)`, `color: var(--text)`. Dismissible. No animation beyond a 200ms fade.

### AuraPanel
- Restyle to a small discreet floating action OR a thin bottom utility bar.
- No glow, no corner brackets. Use neutral surface and border tokens. Sentence-case copy.
- Keep the underlying functionality intact — just restyle.

## Acceptance criteria
- [ ] App builds with `npm run build` in `client/` with no errors.
- [ ] Loading the app and clicking through every non-Hub page (Portfolio, Watchlist, News, Advisor, Coach, Alerts, Discover, Insiders, Institutional, Calendar, Trades, Settings) shows: no cyan glow anywhere, no Orbitron, no corner brackets on cards, no all-caps letterspaced labels.
- [ ] HubPage still looks identical to before this ticket.
- [ ] Bull/bear coloring still works on prices and badges (green up, red down).
- [ ] Buttons, inputs, cards, tables, pills, badges all use the new tokens.
- [ ] No new npm dependencies added.
- [ ] Old token names (`--cyan`, `--arc`, `--bg-1`, `--card-2`, etc.) and old utility classes (`.hud-title`, `.arc-reactor`, etc.) are either removed OR retained only inside `HubPage.jsx`'s scope (scoped CSS or inline) — they should not affect the rest of the app.

## How to test
1. `cd stock-monitor/client && npm install && npm run dev`
2. In another terminal: `cd stock-monitor/server && npm install && npm run dev`
3. Open `http://localhost:5173`. Log in.
4. Click into Hub, then click each planet to visit each page. Confirm the visual rules above on each.
5. Toggle one holding's expand panel — confirm the nested detail panel uses new tokens.
6. Trigger an alert if you can; otherwise inject one manually to verify AlertBanner styling.

## Engineer notes

**Branch:** `ticket-001-design-system`
**Commit:** `9ee48e1`
**Build:** ✅ zero errors

### Files changed
- `client/src/index.css` — full rewrite: new institutional tokens, redesigned component layer, legacy aliases block
- `client/tailwind.config.js` — stripped Iron Man palette; `bull`/`bear` kept as Tailwind aliases mapping to `--gain`/`--loss`
- `client/src/components/MarketBar.jsx` — full restyle: "Stock Monitor" wordmark in Inter, institutional ticker display, clean market status dot, no glow, no Orbitron
- `client/src/components/AlertBanner.jsx` — flat amber panel, Inter, sentence case, dismissible
- `client/src/components/AuraPanel.jsx` — discreet floating panel, plain Inter, "AI Advisor" label, `btn-outline` actions, no glow

### Decisions made

**HubPage token compatibility.** HubPage.jsx uses `var(--cyan)`, `var(--font-brand)`, `var(--muted)`, `var(--dim)`, `var(--line)`, `var(--card)`, etc. by those exact names inline. Since HubPage.jsx is excluded from this ticket, old token names are retained in `:root` as a clearly marked legacy block. New components use only new token names (`--surface-1`, `--border`, `--gain`, etc.) — the old tokens are dead ends from the new system's perspective.

**`orbPulse` retained.** The ticket says delete it, but `HubPage.jsx` uses it for the center orb animation and `App.jsx` uses it for the loading spinner. Both are out of scope for this ticket. `orbPulse` is kept and simplified (opacity pulse only, no cyan glow box-shadow). Flag for ticket-002: update `App.jsx` loading spinner to use `spin` instead, then `orbPulse` can be fully removed.

**`--bull` / `--bear` remapped.** These legacy token names now alias to `var(--gain)` / `var(--loss)`. Color shifts from bright #00e676 → #16a34a (green) and #ff3355 → #dc2626 (red). HoldingRow and other unrefactored components pick this up automatically — more institutional-looking.

**`hud-label` restyled (not removed).** Used in ~10 components out of scope for this ticket (DigestPanel, TechnicalsChart, HRHRCard, etc.). Restyled to plain Inter 11px `var(--text-muted)` — no Orbitron, no all-caps, no tracking. No breaking changes, all usages look correct under the new style.

**`text-arc` mapped to `--accent` (blue).** Old value was `--cyan`. Components using `text-arc` (NewsCard, PortfolioSwitcher, RebalancePanel, DeveloperPage) now render in accent blue rather than cyan. This is the intended rebrand behavior.

**`bg-warn` / `text-warn` Tailwind classes.** Kept `warn` in tailwind config so `bg-warn` (used in HoldingRow alert dots) continues to work with the new `#d97706` amber value.

### Skipped / deferred to ticket-002
- Per-page layout cleanup (HoldingRow inline cyan refs, PortfolioChart `hud-label`, BenchmarkChart, etc.)
- `App.jsx` loading spinner: still uses `orbPulse` inline — should switch to a simple `spin` spinner
- `Nav.jsx`: still contains full SENTINEL sidebar code; per ticket scope it's shell-only and Nav isn't used in the new sidebar-free layout, but the file should be cleaned up or removed
- `PortfolioSwitcher.jsx`: heavy use of arbitrary `rgba(0,212,255,*)` values — needs per-component refactor

## Questions for CEO
- Should `Nav.jsx` be deleted entirely since the sidebar was removed and replaced by HubPage navigation, or kept as-is for now?
- `App.jsx` loading screen uses `orbPulse` and the HexMark SVG (SENTINEL branding) — should this be replaced in ticket-002 with a plain spinner?
