# MEJORAS.md - Backlog de pendientes

Documento de trabajo para no olvidar las mejoras pendientes. Marcá con ✅ lo terminado.
Referencias con `archivo:línea` verificadas contra el código actual.

## ✅ Hecho (prioridad alta)

- [x] **Bug `refresh()` en hooks de paginación**: `setPage(p => p)` no disparaba recarga. Arreglado con `refreshKey` en `usePaginatedSales.ts` y `usePaginatedClients.ts`.
- [x] **URL del backend centralizada**: nuevo `src/shared/config/api.ts` (`API_BASE_URL`, `AUTH_API_URL`, `CLIENTS_API_URL`, `LOANS_API_URL`, `PRODUCT_TYPES_API_URL`). Quitados todos los `http://localhost:8080` hardcodeados de `authServices.ts`, `salesServices.ts`, `clientServices.ts`.
- [x] **Envelope unificado**: nuevo `src/shared/utils/http.ts` con `handleResponse<T>` y `getErrorMessage(response, fallback)`. Deduplicado el patrón de error en `clientServices.ts`. ⚠️ La API mezcla formatos a propósito: envelope en `/api/loans*`, `/api/clients/stats`, auth (register/verify) y auth-login. Devuelven raw: clientes, vendedores, product-types y **refresh-token** (`{accessToken, refreshToken}` directo). NO usar `handleResponse` en endpoints raw.

## Prioridad media

- [x] **Limpiar `console.log` de debug**: eliminados todos los activos (~35). Quedan solo `console.error` en catch legítimos y algunos `// console.log` comentados (inertes, se pueden borrar después).
- [x] **Eliminar dead code** (verificado: sin importers):
  - `src/utils/apiClient.ts` (`ApiClient` + `apiClient`) — además arregló 2 errores de lint (`any`)
  - `src/components/filters/FeesFilters.tsx` y `src/hooks/useFeesFilters.ts`
  - Métodos de `salesService` sin uso real: `getProductDescriptions` (`/search-by-description`), `getFeesDue` (`/delayed-fees`) y `getFeesDueOn` (`/fees-to-charge-today`) — los dos primeros endpoints NO existen en el backend (verificado); `getFeesDueOn` solo lo usaba el hook legacy `useSales.ts`.
  - Página legacy `src/pages/ventas/Ventas.tsx` (ruta `/dashboard/ventas` en `App.tsx`, comentario "AUN NO LO ESTOY UTILIZANDO") y el hook huérfano `src/features/ventas/hooks/useSales.ts`. Directorio `src/pages/ventas/` eliminado.
- [x] **Alias rotos en `tsconfig.app.json`**: quitados `@config/*` y `@presentation/*`.
- [x] **Limpiar `App.tsx`**: eliminados imports y ruta comentados (`VentasACobrar`, `cobrar-hoy`). ⏳ Pendiente decidir qué hacer con `VentasACobrar.tsx` (todo comentado, sin ruta).
- [x] **Migración a feature folders terminada**: `src/types/*` movido a `src/shared/types/` (`client.ts`, `dashboard.ts`, `sales.ts` + barrel `index.ts`). Imports actualizados a `@/shared/types/*` (se intentó con `@types/*` pero TS reserva ese prefijo para paquetes de tipos ambientales → `TS6137`, ver `AGENTS.md`). Arreglados imports relativos legacy que apuntaban a `src/types` (`useClients.ts`, `useClientsFilters.ts`, `usePaginatedClients.ts`, `useSalesFilters.ts`, `AutocompleteSeller.tsx`). Alias `@types/*` eliminado de `tsconfig.app.json`/`vite.config.ts`/`vitest.config.ts`. Directorios legacy `src/pages/`, `src/components/`, `src/hooks/`, `src/utils/` y `src/types/` eliminados. `src/pages/ventas/Ventas.tsx` era dead code con data de endpoint inexistente → eliminada. Migrar, no extender.

## Prioridad baja

- [x] **12 errores de typecheck pre-existentes** → **todos arreglados** (`npx tsc -p tsconfig.app.json` limpio):
  - `InfoCliente.tsx:62` — `vendedor` → `client.seller` (el backend envía `isSeller` → `seller`)
  - `useProductTypes.ts:2` — `ProductTypeDto` importado desde `@/types/sales`
  - `useSales.ts:66,77` — `markFeeAsPaid`/`postponeFee` ahora matchean las firmas del servicio
  - `salesServices.ts` — `unknown 'e'` en 4 catch con guard `instanceof Error`; `saleId` → `_saleId`
  - `Ventas.tsx:63,68` — `daysLate` no viene del backend: helper local `getDaysLate(transaction)`
  - `ProtectedRoute.tsx:40` — `cloneElement(children as React.ReactElement<any>, ...)`
- [x] **Tipar `any`**: `authServices.ts` — tipos `LoginResponse`/`RefreshTokenResponse` y `ApiResponse<LoginResponse>` (adiós `any`). `ProtectedRoute.tsx` y legacy `Ventas.tsx` mantienen disable solo por sus `any` propios.
- [x] **ErrorBoundary global** para errores de render: nuevo `src/shared/ErrorBoundary.tsx` (fallback con "Reintentar" y "Recargar página"), montado en `main.tsx` envolviendo `<App />`. Hoy cada página maneja sus errores de fetch por separado; este captura errores de render.
- [x] **Lint restante**: `EditarVenta.tsx:85` (eliminado `@ts-ignore`, el guard `!id` ya la hacía innecesaria), `formatCurrency.ts:8` (`catch {`), `DebouncedInput.tsx:1` (eslint-disable stale eliminado). Lint: **0 errores, 0 warnings** (el warning de `useSales.ts:102` desapareció al eliminar el hook legacy).

## 🐛 Bug extra encontrado y arreglado

- [x] **`refreshToken()` siempre fallaba**: el backend devuelve `/auth/refresh-token` **raw** (`{accessToken, refreshToken}`), pero el frontend validaba `status === 'OK'` (envelope) → en éxito tiraba error y terminaba en logout. Ahora `authServices.ts` devuelve el cuerpo directo cuando `response.ok`. Esto afectaba el refresh automático de `TokenRefreshHandler` y el retry de `authenticatedFetch`.

## Tests ✅

Vitest + React Testing Library + jest-dom + user-event, entorno jsdom. Config en `vitest.config.ts`, setup en `src/test/setupTests.ts`. **56 tests, 13 archivos, todos pasando.** ⚠️ jsdom fijado en **26.x** (`package.json`): jsdom 27 trae `cssstyle@5` → `@asamuzakjp/css-color@4` que usa `require()` de un ESM (roto en Node 20.18).

- [x] **Setup**: `vitest.config.ts`, `src/test/setupTests.ts` (jest-dom + cleanup), scripts `npm test` / `npm run test:watch`.
- [x] **Lógica pura / stores**: `authStore` (login/logout/setTokens/rol desde JWT/persistencia `auth-store`), `salesFilterStore` (filtro año/mes + sessionStorage), `formatCurrency`, `authServices` (`login` envelope, `refreshToken` raw, `authenticatedFetch` Bearer + retry 401 + logout si falla refresh).
- [x] **Componentes**: `SaleStatusBadge` (COMPLETED/CANCELED/A_COBRAR/ACTIVE), `Login` (validación email/password, errores y envío), `Paginacion`, `Modal` (backdrop vs contenido), `DebouncedInput` (debounce con fake timers).
- [x] **Hooks**: `usePaginatedSales` / `usePaginatedClients` (loading/error/data, `setPage` y el nuevo `refresh`).
- [x] **Rutas**: `App` con `BrowserRouter` real — `/dashboard/ventas/crear` y `/todas` NO caen en la ruta dinámica `:id`; redirect a `/login` sin sesión. `ProtectedRoute` (redirect por auth y por rol, inyección de `user`/`onLogout`).

## Cómo verificar

- Typecheck: `npx tsc -p tsconfig.app.json`
- Lint: `npm run lint`
- Tests: `npm test` (run) / `npm run test:watch`
- Build: `npm run build` (Vite; NO hace typecheck)
