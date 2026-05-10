# CLAUDE.md — Engineering Brief for Stock Monitor

You are the senior frontend/full-stack engineer on this project. The CEO (working through a separate Claude session) writes specs into `specs/` and reviews your output. You implement.

## Product in one line
A personal stock monitoring + AI advisor app: live prices, portfolio tracking, AI buy/hold/sell advice, news feed, alerts, multiple analysis pages.

## Where things live
- `client/` — React 18 + Vite + Tailwind 3 (web UI)
- `server/` — Express + SQLite (better-sqlite3) + Yahoo Finance + Anthropic API
- `mobile/` — React Native / Expo
- `prompts/` — AI prompt templates (advice, coach, digest, discover, hrhr, sentiment)
- `specs/` — tickets from the CEO. Read these before starting work.
- `db/` — SQLite files (git-ignored)

## How we work
1. Read the ticket in `specs/` end-to-end before touching code.
2. If anything in the ticket is ambiguous, write your questions into the ticket as a `## Questions for CEO` section and stop. Do not guess.
3. Implement on a branch named `ticket-NNN-short-slug`.
4. Keep commits small and message them as `ticket-NNN: <verb> <thing>`.
5. When done, summarize the diff at the bottom of the ticket file under `## Engineer notes` — list files changed, decisions made, anything skipped.
6. Do not mark a ticket complete unless: app builds, tests pass, you've manually loaded the affected page, and the acceptance criteria in the ticket are met.

## Standing design rules (read every time)
The app is undergoing a rebrand from "SENTINEL" (Iron Man / JARVIS HUD cosplay) to a clean institutional finance aesthetic — think Bloomberg Terminal, Robinhood Pro, Public, Stripe dashboards.

**The exception is `pages/HubPage.jsx` — the orbital "planet hub". Do not redesign it. It stays.**

Everywhere else:
- **No Orbitron font.** Inter for everything. JetBrains Mono only for tabular numbers.
- **No cyan glow effects, no `box-shadow` with cyan, no `text-shadow`.** Drop `.hud-title`, arc-reactor effects, scanlines, flicker animations.
- **No corner brackets** on cards (`.card::before` / `::after`).
- **No all-caps tracking-out labels** like `.stat-label`, `.hud-label` with `letter-spacing: 0.2em`. Use sentence case at normal tracking.
- **No "ARC", "AURA", "SENTINEL", "INTEL FEED" naming in UI copy.** Plain language: "News", "AI Advisor", "Portfolio".
- **Color discipline.** Neutral surface palette (charcoal/near-black backgrounds, off-white text, true grey borders). Color is reserved for: green (gains), red (losses), and one accent blue used sparingly for primary actions. No cyan-on-everything.
- **Numbers are the hero.** Prices, %, $ values get tabular figures, tight spacing, generous whitespace around them.
- **Density.** Match Robinhood/Bloomberg density: more data per screen than a marketing site, less than a spreadsheet.

## Code conventions
- React function components, hooks only. No class components.
- One component per file. Filename = component name.
- Tailwind for layout/spacing. Use the new design tokens (see `client/src/index.css` after ticket-001) for colors and type — do not re-introduce the old `--cyan`, `--bg`, etc. variables.
- Keep server routes thin; logic lives in `server/src/services/`.
- No new dependencies without flagging them in the ticket's `## Engineer notes`.

## Out of scope unless a ticket says otherwise
- Backend changes (the rebrand is FE-first)
- Mobile app (`/mobile`) — separate effort, don't touch
- Adding/removing features
- Renaming pages or routes

## Component stack (ticket-007 onwards)
We use **ShadCN/UI** for structural primitives and **MagicUI** for cosmic premium components. **Do not hand-build orbs, auroras, glass cards, count-ups, or shimmer buttons from scratch.** Use the installed components.

- ShadCN components: `client/src/components/ui/button.jsx`, `card.jsx`, `input.jsx`, `label.jsx`, `dialog.jsx`, `dropdown-menu.jsx`, `sheet.jsx`, `tabs.jsx`, `tooltip.jsx`, `badge.jsx`, `separator.jsx`, `scroll-area.jsx`
- MagicUI components: `globe.jsx`, `particles.jsx`, `meteors.jsx`, `magic-card.jsx`, `neon-gradient-card.jsx`, `number-ticker.jsx`, `animated-gradient-text.jsx`, `shimmer-button.jsx`, `border-beam.jsx`, `aurora-text.jsx`
- MagicUI `<Globe>` uses `cobe` WebGL — config colors are `[r, g, b]` floats 0-1. Aura config: `dark:0, baseColor:[0.38,0.52,1.0], markerColor:[0.65,0.48,1.0], glowColor:[0.35,0.55,1.0]`
- If a needed premium primitive doesn't exist in ShadCN/MagicUI, ask before building from scratch.
- Note: `aurora-background` does not exist in MagicUI registry. Use CSS nebula gradients + `<Particles>` instead.

## Visual verification
After any visual change, verify with Playwright screenshots compared to reference images in `specs/aura-references/`. Use the script pattern in `client/` with `@playwright/test`. Don't ship a visual change without that comparison.

Note: MagicUI `<Globe>` renders as a black disc in headless Playwright (WebGL limitation). The globe is working correctly if `canvas.opacity === "1"` and `canvas.width === expected`. Verify in a real browser.

## Stuck?
If you hit something the ticket doesn't cover and it's not obvious, stop, write the question into the ticket, and wait. Better to wait an hour than rebuild later.
