# Feature: Modo oscuro (SPA FrontEnd-app-digital-payments)

Add a dark theme to the whole SPA (landing, auth, dashboard) as a user-switchable mode.
Branch: `feature/modo-oscuro` (cut from `main` @ 7ec751f). Delivery strategy: `auto-chain` + chain `feature-branch-chain`; work-unit commits of ~400 authored changed lines on the feature branch. Test runner: `npm test` (Vest + RTL), typecheck `npx tsc -p tsconfig.app.json`, lint `npm run lint`, build `npm run build`.

## Specs

- **S1.** User request verbatim: "agrega modo oscuro a la app" — The SPA has a dark mode covering the whole app (landing, auth pages, dashboard), switchable by the user at runtime.
- **S2.** (assumption) The switch lives in the top bars (`Header` of the dashboard shell and `PublicHeader` of the landing), as a sun/moon icon button with Spanish `aria-label` ("Cambiar a modo oscuro" / "Cambiar a modo claro"), and toggles between light and dark.
- **S3.** (assumption) The preference persists in `localStorage` under key `theme` (`'light' | 'dark'`). With no stored preference the app follows `prefers-color-scheme` and keeps following it live. An inline script in `index.html` applies the theme before first paint (no flash).
- **S4.** (assumption) Light mode does not change visually: every dark-theme token's light value is byte-identical to the hex it replaces (audit: token table 1:1 + light-mode screenshots vs baseline).
- **S5.** (assumption) The printable remito keeps printing on white paper with dark ink even in dark mode (`@media print` resets the theme variables to light values). On screen the remito stays a light paper document (`.theme-light` scope).
- **S6.** (assumption) Dark mode meets WCAG AA contrast: text ≥ 4.5:1, non-text ≥ 3:1 (craft floor).
- **S7.** Docs: `DESIGN.md` documents the dark world (palette, on-brand panel rule, print rule) and the token/class mapping.

## Architecture (implementation truth)

- Theming is CSS-variable backed: `src/index.css` declares light values in `:root, .theme-light`, dark values in `html.dark`, and resets to light inside `@media print`. Variables are space-separated RGB triplets consumed from `tailwind.config.js` as `rgb(var(--c-x) / <alpha-value>)`, so opacity modifiers keep working.
- Var-backed (flip wholesale, zero component edits): `gray` 50–900, `brand` 50/100/200/600/700/800/900, `red`/`emerald`/`amber`/`purple` 50–300 + 600–900.
- Literal (never flip): `white`, `black`, `gray-950` (modal scrims), `brand` 300/400/500/950, hue steps 400/500 (status dots/solids keep their contrast in both modes).
- New fixed tokens: `surface` (cards/inputs), `page` (app canvas), `heading` (page headings/amounts — replaces `text-brand-950`), `action`/`action-hover` (primary buttons — replaces `bg-brand-600`/`hover:bg-brand-700`), `danger-solid`/`danger-solid-hover` (danger button), `on-dark` (translucent white overlays on dark panels).
- Context rule: `.bg-brand-950` (deep-green brand panel) re-scopes `--c-brand-100`/`--c-brand-200` to their light mint values, so mint text on brand panels keeps its palette in both themes. This rule exists so the dark theme never edits files carrying uncommitted work (see Log L2).
- Class rename map (bulk regex over the tree, then manual exceptions):
  1. `bg-white` -> `bg-surface` (incl. `print:`, `md:`, `max-md:`, `after:`, `/85` variants; the `@media print` var reset keeps paper white).
  2. `via-white` -> `via-surface`, `to-white` -> `to-surface` (login/register/landing washes flip with the world).
  3. `text-brand-950` -> `text-heading` (44 usages).
  4. `bg-brand-600` -> `bg-action` (any variant prefix: `hover:`, `group-hover:`), `hover:bg-brand-700` -> `hover:bg-action-hover`.
  5. `bg-white/5` -> `bg-on-dark/5`, `bg-white/10` -> `bg-on-dark/10`, `border-white/10` -> `border-on-dark/10` (Landing glass cards on the dark testimonial band).
  6. `Button.tsx` danger variant: `bg-red-600` -> `bg-danger-solid`, `hover:bg-red-700` -> `hover:bg-danger-solid-hover` (white text keeps 4.5:1 in both modes).
  7. Page canvases: `min-h-screen bg-gray-50` -> `min-h-screen bg-page` (DashboardLayout, ErrorBoundary).
  8. `RemitoVenta.tsx`: add `theme-light` to each root (S5).
- Browser surfaces themed from the palette (craft floor): `::selection`, `caret-color`, `accent-color`, `scrollbar-color`, `color-scheme`.
- Theme runtime: `src/shared/hooks/useTheme.ts` (Zustand store + `initTheme()` called from `src/main.tsx`), `ThemeToggle` component in `src/shared/components/ui/`.

## Tasks

- **T1** Core: index.css variables + tailwind tokens + index.html anti-flash script + `useTheme` + `ThemeToggle` + Header/PublicHeader integration + DESIGN.md dark section + `useTheme` tests (RED -> GREEN). Route: inline. Covers: S2, S3, S5, S7. Status: pending.
- **T2** Class sweep: rename map applied tree-wide + manual exceptions (glass overlays, Button danger, page canvases, remito scope). Route: inline (bulk + targeted edits). Covers: S1, S4. Status: pending.
- **T3** Audit + checks: grep audit (no leftover unflipped classes, no stray hex), `npm test`, `tsc`, `lint`, `build`, impeccable detector, light/dark screenshots of landing + login. Covers: S4, S6. Status: pending.
- **T4** Independent verifier (Risk item 6: visual regressions are not caught by unit tests) over the feature diff with baseline comparison. Covers: S4, S6. Status: pending.

## Log

- **L1** (2026-11-02) User request verbatim: "agrega modo oscuro a la app".
- **L2** (2026-11-02) Worktree state at start: `main` is ahead 1 of origin and carries complete-but-uncommitted work from the previous session (dashboard catalog metrics: `Dashboard.tsx`, `useDashboardMetrics.ts`, `shared/types/dashboard.ts`, `CategoryBreakdownList.tsx`, `TopProductsList.tsx`, tests, `AGENTS.md`). Per the recorded session summary, committing it is the user's decision. The dark-mode rename map is designed to touch **none** of those files: `Dashboard.tsx`'s `bg-brand-950`/`text-brand-100` stay literal, and the `.bg-brand-950` context rule (instead of renaming `text-brand-100`) keeps `TopProductsList.tsx`/`TopClientsList.tsx` untouched. My work-unit commits stage only my paths.
- **L3** (2026-11-02) Dark-world design decision (Operate mode, brand "Libro de caja vivo"): page is a deep green-tinted charcoal (#0e1613), cards #17221d, mint-tinted ink (#e9efec body, #e4f3ea headings), brand accent lightens to #4cb98a, primary buttons keep brand green (white text stays 4.7:1), deep-green brand panels keep their identity, status tints become low-lightness hue surfaces with lightened hue ink.
