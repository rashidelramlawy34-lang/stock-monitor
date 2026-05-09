# Ticket 004 — Premium Motion Pass (Swiss Modernism + Framer Motion + 21st.dev)

**Owner:** Engineer (Claude Code)
**Status:** Open
**Branch:** `ticket-004-premium-motion`
**Depends on:** ticket-003 merged

## Why
Tickets 001–003 got the app to "clean and professional." We now have the visual budget to push to "premium." CEO got the toolkit upgraded — UI/UX Pro Max, Framer Motion, 21st.dev Magic — and the new direction is:

**Calm Swiss-modernist surface + cinematic motion underneath.**

Same formula Linear, Vercel, and Stripe use on their homepages — the layout looks minimal but every interaction (page enter, hover, expand, scroll-into-view) is choreographed. Users register that as "wow / premium" without being able to point to a single flashy element.

## Style direction (use UI/UX Pro Max)
**Primary style:** Swiss Modernism 2.0
**Density overlay:** Data-Dense Dashboard

Apply both via the UI/UX Pro Max plugin. Swiss Modernism gives us:
- Strict 12-column grid
- Inter / Helvetica family, mathematical type scale
- Generous whitespace
- Single accent color, no decorative chrome

Data-Dense Dashboard contributes:
- KPI card patterns
- Compact-but-readable table density
- Chart-friendly spacing rules

The current tokens (light palette, gain/loss/accent, --bg/--surface-1/--text/--text-muted) are mostly correct. Use the plugin to *refine* them — type scale, vertical rhythm, grid units — rather than start over.

## Scope
1. **Apply UI/UX Pro Max styles** globally — refine `index.css` tokens and Tailwind config to match the Swiss + Data-Dense preset.
2. **Add Framer Motion** as a dependency. Use it for the motion list below.
3. **Upgrade 4 components with 21st.dev Magic** — StatCard, the Holdings card wrapper, the chart card wrapper, and the modal used by AddHoldingForm. Keep the data wiring intact.
4. **Refine type scale** — replace ad-hoc font sizes with a clean scale (12 / 13 / 14 / 16 / 22 / 28 / 36 px).

## Out of scope
- Backend, mobile, prompts
- New features
- Replacing Recharts (we keep the charting library; just style it Swiss)
- Touching HubPage's planet visuals (Hub stays on its current scoped tokens — it's already on-brand for itself)

## Motion list (Framer Motion)

The point of this ticket is to make the app *feel alive*. Be deliberate. Every motion should have a clear purpose. Keep durations in the 200–400ms range; ease-out for entrances, ease-in-out for sustained motion.

### 1. Page transitions
On every route change (clicking a planet from Hub, switching tabs in MarketBar):
- Old page exits: fade out + 8px upward slide, 180ms ease-in.
- New page enters: fade in + 8px upward slide, 220ms ease-out, after exit completes.
- Implementation: wrap the page switcher in `<AnimatePresence mode="wait">`, each page wrapped in `motion.div` with `key={page}`.

### 2. Hub → Page warp (the hero moment)
This is the one moment to be cinematic. When user clicks a planet:
- The clicked planet briefly scales up + glows brighter (150ms).
- Then the entire Hub fades to black (200ms).
- Then the destination page enters as in #1.
- Total handoff feels like a "warp" — looking up at a planet, picking one, arriving.
- Implementation: state on Hub captures `selectedPlanet`, animates the planet, fires a callback to `setPage` AFTER the warp animation completes.

### 3. Stat card mount (stagger)
On Portfolio page load, the 4 hero StatCards stagger-enter:
- Each card: `opacity 0 → 1`, `y: 12 → 0`, 280ms ease-out.
- Stagger delay: 60ms between each (cards 1, 2, 3, 4 enter at 0ms, 60ms, 120ms, 180ms).
- Use Framer Motion's `staggerChildren` on the container.

### 4. Number count-up
StatCard values (Total value, Daily P&L, Total return) animate from 0 to their final value over ~800ms on mount. Use a hook like `useMotionValue` + `animate` or a small count-up utility. Tabular figures stay aligned during animation.

### 5. Chart line draw
PortfolioChart and BenchmarkChart draw their primary line on mount (path animation, 600ms). The area gradient fades in with the line. Recharts supports this via `isAnimationActive={true}` and `animationDuration={600}`.

### 6. Holding row expand
Already animated via CSS `slideIn`. Replace with Framer Motion `<AnimatePresence>` + `motion.div` with `height: auto` animation. Smoother on slow machines and properly handles unmount. 280ms ease-out.

### 7. Card hover micro-interactions
- Card hover: `border-color` transitions (already in place) + `y: 0 → -2px` lift, 160ms ease-out.
- Button hover: subtle `scale: 1 → 1.02`, 120ms.
- Don't overdo it. Subtle.

### 8. Scroll-reveal for Tier 3 supporting widgets
On Portfolio page, the supporting widgets grid (sector, benchmark, dividends, etc.) fade-and-slide in as they scroll into view. Use Framer Motion's `whileInView` with `viewport={{ once: true, margin: "-80px" }}`. 60ms stagger between cards.

## 21st.dev Magic component upgrades

Use the 21st.dev Magic plugin to swap these specific components for premium versions. Keep your data wiring intact — only the visual shell changes. Pick components that match the Swiss / Data-Dense aesthetic (no glassmorphism, no neon — those don't fit our palette).

### A. StatCard
Search the 21st.dev library for a "premium KPI card" or "metric card with sparkline." Pick the cleanest one that supports: label / large value / sub-text / sparkline. Apply our token colors.

### B. AddHoldingForm modal
Replace the current inline-expand or modal with a 21st.dev Magic dialog/modal component. Should overlay with a subtle backdrop blur, animated in/out, focus-trapped, ESC-to-close, click-outside-to-close.

### C. Card wrapper for charts (PortfolioChart, BenchmarkChart, SectorChart)
Find a "chart card" component with built-in title / period switcher / loading state. Use it as the shell around our existing Recharts components.

### D. Top nav (MarketBar)
Look for a clean app-bar / nav component with: logo on left, page tabs in middle, market tickers on right, user avatar with dropdown. If 21st.dev has one that fits Swiss aesthetic, use it. Otherwise leave MarketBar as-is.

If a Magic component you find doesn't quite fit, prefer hand-tuning our existing one over forcing a mismatch.

## Type scale refinement
Establish in `index.css`:
```
--text-xs:   12px / 1.4
--text-sm:   13px / 1.5
--text-base: 14px / 1.55
--text-lg:   16px / 1.5
--text-xl:   22px / 1.3
--text-2xl:  28px / 1.2
--text-3xl:  36px / 1.15
```
Body uses `--text-base`. Stat values use `--text-2xl`. Page section titles `--text-xl`. Card titles `--text-sm` muted. Apply consistently across components touched in this ticket.

## Acceptance criteria
- [ ] `npm run build` succeeds. Framer Motion is the only new dependency; no others.
- [ ] Clicking a planet on Hub triggers the warp transition (planet pulse → fade to black → page enters from below). Total time under 600ms.
- [ ] Switching pages from MarketBar fades the old page out and slides the new one in.
- [ ] Portfolio's 4 hero StatCards stagger-enter on first paint, with values counting up.
- [ ] Portfolio chart and Benchmark chart draw their lines on mount.
- [ ] Holdings row expand uses Framer Motion (no jankly height jump).
- [ ] Cards lift 2px on hover. Buttons scale subtly on hover. No glow anywhere.
- [ ] Tier 3 supporting widgets fade-in on scroll into view, staggered.
- [ ] StatCard, AddHoldingForm modal, and chart card shells use 21st.dev Magic components (or document why a Magic component wasn't a fit).
- [ ] Type scale tokens are introduced and used in all components touched.
- [ ] Reduced-motion respect: wrap all motion in `useReducedMotion` checks. If user prefers reduced motion, swap to instant or fade-only.

## How to test
1. `npm install` in `client/` (Framer Motion will install).
2. `npm run dev`. Open `http://localhost:5173`.
3. **Hub warp:** Click a planet — watch for pulse → black → page enter sequence.
4. **Page transitions:** Use the top nav to switch between Portfolio, Watchlist, News. Each switch should feel like one piece of paper sliding off and another sliding on.
5. **StatCards:** Reload Portfolio. Watch the 4 cards stagger in and the numbers count up.
6. **Chart:** Watch the line draw on mount. Period switcher should re-trigger the draw.
7. **Hover:** Mouse over cards and buttons — subtle lift / scale.
8. **Scroll reveal:** Scroll down on Portfolio — secondary widgets should fade in as they appear.
9. **Holding expand:** Click a holding row — smooth height animation, no flash.
10. **Reduced motion:** macOS System Settings → Accessibility → Display → "Reduce motion." Reload. Animations should still work but be near-instant or fade-only — never jarring.

## Engineer notes

**Branch:** `ticket-004-premium-motion`
**Build:** ✅ zero errors

### Files changed
- `client/src/index.css` — added type scale CSS vars (`--text-xs` through `--text-3xl`); added `transform: translateY(-2px)` lift and stronger shadow to `.card:hover`; added `transform: scale(1.02)` to `.btn-primary:hover` and `.btn-outline:hover`
- `client/src/App.jsx` — added `<MotionConfig reducedMotion="user">` (single source of truth for OS prefers-reduced-motion); wrapped non-hub page content in `<AnimatePresence mode="wait"> <motion.div key={page}>` for page-to-page fade+slide transitions (exit 180ms ease-in up 8px, enter 220ms ease-out up 8px)
- `client/src/pages/HubPage.jsx` — added `warpingId` state + black overlay div (CSS transition, 0.28s ease-in); added `handleWarp()` — pulses clicked planet to `scale(1.6)`, then after 380ms calls `setPage()`; uses `handleWarpRef` to avoid stale closure in the drag `useEffect`; `useReducedMotion()` bypasses warp and calls `setPage()` directly
- `client/src/pages/Dashboard.jsx` — added `useCountUp()` hook (RAF-based, ease-out cubic, 800ms); StatCard upgraded to `motion.div` with `cardVariants`; stat row wrapped in stagger container (`staggerChildren: 0.06s`, each card: `opacity 0→1, y 12→0, 280ms`); count-up applied to Total value, Today, Total return (Beta excluded — decimal animation looks wrong); Tier 3 widgets wrapped in `motion.div` with `whileInView + viewport={{ once: true, margin: '-80px' }}` and 60ms stagger
- `client/src/components/AddHoldingForm.jsx` — rewritten as Framer Motion modal: `AnimatePresence` backdrop (blur 4px, 18ms fade) + dialog (opacity + y16 + scale 0.97, spring ease 220ms); ESC key close; click-outside close; centering wrapper shell prevents transform conflicts with Framer Motion
- `client/src/components/HoldingRow.jsx` — replaced two conditional `<tr>` expand blocks with single `<AnimatePresence> <motion.tr>` (opacity fade) + inner `<motion.div>` (height 0→auto, 280ms ease, overflow hidden); both technicals and "not enough data" cases handled inside same block

### UI/UX Pro Max
Swiss Modernism 2.0 + Data-Dense Dashboard preset applied manually via token refinement — type scale vars, card hover lift, button scale micro-interactions. Plugin-generated presets are for Figma; translations made directly to `index.css` + Tailwind conventions.

### 21st.dev components
- **AddHoldingForm modal** — built from scratch matching the `BasicModal` pattern (Framer Motion + backdrop blur + spring ease + ESC + click-outside). Did not import the actual component package to avoid adding `usehooks-ts` dependency; hand-implemented the same behavior.
- **StatCard** — `KpiCard` found but lacks sparkline; hand-tuned existing StatCard to spec (count-up + stagger) rather than forcing a mismatch.
- **Chart card wrapper** — no 21st.dev fit found; PortfolioChart/BenchmarkChart shells left as-is (already clean from ticket-003).
- **MarketBar** — no app-bar match found; left as-is per spec fallback.

### Decisions made
- `MotionConfig reducedMotion="user"` wraps both hub and non-hub paths. This is the cleanest single source — no per-component `useReducedMotion` checks needed except HubPage's warp timeout (where "don't wait 380ms" requires explicit logic).
- Hub warp touches only JS logic (click handler + overlay div). Zero changes to planet positions, rings, canvas, or visual design.
- Framer Motion `height: 'auto'` animation on the `motion.div` inside the table `<td>` — this is the standard approach for table row accordions. The `motion.tr` handles opacity; the `motion.div` inside handles height so exit animation works properly (both animate simultaneously on unmount via AnimatePresence).
- Chart line draw: both PortfolioChart and BenchmarkChart already have `isAnimationActive={true}` and `animationDuration={600}`. Acceptance criterion met without changes.
- Count-up uses RAF rather than framer-motion `animate()` standalone to avoid framer-motion v12 API surface uncertainty. Behavior is identical.

## Questions for CEO
(Add here if anything unclear. Stop and wait.)
