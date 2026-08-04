# AGENTS.md - FrontEnd-app-digital-payments

SPA de cobros/ventas en React 18 + TypeScript + Vite. Consume un backend Spring Boot separado (repo: `App-cobros`) en `http://localhost:8080`.

## Commands

- `npm run dev` - dev server (Vite)
- `npm run build` - `vite build` only; does NOT typecheck
- `npm run lint` - `eslint .` (flat config `eslint.config.js`)
- `npm test` / `npm run test:watch` - Vitest + React Testing Library (config `vitest.config.ts`, setup `src/test/setupTests.ts`)
- Typecheck: `npx tsc -p tsconfig.app.json` (`noEmit` is set) — also typechecks `*.test.*` files under `src`
- No formatter, no CI, no `.env` files.

**Package manager gotcha:** `package.json` declares `packageManager: pnpm@9.15.4`, but the repo only ships `package-lock.json` (no `pnpm-lock.yaml`). Use `npm`, not `pnpm`.

**jsdom gotcha:** keep `jsdom` on **26.x**. jsdom 27 pulls `cssstyle@5` → `@asamuzakjp/css-color@4`, which `require()`s an ESM and crashes on Node < 20.19 (this repo uses 20.18).

## Architecture

- Routing: React Router v7 (`react-router-dom`), all routes centralized in `src/App.tsx`.
- State: Zustand (`src/features/auth/store/authStore.ts`, persisted to localStorage under key `auth-store`).
- Styling: Tailwind CSS 3 + `lucide-react` icons. No UI component library.
- Feature folders under `src/features/*` (auth, clients, ventas, crearVentas, ventaDetalla, dashboard, adminPanel). No hay dirs flat legacy (eliminados `src/pages/`, `src/components/`, `src/hooks/`, `src/utils/`, `src/types/`); los tipos compartidos viven en `src/shared/types/`.
- Barrel exports via `index.ts` in feature/shared folders.

### Path aliases (verified in `vite.config.ts` + `tsconfig.app.json`)

`@/`, `@features/*`, `@shared/*`, `@infrastructure/*`, `@hooks/*`, `@utils/*`.
**Gotcha:** `@config/*` and `@presentation/*` exist only in tsconfig, not in `vite.config.ts` — they will fail at build time. Don't use them. `@hooks/*` maps to `src/shared/hooks`. Types compartidos viven en `src/shared/types/` (client/dashboard/sales) e se importan vía `@/shared/types/*` — NO usar un alias `@types/*`: `@types` es un prefijo reservado de TypeScript para paquetes de tipos ambientales y cualquier import a `@types/...` falla con `TS6137`.

## Backend API conventions

- Base URL `http://localhost:8080` is centralized in `src/shared/config/api.ts` (`AUTH_API_URL`, `CLIENTS_API_URL`, `LOANS_API_URL`, `PRODUCT_TYPES_API_URL`). All services must import from there, never hardcode the host.
- Response envelope (unless noted): `{ message, status, data }` with `status === 'OK'`. Unwrap via `handleResponse` (see `src/shared/utils/http.ts`); `getErrorMessage` extracts the message from non-OK responses. Enveloped: loans/stats, clients/stats, auth-register/verify y auth-login. Raw (sin envelope): clients, sellers, product-types y **refresh-token** (`{ accessToken, refreshToken }` directo).
- Auth endpoints: `/auth/login`, `/auth/refresh-token` (no `/api` prefix). Domain endpoints: `/api/loans`, `/api/clients`, `/api/product-types`, etc.
- Dates are sent as `YYYY-MM-DD` strings.
- Pagination uses a Spring-style `Page<T>` DTO (`content`, `totalPages`, `totalElements`, `page` is 0-indexed) — see `Page<T>` in `salesServices.ts` and the `usePaginatedSales`/`usePaginatedClients` hooks.

## Auth & roles

- JWT access/refresh tokens; role is decoded from the JWT `authorities` claim in `authStore.ts`.
- `authenticatedFetch` (in `authServices.ts`) adds the Bearer header, retries once after a 401 with a refreshed token, and logs out + redirects to `/login` if refresh fails. All services must use it.
- `TokenRefreshHandler` (mounted once in `App.tsx`) refreshes every 4 min and on tab focus.
- Roles: `ROLE_ADMIN` → `/admin`, `ROLE_USER` → `/dashboard`. `ProtectedRoute` handles role-based redirects and injects `user`/`onLogout` props.
- **Route order matters** in `App.tsx`: static ventas routes (`/todas`, `/crear`, `/editar/:id`) must be declared before the dynamic `/dashboard/ventas/:id`.

## Conventions

- **Spanish** for all user-facing text, error messages, comments, and git commit messages.
- Envelope statuses from the backend: `COMPLETED`, `ACTIVE`, `CANCELED`. The UI hardcodes display of `A_COBRAR` (see `src/ERRORES.md`) because the backend never returns it.
- eslint `react-refresh/only-export-components` warns when a component file exports non-components — export the component and hooks separately.

## Reference docs (Spanish)

- `MEJORAS.md` — backlog de mejoras pendientes y plan de tests; mark items as done there.
- `src/ERRORES.md` — current open issues; keep it updated when fixing.
