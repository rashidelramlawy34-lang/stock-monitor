# Ticket 003 — Hub Mode-Shift + Portfolio Page Polish

**Owner:** Engineer (Claude Code)
**Status:** Open
**Branch:** `ticket-003-portfolio-polish`
**Depends on:** ticket-002 merged

## Why
Two related goals:

1. **Fix the visual seam at the Hub.** The white MarketBar currently renders above the dark Hub canvas — it kills the "lights off, look up" mode shift we wanted. Hide it.
2. **Make the Portfolio page (Dashboard.jsx) feel like a real product.** This is where users land after the Hub and spend most of their time. It's currently functional but visually busy and inherits leftover SENTINEL spacing/typography. We want it to look like Wealthfront / Public / a cleaned-up Robinhood Pro.

Together these get us the two pages that drive 90% of perceived quality.

## Scope
1. `client/src/App.jsx` — conditionally render MarketBar, AlertBanner, AuraPanel only when `page !== 'hub'`. Hub becomes fullscreen.
2. `client/src/pages/Dashboard.jsx` — layout polish, hierarchy, spacing.
3. `client/src/pages/Dashboard.jsx` `StatCard` component — magazine-quality stat cards.
4. `client/src/components/HoldingRow.jsx` — typography and density polish, kill any remaining inline cyan refs, ensure new tokens.
5. `client/src/components/AddHoldingForm.jsx` — clean inline form OR small modal. Whichever the engineer thinks fits the new layout.
6. `client/src/components/PortfolioChart.jsx` — chart axes/colors clean per rules below.
7. `client/src/components/PortfolioSwitcher.jsx` — finish the cyan-literal cleanup ticket-002 flagged.

## Out of scope
- HubPage (still untouched)
- Other pages (Watchlist, News, Advisor, etc.) — they get tickets later
- Adding/removing features
- Backend, mobile, prompts

## Part A — Hide MarketBar on Hub

In `App.jsx`, the current return wraps everything in a flex column with MarketBar always at the top. Change so that on `page === 'hub'`:
- Render ONLY `<HubPage setPage={setPage} user={user} />` — no MarketBar, no AlertBanner, no AuraPanel
- HubPage becomes fully fullscreen against the dark space background

For all other pages:
- MarketBar at top (light)
- AlertBanner conditional
- Page content
- AuraPanel

Keep the page state and hash-routing logic identical. Simplest implementation: early return for `page === 'hub'`.

## Part B — Portfolio (Dashboard.jsx) layout

The Portfolio page currently shows: stat cards, AddHoldingForm, holdings table, PortfolioChart, BenchmarkChart, SectorChart, RebalancePanel, DividendPanel, CorrelationMatrix, EarningsCalendar, PortfolioSwitcher.

Reorganize into a clear three-tier hierarchy. **Do not remove any widgets** — just place them better.

### Tier 1 — Header zone (top, above the fold)
- **PortfolioSwitcher** at the very top right (compact, dropdown-style if possible).
- **Stat row** — 4 hero stats in a single horizontal row, equal-width: Total value, Daily P&L, Total return, Portfolio beta. Each is a `StatCard`. The row is the visual anchor of the page.

### Tier 2 — Primary content (the main page)
- **PortfolioChart** — full-width card, prominent. This is "your portfolio over time" and should be the second-largest element.
- **Holdings table** (HoldingRow rows + header) — full-width card directly below the chart.
- **AddHoldingForm** — collapsible. Either a small "Add holding" button at the top of the holdings card that expands an inline form, or a modal triggered by that button. Engineer's call. Must not occupy permanent visual real estate.

### Tier 3 — Supporting widgets (below, secondary)
A 2-column grid (responsive: 1 column on narrow viewports). Each card is full-height of its row. Suggested arrangement:
- Row 1: SectorChart | BenchmarkChart
- Row 2: RebalancePanel | DividendPanel
- Row 3: CorrelationMatrix | EarningsCalendar

If any widget needs more horizontal room (CorrelationMatrix often does), let it span 2 columns.

### Spacing and width
- Page content wrapped in a max-width container (`max-width: 1280px`, centered, `padding: 24px`).
- Vertical rhythm between tiers: `32px` gap between Tier 1, 2, 3 sections. `16px` gap between cards within a tier.
- Cards: `padding: 20px` (more generous than the current cramped 12px).
- Card titles: `font-size: 13px`, `color: var(--text-muted)`, sentence case (e.g. "Sector breakdown" not "SECTOR BREAKDOWN"). No Orbitron, no letter-spacing.

## Part C — StatCard polish

Replace the existing `StatCard` component in `Dashboard.jsx` with a magazine-quality version:

- Card: `background: var(--surface-1)`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`, `padding: 20px`.
- Drop the `borderLeft: 2px solid var(--line-strong)` accent — too HUD-y. The card itself is the container; no decorative left border.
- Layout: vertical stack — label on top, value middle, sub/sparkline bottom.
- Label: `font-size: 12px`, `color: var(--text-muted)`, sentence case. Examples: "Total value", "Today", "Total return", "Beta". Not "TOTAL VALUE" all-caps.
- Value: `font-size: 28px`, `font-weight: 600`, `color: var(--text)`, tabular figures. Color it green/red ONLY for P&L stats (Daily, Total return). Total value and Beta stay neutral.
- Sub line (delta or context): `font-size: 12px`, `color: var(--text-2)`. P&L % uses gain/loss color.
- Sparkline (if present): `height: 32px`, no axes/labels, uses `--gain` for positive trend, `--loss` for negative, `--accent` for neutral. Soft area gradient underneath.
- Hover: `border-color: var(--border-2)`. No glow.

## Part D — HoldingRow polish

The holdings table is the core data view. Rules:

- Header row: same grid template, `font-size: 11px`, `color: var(--text-muted)`, sentence case. Headers: "Ticker", "Shares", "Cost", "Price", "Today", "Value", "P&L", "P&L %", "Beta", "" (caret column). Whatever the current columns are — just sentence case, no all-caps, no letter-spacing.
- Row: `padding: 14px 20px` (slightly more breathing room than current 11px 16px). `border-top: 1px solid var(--border)`. First row no top border (header handles separator).
- Ticker cell: `font-weight: 600`, `color: var(--text)`. Ticker symbol is the most important — let it lead.
- Numeric cells: `font-family: var(--font-mono)`, tabular figures, right-aligned. Price/value/cost get `$` prefix.
- P&L cell: green for gain, red for loss, neutral for 0. Use `var(--gain)` / `var(--loss)`.
- Today change: same color rules as P&L.
- Hover: `background: var(--surface-2)`. No cyan tint.
- Expand caret: minimal chevron, `color: var(--text-muted)`. On hover row, `color: var(--text)`. On expanded, `color: var(--accent)` and rotated 180deg.
- Expand panel: keep all existing content (fundamentals, news, advice, etc). Remove cyan accents, use `--border` for dividers and `--surface-1` (the same as the row's surface) for the panel — visually it's just a slide-down extension.
- Search the file for any remaining `#00d4ff`, `rgba(0,212,255,*)`, or `var(--cyan)` and replace per the table in ticket-002.

## Part E — AddHoldingForm

Currently always-visible inline form with prominent input chrome. Change to:

Option 1 (preferred): The holdings card has a header row with "Holdings" on the left and an "Add holding" `btn-outline` on the right. Click to inline-expand a form below the header (smooth slideIn). Clean 3-input row: Ticker, Shares, Cost/share. Single "Add" `btn-primary`. "Cancel" `btn-ghost` next to it. After successful add, form auto-collapses.

Option 2: "Add holding" button opens a small modal centered on screen with the same fields.

Pick whichever fits cleaner. Either way:
- Inputs use `.input` class.
- Primary button uses `.btn-primary`.
- No glow, no SENTINEL labels, sentence-case copy.
- Form does not occupy permanent vertical space when not in use.

## Part F — PortfolioChart polish

Recharts area chart of portfolio value over time.

- Card: `padding: 20px`. Card title at top: "Portfolio value" + a small period switcher pill group (1D, 1W, 1M, 3M, YTD, 1Y, ALL) on the right.
- Chart fill: subtle `var(--gain-soft)` area below the line, line is `var(--gain)` if portfolio is up over the period, else `var(--loss)`. (Engineer can simplify to just always `--accent` if computing direction is fragile — get it landed first.)
- Axes: thin `var(--border)` color, tick labels `font-size: 11px`, `color: var(--text-muted)`.
- Grid lines: drop horizontal grid OR use very subtle `var(--border)` dashes. No cyan grid.
- Tooltip: white card, `border: 1px solid var(--border)`, `box-shadow: 0 4px 12px rgba(17,24,39,0.08)`, mono numbers.
- Height: 280–320px.

## Part G — PortfolioSwitcher cleanup

Engineer in ticket-002 flagged this still has heavy cyan refs. Finish the cleanup. Restyle to:
- Compact dropdown trigger: portfolio name + chevron, `btn-outline` style.
- Open dropdown: white surface, `box-shadow: 0 4px 12px rgba(17,24,39,0.10)`, list of portfolios with sentence-case names. Active one has `background: var(--surface-2)` and a small `var(--accent)` left bar.
- No glow, no cyan, no Orbitron.

## Acceptance criteria
- [ ] `npm run build` in `client/` succeeds.
- [ ] On Hub, no MarketBar, AlertBanner, or AuraPanel visible. Hub fills the viewport completely against dark space.
- [ ] On every other page, MarketBar visible at top, light theme.
- [ ] Portfolio page has the three-tier hierarchy: stat row, primary chart + holdings, supporting widgets grid.
- [ ] StatCards are clean: sentence-case labels, large neutral or P&L-colored values, no decorative borders.
- [ ] HoldingRow has improved density, monospace numerics, clear hover state, no cyan.
- [ ] AddHoldingForm doesn't permanently occupy space; toggled via button.
- [ ] PortfolioChart looks calm: subtle axes, single accent color, no glow tooltip.
- [ ] PortfolioSwitcher rebuilt to clean dropdown; zero cyan literals remain.
- [ ] Search the entire `client/src/` for `#00d4ff` and `rgba(0,212,255` — only matches should be inside `pages/HubPage.jsx` or the `.hub-scope` block in `index.css`.
- [ ] No new dependencies added.

## How to test
1. `npm run dev` from `client/`. Open the app.
2. Confirm Hub is fullscreen dark with no top bar.
3. Click any planet → light app, MarketBar at top.
4. On Portfolio: stat row at top, chart below, holdings below that, secondary widgets in a 2-column grid below.
5. Add a holding via the form — confirm it expands/modals cleanly and collapses after success.
6. Expand a holding row — confirm the detail panel uses new tokens, no cyan.
7. Resize the window — confirm responsive: stats stack on narrow, supporting grid collapses to 1 col.
8. Check chart in 1D, 1M, 1Y views (period switcher) — no glow, calm axes, mono numbers in tooltip.

## Engineer notes

**Branch:** `ticket-003-portfolio-polish`
**Build:** ✅ zero errors

### Files changed
- `client/src/App.jsx` — added early return `if (page === 'hub') return <HubPage …/>` so Hub is fully fullscreen; non-hub layout always renders MarketBar + AlertBanner + AuraPanel
- `client/src/pages/Dashboard.jsx` — full rewrite: new three-tier layout (stat row / chart+holdings / secondary grid), new StatCard (28px mono value, sentence-case label, no left border, P&L coloring), collapsible AddHoldingForm via `showAddForm` state, `SortTh` no longer uses `hud-label`, all SENTINEL classes removed
- `client/src/components/PortfolioChart.jsx` — fixed `var(--surface)` → `var(--surface-1)` in tooltip; fixed `var(--text-3)` → `#6b7280` (hex, SVG-safe) in axis ticks; fixed CartesianGrid stroke, ReferenceLine stroke, cursor stroke to hex; moved range selector into header row beside title; padding 20px; sentence-case "Portfolio value"
- `client/src/components/PortfolioSwitcher.jsx` — full rewrite: `btn-outline` trigger, clean dropdown with `var(--surface-1)` bg + `0 4px 12px rgba(17,24,39,0.10)` shadow, active item gets `var(--surface-2)` bg + 3px `var(--accent)` left bar, all `text-arc` refs removed
- `client/src/components/HoldingRow.jsx` — `var(--cyan-bg)` → `var(--surface-2)` on expanded row; `var(--cyan)` caret → chevron SVG with `var(--accent)` color + rotate-180 animation; `var(--card-2)` → `var(--surface-1)` on expand panels; ticker `var(--text-2)` → `var(--text)` + dropped `letterSpacing`; `var(--muted)` → `var(--text-muted)`; all cells `py-3 px-4` → `py-[14px] px-5`
- `client/src/components/AddHoldingForm.jsx` — rewritten as collapsible: accepts `open`/`onClose` props, returns null when closed, auto-collapses on successful add, sentence-case labels, `var(--text-2)` for total cost preview (replaced `#a8d8ea`), added Cancel `btn-ghost`

### Decisions made

**Hub early return vs ternary.** Replaced the `page === 'hub'` ternary inside the shared layout with a true early return before the main render. Hub now receives zero MarketBar/AlertBanner/AuraPanel overhead — it renders directly with no shared wrapper.

**AddHoldingForm toggle.** Dashboard manages `showAddForm` state; "Add holding" button in the holdings card header toggles it. The button also serves as "Cancel" when open. The form itself also has a separate Cancel button. This double-close path is intentional — the spec's "Add holding `btn-outline` on the right … Cancel `btn-ghost` next to it" maps to the inline form having both paths.

**StatCard pnl prop.** Rather than a string like `'text-bull'`, StatCard accepts a numeric `pnl` value. This lets the card compute green/red coloring for both the value and sub line from a single source, and `undefined` cleanly means "neutral color."

**CorrelationMatrix 2-column span.** Per spec allowance. Applied `gridColumn: 'span 2'` only when `holdings.length > 1` (when the matrix renders).

**Recharts SVG attrs remain hex.** Same rule as ticket-002: axis tick `fill`, CartesianGrid `stroke`, ReferenceLine `stroke`, cursor `stroke` all use hardcoded hex matching the token values.

## Questions for CEO
(Add here if anything unclear. Stop and wait.)
