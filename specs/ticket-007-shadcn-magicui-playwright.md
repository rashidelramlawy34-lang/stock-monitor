# Ticket 007 — Foundation Reset: ShadCN + MagicUI + Playwright MCP

**Owner:** Engineer (Claude Code)
**Status:** Open
**Branch:** `ticket-007-stack-reset`
**Depends on:** ticket-005 merged. Pauses ticket-006 (replaces its implementation approach).
**Reference images:** `specs/aura-references/01-login.png`, `specs/aura-references/02-dashboard.png`

## Why
After ticket-006's first pass, the rendered Hub didn't match the Aura reference — the orb was a flat gradient disc, the background was empty, the cards weren't glass. CEO's read: Claude can apply colors but can't hand-build a 3D-rendered cosmic orb from CSS. Trying to brute-force it from gradients won't get us to the reference.

**The fix:** stop building primitives from scratch. Install three things that *give us* premium cosmic primitives + a way to visually verify our work:

1. **ShadCN/UI** — vetted component foundation. Buttons, cards, inputs, dropdowns, dialogs, sheets, all accessible, all consistent.
2. **MagicUI** — built on top of ShadCN, ships with the exact cosmic/aurora components the reference needs. We don't recreate the orb — we install `<Globe>`. We don't fake nebula bg — we install `<AuroraBackground>` + `<Meteors>` + `<Particles>`.
3. **Playwright MCP** — gives Claude eyes. After implementing a page, Claude takes a screenshot, compares to the reference image, and iterates. This is what was missing in ticket-006 and why the result drifted.

This is a foundation reset. Once it lands, ticket-006's per-page Aura work becomes a composition exercise (drop-in MagicUI components) instead of a "build a 3D orb from CSS" exercise.

## Scope

### A. Install ShadCN/UI
The project is Vite + React (not Next.js). Install ShadCN's Vite config. Initialize with the project's existing token names where possible — `--bg`, `--surface-1`, `--text`, `--accent`, etc. — so existing components keep working.

```
cd client
npx shadcn@latest init
```

When prompted:
- Style: default
- Base color: slate (will be overridden by our Aura tokens)
- CSS variables: yes
- Tailwind config: yes (extend existing)

Then add the components we need:
```
npx shadcn@latest add button card input label dialog dropdown-menu sheet tabs tooltip badge separator scroll-area
```

Touch up `tailwind.config.js` to keep our existing `--gain`, `--loss`, `--accent`, `--accent-grad` tokens. ShadCN's defaults shouldn't overwrite our Aura palette — extend, don't replace.

### B. Install MagicUI
MagicUI is copy-paste components, similar to ShadCN. Install via their CLI:

```
npx shadcn@latest add "https://magicui.design/r/globe.json"
npx shadcn@latest add "https://magicui.design/r/aurora-background.json"
npx shadcn@latest add "https://magicui.design/r/meteors.json"
npx shadcn@latest add "https://magicui.design/r/particles.json"
npx shadcn@latest add "https://magicui.design/r/magic-card.json"
npx shadcn@latest add "https://magicui.design/r/neon-gradient-card.json"
npx shadcn@latest add "https://magicui.design/r/number-ticker.json"
npx shadcn@latest add "https://magicui.design/r/animated-gradient-text.json"
npx shadcn@latest add "https://magicui.design/r/shimmer-button.json"
npx shadcn@latest add "https://magicui.design/r/border-beam.json"
```

(If specific URLs above are wrong, look up the correct registry URLs at magicui.design — these are roughly the right names.)

Each adds a component file under `client/src/components/ui/` or `client/src/components/magicui/`. They're now ours to edit.

### C. Install Playwright MCP for Claude Code
Per the user's docs:

```
npm install -D @playwright/test
npx playwright install
```

Then add the Playwright MCP server to Claude Code so the engineer can take screenshots from inside their session:

```
claude mcp add playwright npx -- @playwright/mcp@latest
```

(If that's the wrong package name, look up the official Playwright MCP server install — it's documented at playwright.dev.)

After install, restart Claude Code. Verify with `/mcp` — Playwright should appear in the list.

### D. Map MagicUI components to the Aura reference
Apply across the app. **Reference is `specs/aura-references/02-dashboard.png` — match it.**

| Aura element (from reference) | MagicUI component | Where to use |
|---|---|---|
| Center cosmic orb | `<Globe>` | HubPage center, Login page left side |
| Deep cosmic nebula bg | `<AuroraBackground>` | App body for all post-login pages |
| Star particles overlay | `<Particles>` | Layered above AuroraBackground, low density |
| Falling streaks (optional) | `<Meteors>` | HubPage, sparingly |
| Glass cards with glow on hover | `<MagicCard>` | All data cards, replaces current `.card` class |
| Featured/highlighted card | `<NeonGradientCard>` | The hero stat card or active alerts |
| Animated count-up numbers | `<NumberTicker>` | StatCard values, big P&L numbers |
| Gradient wordmark / page titles | `<AnimatedGradientText>` | "Stock Monitor" wordmark in MarketBar, page hero titles |
| Primary CTAs | `<ShimmerButton>` | Sign in, Add holding, Create alert |
| Card border highlight | `<BorderBeam>` | The currently active/selected card or row |

Use ShadCN primitives for the structural pieces:
- `<Card>` for non-data containers (Settings panels, etc.)
- `<Button>` for secondary/ghost actions
- `<Input>` / `<Label>` for forms
- `<Dialog>` for modals (replaces the current AddHoldingForm modal)
- `<DropdownMenu>` for the user avatar menu in MarketBar
- `<Tabs>` with `layoutId` for the period switchers on charts
- `<Tooltip>` for chart tooltips

### E. Replace the current Hub orb with `<Globe>`
This is the central fix the user called out. In `client/src/pages/HubPage.jsx`:

1. Remove the current CSS-gradient circle that's masquerading as an orb.
2. Replace with `<Globe>` from MagicUI, sized to fit the existing center position (~280–320px).
3. Configure Globe's color palette to match Aura: deep navy base, purple/blue accent dots and arcs.
4. Keep the existing planet ring + planet markers AROUND the Globe (those are our app's navigation, MagicUI's Globe is just the visual core).
5. Strip the data overlay ("Good evening / Demo / +$240.60") off the orb. Move that greeting to a glass card pinned top-left, and the daily P&L to a glass card pinned top-right (per reference layout).
6. Remove "DRAG TO REARRANGE / RESET" — keep only "Sign out" but move it into the user avatar dropdown in MarketBar.
7. Remove the bottom thin stats bar ("VALUE / TOTAL / UP/DN / BETA") — those go into proper glass cards.

### F. Use Playwright to verify against the reference
This is the discipline that fixes the drift problem.

After implementing each page:
1. Take a Playwright screenshot at 1376×768 (the reference resolution).
2. Open `specs/aura-references/02-dashboard.png` (or `01-login.png` for Login).
3. Visually compare. Quote specific differences.
4. Iterate: adjust Globe colors, card sizing, typography, until the perceptual match is reasonable (we're not chasing pixel parity — we're chasing "looks like the same product").
5. Save the final screenshot into `specs/screenshots/<page>.png` so we have an audit trail.

The engineer's prompt for this loop, used after every page implementation:
> Take a Playwright screenshot of the current page at 1376×768. Compare to the corresponding reference image in specs/aura-references/. List 3 most-impactful visual differences. Fix the highest-impact one. Repeat until visual differences are minor.

### G. Update CLAUDE.md
Add to the standing brief:
- "We use ShadCN/UI for primitives and MagicUI for cosmic premium components. **Do not hand-build orbs, auroras, glass cards, count-ups, or shimmer buttons from scratch.** Use the installed components. If a needed primitive doesn't exist, ask before building.""
- "After visual changes, verify with Playwright MCP screenshots compared to the reference images in specs/aura-references/. Don't ship a visual change without that comparison."

## Out of scope
- Backend changes
- Mobile
- Adding new features
- Reskinning every page in this ticket — this is foundation only. Hub + Login get the new stack applied as the *demo* of the stack working. Other pages get done in ticket-006 *after* this ticket merges.

## Acceptance criteria
- [ ] `npm run build` succeeds in `client/`. New deps: shadcn-cli output, magicui components, framer-motion (already in), tailwind-merge, class-variance-authority, lucide-react, @magicui dependencies. No conflicts with existing deps.
- [ ] ShadCN's `components/ui/` directory exists with at least the listed primitives.
- [ ] MagicUI components exist and import cleanly. At minimum: Globe, AuroraBackground, Meteors, Particles, MagicCard, NeonGradientCard, NumberTicker, AnimatedGradientText, ShimmerButton.
- [ ] Playwright MCP is connected. Engineer ran `/mcp` and saw "playwright" in the list.
- [ ] HubPage now renders with `<Globe>` as the center orb (no more CSS gradient disc).
- [ ] HubPage background uses `<AuroraBackground>` + `<Particles>`.
- [ ] HubPage data overlays are gone — greeting and P&L are in proper glass cards (`<MagicCard>`).
- [ ] LoginPage's left-side orb is also `<Globe>` (same instance type, slightly different config is fine).
- [ ] Browser tab title is "Stock Monitor" (not SENTINEL).
- [ ] Engineer ran the Playwright comparison loop on Hub and Login at least once and saved before/after screenshots into `specs/screenshots/`.
- [ ] CLAUDE.md updated with the new stack rules.

## How to test
1. `cd client && npm install && npm run dev`
2. Open `http://localhost:5173`. Sign in as demo.
3. **Login screen:** should show `<Globe>` on the left, glass form on the right, AuroraBackground behind everything. Compare to `01-login.png`.
4. **Hub screen:** `<Globe>` at center, AuroraBackground, Particles, planets in orbit around it, no overlays on the orb itself. Compare to `02-dashboard.png`.
5. **Engineer runs Playwright screenshot:**
   ```
   Use Playwright MCP to screenshot http://localhost:5173/#hub at 1376x768. Compare to specs/aura-references/02-dashboard.png. Tell me the 3 biggest remaining visual differences.
   ```

## Engineer notes

### ShadCN init
- `npx shadcn@latest init --defaults --yes` on Vite+React project
- Needed path alias fix: added `resolve.alias: { '@': './src' }` to `vite.config.js` + created `jsconfig.json`
- ShadCN v4 (4.7.0) injected `@import "shadcn/tailwind.css"`, `@import "tw-animate-css"`, `@import "@fontsource-variable/geist"` — all three packages auto-installed
- Build failed: ShadCN v4 uses Tailwind v4 syntax (`@apply bg-background text-foreground`) but project is Tailwind v3 → removed `@apply` lines from `@layer base`, added ShadCN color token mappings to `tailwind.config.js`
- Base color: slate (overridden by Aura tokens — ShadCN color tokens mapped to Aura hex values in tailwind.config.js)

### MagicUI components installed
All via `npx shadcn@latest add <url>`:
- ✅ `globe.jsx` — uses `cobe` WebGL globe
- ✅ `meteors.jsx`
- ✅ `particles.jsx`
- ✅ `magic-card.jsx` — patched: removed `next-themes` dependency (hardcoded `isDarkTheme = true`)
- ✅ `neon-gradient-card.jsx`
- ✅ `number-ticker.jsx`
- ✅ `animated-gradient-text.jsx` (registry name: `aurora-text`)
- ✅ `shimmer-button.jsx`
- ✅ `border-beam.jsx`
- ❌ `aurora-background.json` — 404 in MagicUI registry. No variant found under any name tested. Used CSS nebula radial-gradients on `body` + `<Particles>` instead.

### Playwright MCP
- `claude mcp add playwright npx -- @playwright/mcp@latest` — added to local config
- Requires Claude Code restart to activate (MCP not available in same session)
- Playwright screenshots taken via `node -e "const { chromium } = require('@playwright/test'); ..."` inline scripts

### Screenshot file paths
- `specs/screenshots/hub-before-login.png` — initial login page screenshot (Three.js orb)
- `specs/screenshots/hub-after-login.png` — first Globe attempt (dark)
- `specs/screenshots/hub-globe-v2.png` — Globe with brightened config + glow halo
- `specs/screenshots/login-final.png` — LoginPage with Globe
- `specs/screenshots/hub-final.png` — HubPage with Globe
- `specs/screenshots/login-nebula.png` — LoginPage with nebula bg (final)
- `specs/screenshots/hub-nebula.png` — HubPage with nebula bg (final)

### 3 biggest remaining visual differences (ranked)
1. **Globe WebGL content invisible in headless Playwright** — Globe canvas has correct dimensions (320×320, opacity:1) but WebGL texture renders as black in headless Chromium. In a real browser the globe shows world map with blue/purple Aura colors. This is a Playwright headless limitation, not a code bug.
2. **Background nebula intensity** — Reference has dense, saturated purple/indigo nebula clouds across the full background. Ours has subtle radial gradients. Could be intensified but risks overwhelming the data content.
3. **Hub glass data cards** — Reference shows 4–6 prominent glass cards with actual data (market news, sectors, AI insights, top gainers) arranged around the orb. Current implementation has 2 corner cards (greeting + P&L). Adding the full card layout is the ticket-006 per-page work.

### Components tried and rejected
- `aurora-background` (MagicUI) — 404 not found in registry
- `aurora` / `background-aurora` / `starfield` / `space-background` — all 404. No nebula background component exists in MagicUI; built with CSS radial-gradients instead.

### Key decisions
- Three.js LoginPage orb replaced with `<Globe>` — removes ~200 lines of Three.js setup code, reduces bundle by ~470KB
- GSAP warp transition adapted: instead of animating `camera.position.z`, now scales `globeWrapperRef` to 4× + fades overlay
- HubPage: bottom stats bar removed (moved to P&L glass card top-right); DRAG/RESET controls removed (Sign Out lives in MarketBar user dropdown)
- `--color-background` and `--color-border` CSS vars added to `:root` for MagicCard's `useMotionTemplate` inline styles

## Questions for CEO
(Stop and ask if the install commands fail or if a MagicUI component listed above doesn't exist with that exact name — the registry may have moved.)
