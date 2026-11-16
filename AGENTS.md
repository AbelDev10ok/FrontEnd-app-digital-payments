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
**Gotcha:** `@config/*` and `@presentation/*` no longer exist anywhere (removed from `tsconfig.app.json` too) — imports fail with `TS2307`. Don't use them. `@hooks/*` maps to `src/shared/hooks`. Types compartidos viven en `src/shared/types/` (client/dashboard/sales) e se importan vía `@/shared/types/*` — NO usar un alias `@types/*`: `@types` es un prefijo reservado de TypeScript para paquetes de tipos ambientales y cualquier import a `@types/...` falla con `TS6137`.

## Backend API conventions

- Base URL `http://localhost:8080` is centralized in `src/shared/config/api.ts` (per-domain constants: `AUTH_API_URL`, `SALES_API_URL`, `LOANS_API_URL`, `CLIENTS_API_URL`, `PRODUCT_TYPES_API_URL`, `PRODUCTS_API_URL`, `ATTRIBUTES_API_URL`, `BUSINESS_API_URL`, `BILLING_API_URL`, `USUARIOS_API_URL`). All services must import from there, never hardcode the host. Override via `VITE_API_URL` (see `.env.example`).
- Catálogo: `/api/products/all` devuelve **una fila por variante (SKU)** con `id` (producto base), `variantId`, `cost`, `price`, `stock`, `sku`, `variantLabel` y `attributes`. El alta/edición (`POST`/`PUT /api/products`) manda el producto base con `variants[]` (cada una con `id` al editar, `cost`, `price`, `stock`, `barcode`, `attributeValueIds`) y `attributeIds[]`. Categorías jerárquicas en `/api/product-types` (`{name, parentId, slug}`); atributos en `/api/attributes` (POST con `{name, values:[{value}]}`, POST `/{id}/values`, DELETE). Una venta elige **una variante** (`variant` en el payload): al contado el backend calcula el total con el precio de lista y el frontend no manda `amountFee`/`quantityFees`/`cost`.
- Catálogo en la UI: los atributos de cada variante se muestran como `Nombre: valor` (`src/shared/utils/productSpecs.ts`), con resumen multi-variante (`Color: Rojo / Negro · RAM: 4 GB / 8 GB`, tope 3 + `+N más`) y fallback a `variantLabel`; el buscador del catálogo y del selector de venta también matchea nombre y valor de los atributos. La comparación pasa por `normalizarBusqueda` (`src/shared/utils/busqueda.ts`): minúsculas, sin acentos y con los separadores convertidos en espacio, así «ram 4» encuentra «Ram: 4» — lo comparten el catálogo y el inventario, nunca compares con un `includes` sobre el texto crudo. **Productos sólo en categorías hoja:** el alta deshabilita los padres con subcategorías (y avisa si un producto viejo quedó en uno, conservándolo al editar); el filtro del catálogo por un padre incluye toda su rama. Árbol, descendientes y aplanado viven en `src/shared/utils/categoryTree.ts` (lo comparten catálogo, selector de venta y gestión de categorías).
- Alta de operaciones: en cuotas el piso son **2** cuotas (una sola es vender al contado). `useSaleForm` valida `quantityFees >= 2` para cualquier `payments` distinto de `CONTADO`, el formulario arranca en 2 y al cambiar de método de pago sube a 2 (o a 1 al elegir `CONTADO`). El alta de un préstamo sugiere `defaultInterestRate` y `defaultPaymentFrequency` de Mi Negocio una sola vez y no pisa lo que el usuario ya cargó; las frecuencias válidas de préstamo viven en `src/shared/utils/payments.ts`.
- Response envelope (unless noted): `{ message, status, data }` with `status === 'OK'`. Unwrap via `handleResponse` (see `src/shared/utils/http.ts`); `getErrorMessage` extracts the message from non-OK responses. Enveloped: loans/stats, clients/stats, auth-register/verify y auth-login. Raw (sin envelope): clients, sellers, product-types y **refresh-token** (`{ accessToken, refreshToken }` directo). **forgot-password/reset-password** responden **texto plano** (`response.text()`, sin JSON).
- Auth endpoints: `/auth/login`, `/auth/refresh-token`, `/auth/verify`, `/auth/forgot-password`, `/auth/reset-password` (no `/api` prefix). Domain endpoints: `/api/loans`, `/api/clients`, `/api/product-types`, etc.
- Dates are sent as `YYYY-MM-DD` strings.
- Pagination uses a Spring-style `Page<T>` DTO (`content`, `totalPages`, `totalElements`, `page` is 0-indexed) — see `Page<T>` in `salesServices.ts` and the `usePaginatedSales`/`usePaginatedClients` hooks.
- Tablero: `GET /api/sales/dashboard` trae `porCategoriaProducto` (ventas de productos del mes por categoría del catálogo; "Sin categoría" para el legado) y `topProductos` (top 5 por unidades, sumando variantes). `useDashboardMetrics` los mapea a `categoryBreakdown`/`topProducts` y el tablero los pinta en «Ventas por categoría» y «Productos más vendidos»; montos siempre por moneda, nunca sumados.

## Inventario (stock)

- Ruta propia `/dashboard/inventario` (`src/features/inventario`, link «Inventario» en el sidebar bajo Catálogo). Una fila por **SKU** (no por producto base) con stock, costo y precio; buscador por producto, SKU, categoría y atributos. Fuera de alcance por ahora: umbral de stock bajo/alertas, dashboard de KPIs y cualquier función de ERP.
- El stock **no se edita**: `stock_movement` es un libro append-only (fuente de verdad) y `product_variant.stock` es su caché, actualizada en la misma transacción. El alta de producto emite un `INGRESO` «Carga inicial»; editar un producto con un `stock` distinto al actual se rechaza. La corrección se hace por **ajuste por conteo** en la edición del producto (`AjusteStockInline`, `POST /api/stock/adjustment`, motivo obligatorio).
- `POST /api/stock/entries` (ingreso por lote: `{note?, lines:[{variantId, quantity, unitCost?}]}`) registra un `INGRESO` por línea y el costo observado **no** reescribe `variant.cost`. `GET /api/stock/movements?variantId&from&to&type&page&size` lista el historial (Spring `Page`, `page` 0-indexed) y **no** devuelve saldo corrido: `stockAfter` viene `null`, por eso `MovimientosStockModal` muestra el stock actual en el encabezado y el delta por fila.
- Tests: `src/features/inventario/test/Inventario.test.tsx` mockea `salesService` (`getProducts`, `registrarIngresoStock`, `getStockMovements`) y `businessService.getMyBusiness`.

## Remitos

- Un remito por `VENTA` (nunca `PRESTAMO`), de una sola línea (una venta = un SKU). No se emite de ventas `CANCELED`; sí de `ACTIVE`/`COMPLETED`. Anular conserva los remitos ya emitidos; **una venta con remito emitido no se borra** (el backend lo rechaza y el menú no ofrece Eliminar: se anula en su lugar). La vista imprimible marca «ANULADO» si la venta se anuló después de emitir, y `SaleDocumentDto.saleStatus` trae el estado vivo de la venta (no es parte del snapshot).
- Endpoints `GET/POST /api/sales/{saleId}/remito` (`ROLE_USER`, envelope). `POST` es idempotente: si ya existe devuelve el snapshot sin cambiar observaciones; `GET` responde 404 si no hay y `salesService.getRemito()` lo traduce a `null`. `SaleResponseDto.remito` trae el resumen (`numberLabel`, `issuedAt`) y lo adjunta el backend en listado y detalle.
- Primera emisión desde el detalle o la fila del listado: `RemitoEmitModal` avisa que la numeración se asigna al confirmar y permite observaciones opcionales. Abre una pestaña en blanco **sincrónicamente** antes del `POST` (los popups bloqueados se detectan así) y después setea `location.href` a la vista imprimible; si no hay ventana, navega en la misma pestaña. La reimpresión abre el snapshot directo, sin modal.
- Vista imprimible: ruta lazy `/dashboard/ventas/:id/remito` **fuera de `DashboardLayout`** y declarada antes de `/dashboard/ventas/:id`. Se genera en el navegador (A4 con `@media print`/`@page` en `src/index.css`), sin PDF server-side; el botón «Imprimir» llama a `window.print()` y no abre el diálogo automáticamente.
- Mi Negocio suma `cuit`, `address` y `phone` opcionales (se imprimen en el remito). El CUIT se valida como vacío u 11 dígitos; enviar `''` borra el dato. Nunca bloquean la emisión.

## Vendedores (cartera y atribución)

- Un vendedor es un `Client` con `seller: true`; `Client.sellerId/sellerName` es su **cartera** (un cliente tiene un vendedor o ninguno). Se habilita desde la ficha del cliente y reasignar se hace **sólo desde la edición del cliente**. **Deshabilitar** abre `DeshabilitarVendedorModal`: con cartera hay que elegir entre traspasarla a otro vendedor (`transferToSellerId`) o dejarla sin vendedor (`leaveClientsUnassigned`, la cobra el negocio); sin clientes confirma directo. El conteo viene de `Client.clientesEnCartera` (sólo en el detalle). `/dashboard/clientes?vendedor=ID` y `?sinVendedor=true` preseleccionan el filtro por URL.
- `SaleResponseDto.sellerId/sellerName` es la **autoría sellada** de la operación: el alta la precarga desde la cartera del cliente (`useSaleForm` usa `client.sellerId`, ya no compara por nombre); la lista de clientes del alta es completa (la cartera **no** filtra ni bloquea ventas) y cada opción muestra de quién es el cliente. La edición de la operación **no** toca la autoría: `SaleUpdateRequestDto` no expone `sellerId` y `SaleForm` ya no muestra el vendedor. Reasignar la cartera del cliente tampoco reescribe el historial. Una venta con producto no ofrece «Editar» (producto, categoría, precio y autoría están sellados); sí un préstamo o una venta sin producto, por la descripción.
- Lista de ventas/préstamos: columna **Vendedor** y filtro (`SIN vendedor` incluido), alimentado por `salesService.getSellers()`; acepta `?sellerId=` y `?withoutSeller=true` en la URL.
- Página `/dashboard/vendedores` (`src/features/vendedores`, `sellerService.getSellerMetrics`): tabla ordenable con conmutador Ventas/Préstamos, período y moneda como el tablero, fila "Sin vendedor" y enlaces a las listas filtradas. **Vendido/cobrado = actividad sellada por operación; deuda = cartera actual** (por eso pueden no coincidir).

## Auth & roles

- JWT access/refresh tokens; role is decoded from the JWT `authorities` claim in `authStore.ts`.
- Backend refresca con **rotación**: `/auth/refresh-token` invalida el token usado y devuelve uno nuevo; el frontend debe guardar SIEMPRE el `refreshToken` que devuelve la respuesta (nunca el viejo). El refresh usa single-flight (`refreshAccessToken` en `authServices.ts`) para que peticiones concurrentes con 401 compartan un único refresh y no roten en paralelo.
- `authenticatedFetch` (in `authServices.ts`) adds the Bearer header, retries once after a 401 with a refreshed token, and logs out + redirects to `/login` if refresh fails. All services must use it.
- `authStore.logout()` limpia el estado local Y llama `POST /auth/logout` con el refresh token (best-effort, ignora errores) para invalidarlo server-side.
- `TokenRefreshHandler` (mounted once in `App.tsx`) refreshes every 4 min and on tab focus.
- Roles: `ROLE_ADMIN` → `/admin`, `ROLE_USER` → `/dashboard`. `ProtectedRoute` handles role-based redirects and injects `user`/`onLogout` props.
- **Contraseña olvidada (flujo público):** `/forgot-password` pide el email (el backend responde siempre el mismo mensaje, exista o no) → el mail manda a `/reset-password?token=...`, que guarda la contraseña nueva con `POST /auth/reset-password?token=...` y manda a iniciar sesión. Sin token o con token vencido, `/reset-password` ofrece solicitar un enlace nuevo.
- **Verificación de correo (flujo público):** el mail de registro manda a `/verify?token=...`, que llama a `GET /auth/verify?token=...` (envelope) y muestra la confirmación. El token se consume una sola vez: la página manda una única petición aunque React re-ejecute el efecto.
- **Route order matters** in `App.tsx`: static ventas routes (`/todas`, `/crear`, `/editar/:id`) and the printable `/dashboard/ventas/:id/remito` must be declared before the dynamic `/dashboard/ventas/:id`.

## Conventions

- **Spanish** for all user-facing text, error messages, comments, and git commit messages.
- Envelope statuses from the backend: `COMPLETED`, `ACTIVE`, `CANCELED`. The UI hardcodes display of `A_COBRAR` because the backend never returns it.
- eslint `react-refresh/only-export-components` warns when a component file exports non-components — export the component and hooks separately.

## Reference docs (Spanish)

- `PRODUCT.md` — verdad de producto (usuarios, propósito, principios); `DESIGN.md` — sistema visual Cobros&Ventas; `SAAS.md` — plan de monetización y deploy. `MEJORAS.md`/`ARREGLOS.md` ya no existen: no referenciarlos.
