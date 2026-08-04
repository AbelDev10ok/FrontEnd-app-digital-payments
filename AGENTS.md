# AGENTS.md - FrontEnd-app-digital-payments

SPA de cobros/ventas en React 18 + TypeScript + Vite. Consume un backend Spring Boot separado (repo: `App-cobros`) en `http://localhost:8080`.

## Commands

- `npm run dev` - dev server (Vite)
- `npm run build` - `vite build` only; does NOT typecheck
- `npm run lint` - `eslint .` (flat config `eslint.config.js`)
- Typecheck: `npx tsc -p tsconfig.app.json` (`noEmit` is set)
- No test framework, no formatter, no CI, no `.env` files.

**Package manager gotcha:** `package.json` declares `packageManager: pnpm@9.15.4`, but the repo only ships `package-lock.json` (no `pnpm-lock.yaml`). Use `npm`, not `pnpm`.

## Architecture

- Routing: React Router v7 (`react-router-dom`), all routes centralized in `src/App.tsx`.
- State: Zustand (`src/features/auth/store/authStore.ts`, persisted to localStorage under key `auth-store`).
- Styling: Tailwind CSS 3 + `lucide-react` icons. No UI component library.
- Feature folders under `src/features/*` (auth, clients, ventas, crearVentas, ventaDetalla, dashboard, adminPanel). Legacy flat dirs remain (`src/pages/`, `src/components/`, `src/hooks/`, `src/utils/`, `src/types/`) — feature folders are the target; migrate, don't extend legacy.
- Barrel exports via `index.ts` in feature/shared folders.

### Path aliases (verified in `vite.config.ts` + `tsconfig.app.json`)

`@/`, `@features/*`, `@shared/*`, `@infrastructure/*`, `@hooks/*`, `@utils/*`, `@types/*`.
**Gotcha:** `@config/*` and `@presentation/*` exist only in tsconfig, not in `vite.config.ts` — they will fail at build time. Don't use them. `@hooks/*` maps to `src/shared/hooks` (a separate `src/hooks/` dir also exists).

## Backend API conventions

- Base URL `http://localhost:8080` is hardcoded in `src/features/auth/services/authServices.ts`, `salesServices.ts`, and `clientServices.ts`. There is no env-based config; changing it means editing those files.
- Response envelope (unless noted): `{ message, status, data }` with `status === 'OK'`. Unwrap via `handleResponse` (see `salesServices.ts`) or check `response.ok && apiResponse.status === 'OK'`.
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
- `src/utils/apiClient.ts` (`ApiClient`) is dead code; do not use it.

## Reference docs (Spanish)

- `ARREGLOS.md` — known bugs fixed, refactor checklist, pending work.
- `src/ERRORES.md` — current open issues; keep it updated when fixing.
- `Readm.md` — stale exercise spec unrelated to this app; ignore.
