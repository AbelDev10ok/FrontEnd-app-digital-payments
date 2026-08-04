# MEJORAS.md - Backlog de pendientes

Documento de trabajo para no olvidar las mejoras pendientes. Marcá con ✅ lo terminado.
Referencias con `archivo:línea` verificadas contra el código actual.

## ✅ Fase 3 — Pulido con primitivos + perf (skills `vercel-react-best-practices` + `frontend-design`)

- [x] **3.1 Badge primitivo aplicado**: `VentaDetalle.tsx` (`STATUS_BADGE_CONFIG` ahora `{tone, label}` con `<Badge tone=...>`), `SaleStatusBadge.tsx` (reescrito con Badge; COMPLETED=success, CANCELED=neutral, A_COBRAR=danger, default=warning), `ClientResumenFinansas.tsx` (estado `<Badge tone={deudaTotal>0?'warning':'success'}>`). **Bug preexistente arreglado en `ClientTable.tsx`**: la celda "estado" mostraba la **dirección** del cliente con badge verde — ahora es texto plano con `data-label="Dirección"`.
- [x] **3.2 PageHeader aplicado**: `HeaderClientes` (título + "Nuevo Cliente"), `TransactionHeader`, `HeaderTransaction` (título + "Crear Venta"), `CrearCliente` y `EditarCliente` (back arrow en `actions`). Alert primitivo en bloques error/éxito de `CrearCliente`, `EditarCliente` y `ClienteDetalle`. **Bug visual preexistente**: `CrearCliente`/`EditarCliente` renderizaban éxito/error como `<div>` a página completa sin layout → ahora dentro de `DashboardLayout` con `Alert`.
- [x] **3.3 Input/Select primitivos**: `Input` y `Select` ganan prop `invalid` (borde/ring rojo). `InputWithIcon`/`SelectWithIcon` reescritos con `Field` + `Input`/`Select` (elimina el string de clases duplicado). Migrados: `SalesFilters` (DebouncedInput→clases base, selects→`Select`, date→`Input`), `FilterCliente`, `ModalPay`, `PosponedFeeModal`, select de `SaleForm`. `inputBaseClass` exportado desde `Input.tsx` y usado por `DebouncedInput` (fuente única de estilos).
- [x] **3.4 Dead code**: `VentasACobrar.tsx` ya no existía (eliminado en F0 con `src/components/`); `MEJORAS.md:44` quedó desactualizado → corregido.
- [x] **3.5 Perf**: `useSalesFilters` — `setYear`/`setMonth` envueltos en `useCallback` (antes arrows nuevas por render rompían el `memo(SalesFilters)`). Verificado que `useClients` no tiene useEffect y que los `deps` de `usePaginatedSales`/`usePaginatedClients` son primitivos/estables (`productTypes` viene de `useState`).
- [x] **3.6 Verificación**: `npx tsc -p tsconfig.app.json` limpio, `npm run lint` 0 errores, `npm test` **58/58**, `npm run build` OK (chunks por ruta, `Select`/`Badge`/`PageHeader`/`Input` ahora en chunks compartidos).

## ✅ Fase 2 — Diseño (skills `frontend-design` + decisiones de usuario)

**Dirección aprobada**: color primario único **emerald/teal financiero** (`brand`), tipografía **stack del sistema** (sin Google Fonts), primitivos UI compartidos, **signature = StatCard** (card con franja de acento superior + chip de icono), resto disciplinado.

- [x] **2.1 Token system** en `tailwind.config.js`: paleta `brand` (emerald-teal custom, 50..950), `rounded-card`/`rounded-input`, `shadow-card`/`shadow-card-hover`, `fontFamily.sans` (stack sistema). Antes `extend: {}` vacío.
- [x] **2.2 Primitivos UI** en `src/shared/components/ui/` (barrel `index.ts` con re-exports explícitos): `Button` (primary/secondary/ghost/danger, sizes, `isLoading`), `Card`, `StatCard` (signature, tones brand/success/warning/danger/neutral), `Field`, `Input`, `Select`, `Badge`, `Alert`, `PageHeader`.
- [x] **2.3 Bugs arreglados**: `index.html` `lang="en"`→`"es"` y título en español; clases rotas `text-green-600'}` en `StateDetalleTransaction.tsx:81,86` (reescrito con StatCard); focus ring verde en `ModalPay`/`SalesFilters`/`SaleForm`/`VentaDetalle` → `brand`. **Sweep de color**: `indigo-*`/`purple-*`/`blue-*`/`cyan-*` → `brand-*`; `green-*` éxito → `emerald-*`; `green-*` acciones/focus → `brand-*`. **0 residuos** de indigo/purple/blue/green (verificado con grep).
- [x] **2.4 Duplicaciones eliminadas**: `ClientEstadoFinansa..tsx` (nombre corrupto con doble punto, dead code) renombrado a `ClientEstadoFinansa.tsx` y reescrito con StatCard; `ClientResumenFinansas.tsx` reescrito con Card (agrega fila "Total Histórico"); **ClienteDetalle** ahora los reusa en vez de duplicar el markup. **EditarVenta** reusa `SaleForm` (era dead code con 0 importadores) vía nuevo prop `showFinancialFields=false` — solo muestra tipo+descripción porque el backend `updateSale` solo persiste `{productType, descriptionProduct}` (evita campos engañosos).
- [x] **2.5 Migración a primitivos**: Dashboard (6 StatCards + Card + Button, banner brand, spinner brand), AdminPanel (StatCards + Card), StateDetalleTransaction (6 StatCards), Login (Field/Button/Alert, brand). Eliminado `DashboardMetricCard.tsx` (huérfano).

⚠️ **Pendiente Fase 2**: no hay vista previa visual en este entorno (sin screenshot). Verificar en navegador: dashboard, login, detalle de venta/cliente y editar venta. El aplicado masivo de `PageHeader`/`Badge`/`Input`/`Select` en tablas/filtros se completó en la **Fase 3**.

## ✅ Fase 1 — Performance (skill `vercel-react-best-practices`)

- [x] **1.1 Lazy loading de rutas**: `React.lazy` + `<Suspense>` en `src/App.tsx`. 10 páginas lazy (Login queda eager), fallback `<Load />`. Build genera chunks por ruta.
- [x] **1.2 Validación derivada**: `src/features/crearVentas/hooks/useSaleForm.ts` — validación extraída a `validateForm(formData, displayedClients)` a nivel módulo; `errors` con `useMemo`; `isSubmittingDisabled = Object.keys(errors).length > 0` (sin `useEffect`); `handleSubmit` corta con `return false` si hay errores.
- [x] **1.3 Extraer JSX**: `SalesFilters.tsx` (`renderFilters()` → elemento `filters`); `VentaDetalle.tsx` (`getStatusIcon`/`getStatusBadge` a nivel módulo usando `STATUS_BADGE_CONFIG`, default PENDING). Duplicados internos eliminados.
- [x] **1.4 Imports directos**: 14 imports de barrels → rutas directas a módulos con default export (`DashboardLayout`, `Paginacion`, `Layout`, `DebouncedInput` named).
- [x] **1.5 `setState` funcional**: 7 toggles `setX(!x)` → `setX((prev) => !prev)` (Login, DashboardLayout, Sidebar×3, VentaDetalle, HeaderDetalleTransaction). ⚠️ En `FilterCliente`/`SalesFilters` NO se pudo: `setShowFilters`/`setShowCalendar` son props `(value: boolean) => void`, no setters.
- [x] **1.6 Hoistear constantes**: `useDashboardMetrics.ts` — `availableYears` y `months` pasan de `useMemo([])` a constantes de módulo (static). Eliminado `useMemo` del import.
- [x] **1.7 Versionado de stores persist**: `authStore` (`auth-store`) y `salesFilterStore` (`sales-filters-storage`) con `version: 1` + `migrate` no-op. Cierra el esquema para migraciones futuras.
- [x] **1.8 ErrorMessage como JSX**: `ModalPay.tsx` — `ErrorMessage({ message: error })` → `<ErrorMessage message={error} />`; borrado bloque muerto comentado de abajo.

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
- [x] **Limpiar `App.tsx`**: eliminados imports y ruta comentados (`VentasACobrar`, `cobrar-hoy`). `VentasACobrar.tsx` ya no existía al llegar a Fase 3 (eliminado en F0 junto a `src/components/`).
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

Vitest + React Testing Library + jest-dom + user-event, entorno jsdom. Config en `vitest.config.ts`, setup en `src/test/setupTests.ts`. **58 tests, 14 archivos, todos pasando.** ⚠️ jsdom fijado en **26.x** (`package.json`): jsdom 27 trae `cssstyle@5` → `@asamuzakjp/css-color@4` que usa `require()` de un ESM (roto en Node 20.18).

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
