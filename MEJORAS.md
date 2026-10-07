# MEJORAS — Backlog y plan de tests

## Fase 4 — SEO + Seguridad

### Bloque A — SEO ✅ (frontend)
- `index.html`: meta description, `robots noindex, nofollow`, `theme-color`, favicon real (`public/favicon.svg`, reemplaza el `/vite.svg` que no existía).
- `public/robots.txt`: `Disallow: /`.
- `document.title` por pestaña en `DashboardLayout` (`{título} · Gestión de Cobros y Ventas`) y en `Login`.
- Verificado: `<h1>` único por página (PageHeader).

> Nota (Fase 13): el bloqueo global de robots se invirtió para las rutas públicas de la landing; ver Fase 13 más abajo.

### Bloque B — Frontend: alinear con la rotación de refresh token del backend ✅
- **Fix rotación retenida**: `authenticatedFetch` guardaba el refresh token viejo tras refrescar; con la rotación server-side, el siguiente refresh fallaba → logout espurio. Ahora persiste `refreshResult.refreshToken`.
- **Single-flight del refresh**: dedupe por token de la promesa de refresh; evita que peticiones concurrentes con 401 roten el mismo token (el backend rechaza el reuso).
- **Logout server-side best-effort**: `authStore.logout()` llama `POST /auth/logout` con el refresh token actual; errores de red ignorados, el estado local siempre se limpia.
- **API por entorno**: `api.ts` usa `import.meta.env.VITE_API_URL ?? 'http://localhost:8080'`; `VITE_API_URL` tipada en `src/vite-env.d.ts` y documentada en `.env.example`.

### Bloque C — Coordinación backend (pendiente en repo App-cobros)
- **CORS dev**: el default del backend es `http://localhost:5173`. Si Vite levanta en 5174 (puerto ocupado), las peticiones son bloqueadas → agregar el origen a `app.cors.allowed-origins` (o usar wildcard `http://localhost:[*]`).
- **CSP + HSTS** faltan en `SecurityHeadersFilter`. Snippet propuesto:

```java
// HSTS solo tiene efecto con TLS (proxy reverso delante)
if (request.isSecure()) {
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}
response.setHeader("Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
    + "font-src 'self'; connect-src 'self' http://localhost:5173 http://localhost:8080; "
    + "script-src 'self'");
```

- **trust-proxy**: setear `true` cuando haya un proxy reverso delante (rate limit por IP real).

### Plan de tests (frontend)
- Ejecutar: `npx tsc -p tsconfig.app.json && npm run lint && npm run build && npm test`.
- Tests agregados: refresh token rotado se persiste, single-flight (2 peticiones concurrentes → 1 refresh), `logout` POST a `/auth/logout` y manejo de error de red, store llama al backend en logout.
- Candidatos a tests futuros: `document.title` en layouts, verificación de `<h1>` único.

## Fase 5 — Corrección de bugs de filtro de ventas y Dashboard

### Frontend ✅
- **Filtro "A cobrar"**: el fetcher de `TodasVentas` enviaba `status=A_COBRAR`, que el backend no puede parsear (`SaleStatus` solo acepta `ACTIVE/COMPLETED/CANCELED`) → error 400. Ahora envía `aCobrar=true` (parámetro soportado por `getAllVentasPaginacion`).
- `salesService`: `getAllSalesPaginated` acepta `aCobrar?: boolean` y lo agrega al query.
- **Dashboard**: endpoint cambiado de `/stats` a `/dashboard`; `DashboardStatsDto` (frontend) reescrito para coincidir con el DTO del backend (`resumen`, `anual`, `serie12Meses`, `topClientes`, `porTipoProducto`, `clientes`).
- `SalesStatusBreakdown`: el chip "Reembolsos" ahora muestra moneda (`formatCurrency`), no un conteo.
- `getSalesStats` eliminado (sin usos restantes).

### Backend (repo App-cobros) ✅
- `pendientePorCobrar` ahora es por mes/año (`sumRemainingAmountByStatusAndMonthYear(ACTIVE, year, month)`); antes era global de todos los tiempos → números erróneos al cambiar de mes.
- `findOverdueFees` cambia de `expirationDate < :date` a `<= :date` para ser consistente con el filtro `aCobrar` (hoy cuenta como vencido).
- `totalVentas` (mensual y anual) ahora incluye canceladas: `completadas + pendientes + canceladas`; antes excluía canceladas y no coincidía con la suma de chips.
- Compilado con `mvnw.cmd -q compile -o`; **requiere reiniciar el backend** para tomar los cambios.

### Tests (frontend) ✅
- `App.test.tsx` era flaky: renderizaba la App real con token falso → fetch real → 403 → refresh falla → logout → `TokenRefreshHandler` redirige a `/login` → la ruta nunca renderizaba.
- Fix: `vi.mock` de `salesService` y `clientService` (sin red) + timeout de `findAllByText` 5000ms bajo carga. Suite completa: **94/94 estable**.

## Fase 6 — Crash de TodasVentas por filtros nulos persistidos ✅

- **Bug**: `useSalesFilters.ts:20` tiraba `TypeError: Cannot read properties of null (reading 'toString')` → ErrorBoundary mostraba el mensaje rojo y no cargaba la lista. Causa raíz: `sessionStorage` guardaba `sales-filters-storage` con `{"year":null,"month":null}` (estado de una sesión vieja) y el merge shallow de zustand/persist pisaba los defaults con `null`.
- Fix (store `salesFilterStore.ts`): opción `merge` que sanitiza al rehidratar — valida `year` en [2000, 2100] y `month` en [1, 12]; cualquier valor inválido (incluido `null`) cae al año/mes actual.
- Fix (hook `useSalesFilters.ts`): defensa extra `(persistedYear ?? añoActual)` y `(persistedMonth ?? mesActual)`.
- Test agregado: rehidratación con `year/month = null` en sessionStorage → el store vuelve a año/mes actuales (usa `vi.resetModules` + import dinámico para forzar la rehidratación). Suite completa: **95/95 estable**, tsc y lint limpios.

## Fase 7 — Ampliación de tests: Dashboard y lógica de alto valor ✅

- `useDashboardMetrics`: `setYear`/`setMonth` cambian el filtro y vuelven a llamar al servicio con los nuevos params; `refresh()` re-llama con los mismos params.
- Sub-componentes del dashboard (unit directos): `MonthlyBarChart` (leyenda, etiquetas de mes, títulos con formato moneda, serie vacía), `AnnualSummary`, `OverdueFeesAlert` (singular/plural, estado cero → no renderiza), `SalesStatusBreakdown` (valores), `TopClientsList` (ranking + estado vacío).
- `Dashboard` página: cambiar los `<select>` de mes/año llama a `setMonth`/`setYear`; el botón "Actualizar" llama a `refresh`.
- `http.ts`: `handleResponse` (OK desenvuelve / no-OK lanza con `message` / sin `message` usa genérico) y `getErrorMessage` (JSON con `message`, body no-JSON → fallback).
- `salesService.getAllSalesPaginated`: construcción de query params (incluido `aCobrar=true` y la omisión de opcionales), unwrap del envelope, error del envelope no-OK; `getDashboardStats` incluye `year`/`month` en la URL.
- `useSalesFilters`: strings de año/mes con cero a la izquierda, `setYear`/`setMonth` persisten, `getFinalDate` (fecha específica vs `year-month`) y **regresión del null de la Fase 6**.
- `useTokenRefresh`: verifica al montar, cada 4 min (fake timers) y al volver a la pestaña visible; no verifica si está oculta.
- `TokenRefreshHandler`: redirige a `/login` al perder autenticación; no redirige si sigue autenticado ni si ya está en `/login`.
- `useClients`: `createClient` agrega a la lista y re-lanza con error seteado si falla; `updateClient` reemplaza por id.
- `useClientsFilters`: opciones iniciales (`Todos`/`Sin vendedor`), dedupe de vendedores por id, setters de filtros.
- `useProductTypes`: carga tipos + loading, y error si falla.
- `useSaleForm`: inicialización según tipo, errores del formulario vacío, `handleInputChange`, submit válido llama a `createSale` con el payload, submit con errores no llama, fallo de `createSale` → `false`, validación de cliente perteneciente al vendedor y autocompletado de vendedor por `sellerName`.
- `clientService`: query params de `getClientsPaginated` (incluida omisión de opcionales), endpoints de `getClientById`, `createClient` (POST + body serializado) y `getVendedoresConClientesAsignados`.
- Primitivas UI (unit): `Button`, `Input`, `Select`, `Field`, `Alert`, `Badge`, `PageHeader`, `Load`, `ErrorMessage`.
- Suite completa: **177/177 estable**, tsc y lint limpios.

### Pendientes (no implementados aún)
- **Páginas de integración** (requieren mock de hooks/services; fuera del alcance "solo unitarios"): `VentaDetalle` (`ModalPay`, `PosponedFeeModal`), `CrearTransaccion`, `EditarVenta`, `Clientes`, `ClienteDetalle`, `CrearCliente`, `EditarCliente`.
- **Pruebas de paginación end-to-end en página**: hoy `usePaginatedSales`/`usePaginatedClients` están cubiertos a nivel hook; falta verificar que `Paginacion` conecta `setPage` con la tabla en `TodasVentas`/`Clientes`.

## Fase 8 — Sidebar con filtros + búsqueda avanzada de ventas ✅

### Frontend
- **Sidebar reescrito**: marca "Gestión de Cobros y Ventas", secciones (Visión general / Gestión / Acciones rápidas), submenú Ventas (Nueva Venta, filtros de estado, Categoría) y Préstamos (Nuevo Préstamo, filtros de estado sin Categoría); `kind=PRESTAMO` se preserva en la URL.
- **Fix "Todas"**: el botón de estado "Todas" enviaba `?status=Todas` → 400 en el backend. Ahora `navigateToSales` descarta ese valor y navega sin `status`.
- **Badges de conteos**: los filtros de estado muestran conteos reales vía nuevo endpoint `GET /api/sales/counts`.
- **`DashboardLayout`**: pasa `onNavigate` al Sidebar para cerrarlo al navegar en móvil.
- **`SalesFilters` ampliado y reducido**: barra final con búsqueda por nombre cliente y por descripción de producto, año/mes, preset "Hoy" y "Limpiar filtros" (más modal móvil). Estado/categoría viven solo en el sidebar (vía URL); se descartaron por decisión de producto el rango de montos, la frecuencia, el orden y el calendario de fecha específica.
- **Búsqueda por descripción solo para ventas**: en modo préstamo (`kind=PRESTAMO`) el input se oculta (`isLoan`) y el fetcher no envía `descriptionProduct`; el valor escrito se conserva y reaparece al volver a ventas.
- **Fix auto-expansión del sidebar**: al navegar a préstamos (`/ventas/todas?kind=PRESTAMO`) ya no se abre también la sección Ventas (estado inicial y efecto de navegación, vía `isPrestamosView` con `useCallback`). Los inputs de búsqueda (nombre/descripción) ahora tienen `max-w-xs` en vez de estirarse a todo el ancho.
- **Fix "Limpiar filtros" en préstamos**: el reset conserva `kind` en la URL (antes borraba todo, incluido `kind=PRESTAMO`, y el listado pasaba a ventas). Ahora limpia status/categoría/búsquedas/fechas pero se queda en la vista de préstamos.
- **Fix auto-expansión excluyente**: al navegar a "Nueva Venta" (o Ver Ventas) se abre el menú Ventas y se cierra Préstamos; al navegar a "Nuevo Préstamo" (o Ver Préstamos) se abre Préstamos y se cierra Ventas (antes el efecto solo abría, dejando ambos submenús abiertos al cambiar de contexto). Se eliminaron "Ver Ventas" y "Ver Préstamos" de los submenús (redundantes con el filtro "Todas").
- **`TodasVentas`**: conecta los filtros, fetcher con guards de year/month/fecha específica, contador "X resultados"; "Limpiar filtros" además limpia los query params de la URL para que el sidebar quede desmarcado.
- **`useSalesFilters`**: devuelve `""` para year/month inválidos o nulos (habilita presets y limpiar).
- `usePaginatedSales` expone `totalElements`; `salesService` añade `typePayments`/`minAmount`/`maxAmount`/`sort` a `getAllSalesPaginated` y `getSalesCounts(kind?)`; nuevo `SalesCountsDto`.

### Backend (repo App-cobros) ✅
- `SalesCountsDto` (`total/active/completed/canceled/aCobrar`).
- `VentaServices`: `buildSalesSpecification` extraído y reutilizado en paginación y `getSalesCounts` (usa `countDistinct` por el join de `aCobrar`).
- `VentaController`: nuevo `GET /api/sales/counts` (declarado antes de `/{id}`) y parámetros `typePayments`, `minAmount`, `maxAmount` (sobre `priceTotal`) en la búsqueda paginada; `LegacyLoansController` sincronizado.
- Compilado con `mvnw.cmd -q compile -o`; **requiere reiniciar el backend** para tomar los cambios.

### Tests (frontend) ✅
- Suite completa: **210/210 estable**; tsc y lint limpios.
- `Sidebar`: submenús Ventas/Préstamos/Clientes (sin "Ver Ventas"/"Ver Préstamos", solo Nueva/Nuevo + filtros), Categoría solo en Ventas, navegación "Todas" sin `status` (fix), `status=A_COBRAR`, filtros de préstamos preservan `kind=PRESTAMO`, badges de conteos, auto-expansión excluyente según la URL, `onNavigate`.
- `salesServices`: params nuevos en la URL (`typePayments`, `minAmount`, `maxAmount`, `sort`), omisión de opcionales, `getSalesCounts` con y sin kind. (`typePayments`/`minAmount`/`maxAmount`/`sort` quedan soportados por el backend pero el frontend ya no los envía.)
- `SalesFilters` (nuevo): preset "Hoy", búsqueda por descripción (debounce), oculta la descripción con `isLoan`, y Limpiar filtros.
- `TodasVentas` (nuevo): `kind+status+productType` desde la URL, traducción `A_COBRAR`→`aCobrar=true`, búsqueda por descripción en la petición (omitida para préstamos), Limpiar filtros (incluida la URL, conservando `kind`), contador de resultados.
- Mocks de `getSalesCounts` añadidos a `App`, `Dashboard`, `DashboardLayout` y `Sidebar`.

## Fase 9 — Headers dinámicos (Ventas vs Préstamos) y eliminación de duplicados ✅

### Frontend
- **Títulos dinámicos según tipo**: el header bar y los títulos de contenido ahora diferencian Ventas de Préstamos:
  - `TodasVentas`: "Todas las Ventas" / "Todos los Préstamos" según `selectedKind` en URL.
  - `CrearTransaccion`: "Nueva Venta" / "Nuevo Préstamo" según prop `type`.
  - `VentaDetalle`: loading/error dicen "Detalle"; éxito dice "Préstamo #id" / "Venta #id" (ya existía).
  - `EditarVenta`: "Editar Venta #id" / "Editar Préstamo #id" según `sale.kind`.
- **Eliminación de título duplicado**: el `<h1>` de la barra superior (`Header.tsx`) es la fuente única del título; se quitó el `<h1>` de los headers de contenido:
  - `HeaderTransaction`: solo muestra subtítulo + icono + botón de acción.
  - `TransactionHeader`: solo muestra subtítulo + icono + enlace volver.
  - `HeaderDetalleTransaction`: solo muestra descripción + menú acciones (se quitó `<h2>` y el icono `Package`).
  - `PageHeader`: `title` ahora es opcional; no renderiza `<h1>` si no se pasa.
- **Categoría eliminada de Préstamos**: el submenu de Categoría (`renderCategoryFilter`) solo se muestra en Ventas, no en Préstamos.
- **`TransactionHeader`**: acepta `type`, usa subtítulo dinámico ("Crear nueva venta" / "Crear nuevo préstamo") y enlace volver condicional a la vista correspondiente.
- **`HeaderTransaction`**: acepta `isLoan`, cambia icono (ShoppingCart/HandCoins), subtítulo y botón ("Crear Venta" / "Nuevo Préstamo") con link a la ruta correcta.
- **Fix reset del formulario al cambiar Venta/Préstamo en CrearTransaccion**: `useSaleForm` ahora resetea el formulario vía `useEffect` cuando cambia `initialType` (React Router reutiliza la instancia del componente al navegar entre `/dashboard/ventas/crear` y `/dashboard/prestamos/crear`, y `useState` ignora el valor inicial en renders posteriores).

### Tests (frontend) ✅
- Suite completa: **210/210 estable**; tsc y lint limpios.
- `App.test.tsx`: assertion actualizada de "Nueva Transacción" → "Nueva Venta".

## Fase 10 — Quitar "Canceladas" y "Reembolsos" de la UI ✅

### Motivación
- El backend calcula `resumen.canceladas` y `resumen.reembolsos`, pero **no existe endpoint para cancelar ventas ni registrar reembolsos** (solo `PUT /complete/{saleId}`), por lo que ambos valores siempre son `0`.

### Frontend
- **`SalesStatusBreakdown`**: solo muestra Completadas y Pendientes (grid 2 columnas; se quitó la lógica de formato moneda).
- **`useDashboardMetrics`**: `SalesStatusSummary` ya no incluye `canceladas` ni `reembolsos`.
- **Sidebar**: eliminado el filtro "Canceladas" (`CANCELED`) de los filtros de estado de ventas.
- **Sin tocar**: `src/shared/types/dashboard.ts` (`DashboardResumen` conserva ambos campos porque el backend sí los devuelve), `SaleStatusBadge` (render defensivo ante estado `CANCELED`), backend.

### Tests (frontend) ✅
- Suite: **209/209**; tsc y lint limpios. Se eliminó el test "formatea los reembolsos como moneda"; ajustados mocks/asserts en `Dashboard.test.tsx`, `DashboardComponents.test.tsx`, `useDashboardMetrics.test.ts` y `Sidebar.test.tsx`.

## Fase 13 — Landing pública (SaaS, parte 1) ✅

Implementa la Fase 13 de `SAAS.md` (landing + SEO público). El registro con nombre de negocio queda para la Fase 11 (requiere multi-tenancy en backend); mientras tanto todos los CTA apuntan a `/login`.

### Frontend
- **Nueva feature `src/features/landing/`**:
  - `PublicHeader` (sticky, blur): logo "Cobros&Ventas", nav de anclas (`Funciones`, `Cómo funciona`, `Preguntas`) + link `Precios`, botones Entrar/Probar la app.
  - `PublicFooter`: enlaces legales (Términos, Privacidad, Precios) y © dinámico.
  - `CronogramaDemo`: elemento distintivo del hero — el cronograma de cuotas del producto como libreta/ticket (estados pagada/vencida/próxima, montos tabulares, separadores punteados, animación staggered respetando `motion-reduce`).
  - `Landing` (`/`): hero ("Dejá de anotar las cuotas a mano"), funciones reales de la app, cómo funciona (3 pasos numerados), banda oscura Ventas/Préstamos (modelo real del dominio), FAQ con `<details>` nativos, CTA final.
  - `Precios` (`/precios`): plan único `$15.000/mes` (**precio placeholder** hasta definirlo con MercadoPago en la Fase 12; constante `PRECIO_PLAN_MENSUAL`), qué incluye, FAQ breve.
  - `Terminos` (`/terminos`) y `Privacidad` (`/privacidad`): borradores legales razonables a revisar antes del lanzamiento.
- **SEO invertido solo para rutas públicas**: `index.html` ya no trae `noindex` global ni `robots.txt Disallow: /`; ahora `robots.txt` permite `/` y bloquea `/dashboard`, `/admin`, `/login`. Las vistas privadas vuelven a inyectar `<meta name="robots" content="noindex">` dinámicamente vía nuevo hook `useNoIndex` (`src/shared/hooks/useNoIndex.ts`), usado en `DashboardLayout` y `Login`.
- **Tipografía display**: Google Fonts **Archivo** (foundry Omnibus-Type, Argentina) como `font-display` para títulos de landing; el body sigue con el stack system.
- **Rutas**: `/` ya no redirige según sesión (ahora es la landing pública); agregadas `/precios`, `/terminos`, `/privacidad`; el catch-all `*` lleva a la landing. `useAuthStore` dejó de ser necesario en `App.tsx`.

### Tests (frontend) ✅
- Suite: **218/218**; tsc, lint y `vite build` limpios (Landing code-split, ~13 kB gzip).
- Nuevos: `Landing.test.tsx` (hero/CTAs, funciones, cronograma demo con estados, FAQ, footer legal) y `Precios.test.tsx` (plan único, precio, CTA).
- `App.test.tsx`: el test de ruta raíz ahora verifica que `/` sin sesión muestra la landing, y se agregó verificación de `/login`.

### Pendiente (fases siguientes)
- Formulario de registro con nombre de negocio → Fase 11 (backend multi-tenant).
- Cambiar CTAs de "Probar la app"/"Empezar ahora" a trial real de 14 días cuando exista billing (Fase 12).
- Definir precio final (`PRECIO_PLAN_MENSUAL`) antes del deploy.

## Fase 13b — Cronograma de cuotas estilo ticket en el detalle de venta ✅

Porta el lenguaje visual del `CronogramaDemo` de la landing al cronograma real (`CronogramaFees`, usado por `VentaDetalle`). Antes era una tabla plana que solo distinguía Pagada/Pendiente — las cuotas vencidas eran invisibles.

### Estados visuales (5, calculados client-side)
Nuevo util puro **`src/features/ventaDetalle/utils/feeVisualState.ts`**: `getFeeVisualState(fee, todayIso)` y `getFeeListStates(fees, todayIso)`.
- Comparación de fechas por string `YYYY-MM-DD` (formato del backend) → sin desfases de zona horaria; el día exacto de vencimiento aún NO cuenta como vencida.
- Precedencia: pagada > vencida > pospuesta > próxima/pendiente. Una cuota pospuesta que vuelve a vencer se muestra como vencida. "Próxima" = primera futura impaga de la lista.
- `getTodayIso()` genera la fecha local sin depender de `toISOString()` (evita corrimientos UTC).

### UI
- La tabla se reemplazó por filas estilo libreta/ticket: icono por estado (`CheckCircle2`/`AlertTriangle`/`CalendarClock`/`CircleDashed`/`Circle`), badge de color, monto tabular monoespaciado, separadores punteados, fila de vencidas con tinte rojo y sublínea "Pagado el {fecha}" (incluye monto pagado parcial si difiere).
- Header con barra de progreso de cobro: "Cobrado $X de $Y" (`priceTotal − remainingAmount`) + "N de M cuotas cobradas" (`paidFeesCount`/`totalFees`), `<progress role>` accesible.
- Acciones intactas: botones cobrar (solo en cuotas impagas) y posponer conservan `ModalPay` y `PosponedFeeModal`; ahora con `aria-label` ("Marcar cuota N como pagada", "Posponer cuota N") e icono de carga mientras procesa.
- `VentaDetalle.tsx`: eliminados los helpers `getStatusIcon`/`getStatusBadge` y sus imports (quedaron sin uso).

### Tests ✅
- Suite: **236/236**; tsc, lint y build limpios.
- Nuevos: `feeVisualState.test.ts` (9 casos: 5 estados, borde de fecha exacta, pospuesta-vencida de nuevo, próxima en lista) y `CronogramaFees.test.tsx` (7 casos: barra/progreso, badges, tinte de vencida, fecha de pago, botón cobrar solo en impagas, modal de posponer, vacío). El test del componente fija la hora del sistema (`vi.setSystemTime`) para estados deterministas.

## Fase 11 — Multi-tenancy por negocio (backend) + registro de cuentas ✅

Cada usuario registrado ahora pertenece a un **negocio** (tenant). Clientes, ventas, cuotas y categorías quedan aislados por `business_id`: dos negocios nunca ven sus datos mutuamente, ni en listados ni accediendo por ID.

### Backend (repo App-cobros)
- Migración **`V5__add_business_tenancy.sql`**: tabla `business`, fila por defecto ('Mi Negocio', ARS), columnas + FKs `business_id` en `usuario/client/sale/fee/product_type` con backfill al negocio default, y unicidades re-scoped: `dni` ahora es única **por negocio** (antes global), igual que el `name` de categoría.
- Aislamiento por **Hibernate `@Filter("tenantFilter")`** declarado una vez en `models/package-info.java`. `TenantContext` (ThreadLocal) guarda el negocio resuelto de la DB tras validar el JWT (`JwtValidationFilter`) y se limpia en `finally`; la activación del filtro por request vive en **`TenantFilterInterceptor`** (capa MVC — ver corrección más abajo). El filtro cubre JPQL y queries derivadas.
- Accesos por ID: como `findById()` no pasa por filtros, todo servicio valida con **`TenantGuard.verificar(businessId)`** → responde 400 "Recurso no encontrado" genérico si el recurso es de otro negocio. Un businessId nulo se tolera (datos legados/tests); la verificación estricta aplica solo con entidad tenada.
- JWT de acceso incluye claim `businessId` (la fuente de verdad sigue siendo la DB).
- **Registro transaccional** (`POST /auth/register`): crea Business (nombre opcional `nombreNegocio`, default 'Mi Negocio', moneda ARS) + usuario ROLE_USER + catálogo inicial de categorías (TV, CELULAR, MUEBLERIA, RELOJ, OTRO, ELECTRODOMESTICO, ROPA, HERRAMIENTA).
- Servicios scopeados: DNI/email/categoría únicos **por negocio**, toda entidad nueva se crea con su negocio, y guards en get/update/delete de clientes, ventas, cuotas y categorías.

### Frontend
- Nuevo `register(email, password, nombreNegocio?)` en `authServices.ts` (envelope estándar; no devuelve tokens: exige verificar correo).
- Nueva página **`Register.tsx`** (ruta pública `/register`): nombre de negocio opcional, email y contraseña ≥8; estado de éxito con CTA a `/login`; link cruzado desde Login-style UI. Validación custom con `noValidate` en el form (la constraint validation nativa de `type=email` bloqueaba submits con emails no-ASCII).
- CTAs del landing apuntan a registro: hero "Probar la app", header "Probar la app" y Precios "Empezar ahora" → `/register`.

### Tests ✅
- Backend: **39 tests, 0 fallos** (`mvnw test -o`; el skip es el test de contexto con Docker, preexistente). Actualizados constructores/mocks y `TenantContext` en tests de servicios.
- Frontend: suite **243/243** (+7: `Register.test.tsx` ×6 y ruta `/register` en `App.test.tsx`); hrefs de CTAs actualizados en `Landing.test`/`Precios.test`. tsc, lint y build limpios.

### Notas de operación
- **Reiniciar el backend** para aplicar la migración V5 (`ddl-auto=validate` exige que entidades y migración coincidan exactamente).
- Los usuarios existentes quedan en el negocio default; el aislamiento real empieza con cada nuevo registro.

### Corrección post-release: unicidades globales residuales bloqueaban el registro ✅
**Bug**: al crear una cuenta nueva, el seed del catálogo fallaba con `DataIntegrityViolationException: Ya existe la llave (name)=(TV)`.
- Causa: además de las constraints estándar (`product_type_name_key`, `client_dni_key`) que V5 sí dropeaba, el esquema histórico tenía **constraints autogeneradas por Hibernate** (nombres `uk_<hash>`) con unicidad global sobre `product_type(name)` y `client(dni)`. El `DROP CONSTRAINT IF EXISTS <nombre-estándar>` pasó de largo en silencio y la unicidad global siguió viva → dos negocios no podían tener la misma categoría ni el mismo DNI.
- Fix: migración **`V6__drop_stale_global_uniques.sql`** — bloque DO que dropea cualquier unique de una sola columna sobre `product_type(name)`/`client(dni)` consultando `pg_constraint`, sin depender del nombre. Idempotente; conserva las compuestas de V5 y la unicidad global de `usuario.email`.
- Verificado contra la BD local (psql): antes existían `ukbnu2aqss00w6he2vs4bmmy609 UNIQUE (name)` y `ukffgfxk34snifdqqbwtoq6pj37 UNIQUE (dni)`; después solo quedan `uk_product_type_business_name` / `uk_client_business_dni`. Insert simulado de 'TV' en un segundo negocio OK (rollback). Backend: 39/39 tests.
- Lección: al redefinir unicidades en migraciones, no asumir nombres generados por otros (Flyway vs Hibernate); dropear por *forma* de la constraint o listarlas antes (`pg_constraint`).

### Corrección post-release: el filtro `tenantFilter` no se aplicaba a las queries ✅
**Bug**: una cuenta nueva logueada veía las ventas/clientes del negocio default — el filtro Hibernate nunca afectaba a las queries reales.
- Causa: la activación estaba en `JwtValidationFilter` (cadena de seguridad), que corre **antes** de que exista la sesión del request: con OSIV on, el EM compartido aún no está ligado al hilo, y `entityManager.unwrap(Session)` resolvía una **sesión efímera desechable** donde se habilitaba el filtro. Las queries corrían después sobre la sesión real, sin filtro.
- Fix definitivo: **`TenantFilterInterceptor` extiende `OpenEntityManagerInViewInterceptor`** (WebRequestInterceptor) y se registra vía `addWebRequestInterceptor` en `WebConfig`. Su `preHandle` primero llama a `super.preHandle()` (garantiza el EM del request abierto/reusado, sin depender del orden de interceptors) y recién ahí habilita `tenantFilter` con el `businessId` de `TenantContext`. Al ser subclase de OSIV satisface el `@ConditionalOnMissingBean` de Boot → es la única instancia registrada; el ciclo de vida del EM sigue heredado (`afterCompletion` cierra). Fail-closed: si hay negocio autenticado y falla la activación, corta el request.
- `JwtValidationFilter` quedó solo con la responsabilidad de setear/limpiar `TenantContext` (sin `EntityManager`); `SecurityConfig` ya no lo inyecta.
- Verificación E2E (jar + JWTs firmados localmente): negocio 1 → 7 ventas / 3 clientes / sus categorías; negocio nuevo → **0 ventas / 0 clientes / solo su catálogo** ('TV' duplicado entre negocios sin conflicto).
- Lecciones: (1) un filtro por-request debe activarse cuando la sesión del request existe — desde la cadena de seguridad es demasiado temprano; (2) el servidor de lenguaje de VSCode compila con ECJ dentro de `target/classes` y puede pisar la salida de javac con clases marcadas "Unresolved compilation problem": si el jar falla al arrancar con errores que no existen en el código, borrar los `.class` afectados y recompilar con Maven (javac).

## Unificación visual: la app interna adopta el lenguaje de la landing ✅

Dirección **"la libreta de cobros"**: blanco plano, verde de marca estricto, Archivo (`font-display`) en los títulos, eyebrows mayúsculas espaciadas, montos en mono tabular y secciones destacadas planas en `brand-950` — sin gradientes vivos dentro de la app.

### Fundaciones
- `index.css`: antialiasing base + `::selection` con verde de marca.
- `Button`: variantes alineadas a la landing (`primary` con sombra coloreada `shadow-brand-600/20`, `secondary` outline, `ghost`, `danger`) + nuevas `brandSoft`/`dangerOutline` para outlines tintados; foco con `focus-visible:outline` (patrón landing).
- `PageHeader`: nuevo prop `eyebrow` + títulos en `font-display font-extrabold tracking-tight text-brand-950`; chip de icono con borde brand.
- `StatCard`: label como micro-eyebrow uppercase y valor en `font-display`. `Badge`: `font-semibold`.
- `Modal`: overlay `bg-gray-950/50 backdrop-blur-sm`, panel `rounded-card shadow-xl`, título `font-display`. `Paginación`: estilo secondary + `tabular-nums`.
- Nuevo `src/shared/utils/statusUi.ts`: fuente única de verdad para el estado de ventas/cuotas (labels, tonos de Badge y dots); sidebar, badges y chips consumen de ahí.

### Shell
- `Sidebar`: logo plano `bg-brand-600`, nombre en `font-display text-brand-950`, separador punteado (ticket), section labels como eyebrows brand, nav unificada sin `border-r-2`, dots de estado desde `statusUi` (yellow → amber).
- `Header`: barra translúcida `bg-white/85 backdrop-blur border-gray-100` (como el header público), título `font-display`, avatar plano, "Salir" como acción quieta.
- `DashboardLayout`: glow radial decorativo del hero sobre el fondo. `AdminPanel` migrado del `Layout` legacy al shell con sidebar (`Layout.tsx` eliminado).

### Barrido por features (~35 archivos)
- Dashboard/AdminPanel: banners gradiente → secciones oscuras `bg-brand-950` con eyebrow `text-brand-300` y controles en vidrio (`border-white/10 bg-white/5`).
- Colores fuera de paleta eliminados: orange→amber, teal→brand, yellow→amber, green→emerald.
- Tablas (ventas/clientes): thead `bg-gray-50/80` con th en eyebrow 11px uppercase tracking-widest, filas `divide-gray-100`, hover suave.
- Montos/totales/IDs en `font-mono tabular-nums` (tablas, cronograma, resúmenes, KPIs).
- Botones hardcodeados (SubmitBar, ClienteDetalle, VentaDetalle, modales de pago/prórroga, filtros) migrados a `<Button>` con la variante correcta.
- Avatares/logos sin gradiente; radios por tokens (`rounded-card` / `rounded-xl` / `rounded-full`); sombras por tokens (`shadow-card` / `shadow-card-hover`).
- Auth (Login/Register): logo plano, títulos `font-display`, cards `rounded-card`, éxito en emerald.

### Tests
- Suite **243/243**; tsc/lint/build limpios. Ajustes: `AdminPanel.test` envuelve en `MemoryRouter` y mockea `getSalesCounts` (el shell ahora pide conteos al montar); `SaleStatusBadge` conserva el override "A Cobrar" con filtro activo vía `statusUi`.
- Fix de tipos: `SaleResponseDto.status` era `''` (literal vacío legado) → `string?`.

## Bloque crítico pre-Suscripción: Mi Negocio · Cobros de hoy · Cuotas · Suscripción ✅

Cuatro features nuevas que completan la operación diaria del cobrador antes de activar el cobro real de la suscripción (Fase 12). Decisiones: **sin mora/días de gracia en v1**, trial de 30 días para negocios existentes y nuevos **sin bloqueo todavía** (el gating llega con Fase 12), y cambio de contraseña **cierra las demás sesiones**.

### Backend (repo App-cobros)
- Migración **`V7__business_settings_and_plan.sql`**: en `business` agrega `default_interest_rate`, `default_payment_frequency` (SEMANAL/QUINCENAL/MENSUAL/CONTADO, nullable = sin default) y columnas de plan (`plan_status` default 'TRIAL', `trial_ends_at`, `subscription_until`). Backfill: trial hasta `created_at + 30 días`.
- **`BusinessController`/`BusinessServices`** (`GET|PUT /api/business/me`): datos del negocio propio + defaults + estado del plan. El id SIEMPRE sale de `TenantContext.requireBusinessId()` (jamás del request). Validación Bean Validation con `@IValueOfEnum(Payments)` para la frecuencia.
- **`UsuarioController`** (`PUT /api/usuarios/me/password`, deliberadamente FUERA del `permitAll` de `/auth/*`): valida contraseña actual con BCrypt, hashea la nueva y limpia `refreshToken` → las otras sesiones deben re-loguearse. Rechaza igualar la clave actual.
- **Cuotas globales**: `IFeeRepository` extiende `JpaSpecificationExecutor<Fee>` (+`@EntityGraph sale/client` para evitar N+1). `FeeQueryServices.getCuotas(...)` combina filtros por estado (`TODAY/DELAYED/UPCOMING/PENDING/PAID`; `POSTPONED` rechazado explícitamente: posponer ya mueve la fecha), rango de vencimiento y cliente; sort default `expirationDate ASC`. Endpoint `GET /api/loans/fees` devuelve `Page<CuotaListItemDto>` con monto "efectivo" (si la cuota no tiene monto fijado se usa `sale.amountFee`, mismo criterio del dashboard).
- **Cobros de hoy**: `GET /api/loans/collections/today` → resumen (cantidad+monto de HOY y VENCIDAS vía queries agregadas) + agenda ordenada por antigüedad (máx. 200). Cobrar sigue usando el endpoint existente `POST /collects-fee/{id}/pay` — cero lógica de pago nueva.
- `FeeStatus` extendido con `UPCOMING`/`PAID` (antes sin uso).

### Frontend
- Sidebar: secciones nuevas **Operación** (Cobros de hoy `/dashboard/cobros`, Cuotas `/dashboard/cuotas`) y **Configuración** (Mi Negocio `/dashboard/negocio`, Suscripción `/dashboard/suscripcion`). Rutas lazy bajo ProtectedRoute USER.
- `collectionsService.ts` (agenda + listado paginado) y `businessService.ts` (me/update/changePassword; extrae errores de validación campo-a-campo).
- **CobrosDeHoy**: chips de resumen + lista tipo ticket (dividers punteados) con cliente/teléfono, cuota X de Y, badge de estado (Vence hoy/Vencida · Nd/Próxima/Pagada), monto mono tabular y acciones Cobrar/ver venta. **PayFeeModal** compartido (monto+fecha, reusa `markFeeAsPaid`).
- **Cuotas**: tabla con select de estado, rango de fechas, limpiar filtros y `Paginación`; link a detalle de venta/cliente.
- **MiNegocio**: tres cards — datos del negocio, defaults de préstamos y cambio de contraseña (con aviso de cierre de sesiones).
- **Suscripcion**: ticket del plan (estado TRIAL/ACTIVE, días restantes, pagada hasta) + card "Pago automático próximamente" (CTA deshabilitado hasta Fase 12/MercadoPago).

### Tests ✅
- Backend: **53 tests, 0 fallos** (+14: `BusinessServicesTest`, `UsuarioChangePasswordTest`, `FeeQueryServicesTest` — mapeo/monto efectivo/estados, sort default vs enviado, resúmenes vacíos, POSTPONED).
- Frontend: suite **255/255** (+12: tests de las cuatro páginas con shell mockeado). tsc, lint y build limpios.
- Gotchas encontrados: `getByLabelText` falla con match exacto cuando el Field es `required` (el asterisco entra al texto) → usar regex; validar dentro de un `Specification` no es testeable con repo mockeado (el lambda no corre) → la guardia va antes de armar el spec.

### Verificación E2E (jar + JWTs firmados, BD local)
- Flyway aplicó V7; backfill correcto (ambos negocios TRIAL con trial_ends_at = creación+30d).
- `GET/PUT /api/business/me` persiste y valida frecuencia inválida con 400; `GET /api/loans/fees?status=PENDING` → negocio 1: 6 pendientes (5 DELAYED con días de atraso); agenda de hoy: 0 hoy / 5 vencidas, ordenadas por antigüedad; password con clave incorrecta → 400 sin mutar datos.
- Aislamiento intacto: negocio 9 ve **0** cuotas/agenda vacía. Defaults de prueba restaurados a NULL tras el test.

## Design-system: `src/shared/theme.ts` (tokens semánticos) ✅

Segunda capa del sistema de diseño (Opción B): los estilos semánticos que seguían hardcodeados se centralizan en `src/shared/theme.ts` como constantes de clases Tailwind. Decisiones cerradas: **"Pagada" = emerald** (no brand) y **fondos de badge/chip en `-50`** (no `-100`).

### Tokens (`src/shared/theme.ts`)
- `neutral`: `primary`(gray-900) / `body`(gray-700) / `secondary`(gray-600) / `muted`(gray-500) / `subtle`(gray-400).
- `neutralBg`: `soft`(gray-50) / `hover` / `tableHeader`(`bg-gray-50/80`, respeta el thead del barrido visual).
- `tones.{brand,success,warning,danger,neutral}`: `bg`(-50) / `accent`(-500) / `text`(-700) / `textStrong` / `icon`(-600) / `border`(-200). `tonePaid` = success (emerald).
- `eyebrow.{section,table,hero}` (11px/11px/12px uppercase tracking-widest) y `heading.{xl,lg}` (font-display extrabold brand-950).
- `radius.{card,input,md,pill}`.

### Migración (12 componentes)
- Shared UI: `Badge`, `Alert`, `StatCard`, `PageHeader`, `Modal` consumen tones/eyebrow/heading/neutral/radius; el badge conserva el `ring-*` (se deriva de `tones.*.border`).
- Features: `CuotaEstadoBadge` (Paid→success), `SalesStatusBreakdown` (**-100 → -50**, decisión aplicada), `CronogramaDemo` (Pagada brand→emerald; vencida/próxima -100→-50; row vencida conserva `/70`), `CronogramaFees` (STATE_CONFIG pagada→success, badges -100→-50, neutros), `SaleTable`/`ClientTable` (thead→`neutralBg.tableHeader`, th→`eyebrow.table`), `Suscripcion` (badges de estado→tones, neutros). La sección oscura `bg-brand-950` y los acentos brand se dejan como marca (no son tokens).

### Tests ✅
- Suite **264/265** (único fallo: `App.test.tsx` ruta `/dashboard/ventas/todas`, pre-existente, pasa en aislamiento — timeout en suite completa). tsc, lint y build limpios.

## Catálogo de productos ✅

Cada negocio administra su propio catálogo de productos (respeta la tenancy). La API mantiene el producto como asociación opcional, pero el flujo actual de creación de ventas requiere elegir uno del catálogo; el precio del catálogo autocompleta el costo. El stock es opcional y solo se usa para descontar/restaurar existencias cuando está informado y alcanza.

### Backend (repo App-cobros)
- Migración `V8__add_product_catalog.sql`: tabla `product` (`name` NOT NULL, `price` NUMERIC(38,2) nullable, `product_type_id` FK nullable, `business_id` FK, `UNIQUE(business_id, name)`) + `sale.product_id` FK nullable.
- Entidad `Product` con `@Filter("tenantFilter")` (mismo patrón que `ProductType`), `IProductRepository`, `ProductDto {id, name, price, productTypeId, productTypeName}`.
- `ProductServices`: `createProduct` (trim, conserva mayúsculas para que la descripción autocompletada se vea natural; único por negocio; valida tenant de la categoría), `deleteProduct` (protegido si lo usan ventas no canceladas vía `ISaleRepository.findByProductIdAndStatusNot`), `getAllProducts` (filtro tenancy).
- `ProductController` `/api/products` (`GET /all`, `POST /`, `DELETE /{id}`, `@PreAuthorize ROLE_USER`).
- `Sale.product` (ManyToOne LAZY nullable) en `createVenta` y `updateSale` (resolución + `TenantGuard`; en update, `product` null → se limpia, por eso el frontend de edición envía el producto actual). `SaleResponseDto.product` mapeado en `SaleMapper`.
- Tests: `ProductServicesTest` (8 casos) + 3 casos nuevos en `VentaServicesTest` (asocia producto, rechaza producto de otro negocio, producto inexistente). **Unitaríos verdes (23)**: la suite completa con Testcontainers requiere Docker Desktop, no disponible en el entorno actual.

### Frontend
- `PRODUCTS_API_URL` en `api.ts`; `ProductDto` + `CreateSaleRequest.product`/`UpdateSaleRequest.product`/`SaleResponseDto.product` + `SaleFormData.productId` en `types/sales.ts`.
- `salesService.getProducts / createProduct / deleteProduct` (además de las ya existentes `getProductTypes/createProductType/deleteProductType`, scoped por negocio en el backend).
- **Página dedicada `/dashboard/productos`**: nueva feature `src/features/catalogo/` con sección propia **"Catálogo"** en el Sidebar (item "Productos", icono `Package`). La página (`Productos.tsx`, `PageHeader` eyebrow "Catálogo") muestra en grid dos cards: **Categorías** (`GestionCategorias.tsx`, crear/listar/borrar) y **Productos** (`GestionProductos.tsx`, crear con nombre + precio + categoría opcionales, listar con precio y borrar). **Mi Negocio** vuelve a ser solo datos del negocio + defaults + contraseña; el **AdminPanel** queda como placeholder (categorías y productos son por-negocio, no globales).
- **Nueva venta en dos pasos desde el catálogo**: al crear una venta (`/dashboard/ventas/crear`), el usuario ve primero un buscador + grilla de productos del catálogo (con chips de categoría y stepper de cantidad) en lugar de un formulario vacío. Al seleccionar producto y cantidad, la barra inferior muestra el total en vivo y un botón **Continuar**. En el paso 2, el formulario ya viene con el producto, la descripción ("N x Nombre"), el costo (`precio × cantidad`) y la categoría autocompletados. Se eliminó el modal de **venta rápida**. Los préstamos no muestran el selector: la pantalla de creación se remonta al cambiar entre `VENTA` y `PRESTAMO`.
- **Primera cuota siempre visible**: se eliminó el acordeón de adelanto. La fecha del primer pago se precarga con la fecha de venta y queda visible; "Pagar primera cuota ahora" también queda visible y desmarcado por defecto.
- **Stock discreto en venta**: si un producto tiene stock configurado, se muestra como dato secundario, sin badges de agotado ni alertas al superar la cantidad. El stock sigue siendo opcional y el backend conserva su comportamiento actual.
- **Ganancia estimada**: debajo del costo del producto, se muestra el total a cobrar y la ganancia estimada en vivo (diferencia entre total a cobrar y costo), actualizándose al cambiar el valor de cuota o la cantidad de cuotas.
- **EditarVenta**: conserva el producto actual (`sale.product.id`) para no limpiarlo en updates.

### Tests ✅
- Suite frontend completa **341/341** (56 archivos). Nuevos tests de cambio VENTA/PRESTAMO, primera cuota visible/desmarcada por defecto y stock discreto sin alertas. `npx tsc -p tsconfig.app.json`, `npm run lint` y `npm run build` pasan.
- Gotchas encontrados: los `<option>` del selector de producto duplican textos de categoría en el DOM → usar `findAllByText` en los tests (no `findByText`); el formatter es-AR usa espacio no separable (`$ 500`) → aserciones de texto con regex; y el input recién creado conserva su `value` → `findByText('ROPA')` matchea también el campo → usar `findAllByText`.
- **`App.test.tsx` ya no es flaky**: el fallo intermitente lo causaba `businessService.getMyBusiness` sin mock (`DashboardLayout`/`initCurrency`): con el backend levantado el token falso disparaba 401 → refresh fail → logout → redirige a `/login` y la ruta nunca renderizaba. Se mockeó `businessService` (igual que `salesService`/`clientService`) y la suite queda libre de red y estable.
