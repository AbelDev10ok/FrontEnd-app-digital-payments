# Gestión de Cobros y Ventas — SaaS

SPA de cobros y ventas para negocios que venden a cuotas (ventas al contado/crédito y préstamos). Permite registrar ventas y préstamos con cronograma de cuotas, cobrar y posponer cuotas, gestionar clientes y vendedores, y visualizar métricas del negocio en un dashboard.

## Stack

- **Frontend:** React 18 + TypeScript + Vite, React Router v7, Zustand (auth persistida), Tailwind CSS 3 + lucide-react, Vitest + React Testing Library.
- **Backend:** Spring Boot (repo separado `App-cobros/app-digital-payments/digital-pyments`), JWT con rotación de refresh token.
- **Documentación del trabajo realizado:** ver `MEJORAS.md` (backlog histórico por fases), `SAAS.md` (plan de monetización y deploy: fases 11–14) y `AGENTS.md` (convenciones del repo).

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción (no typecheckea) |
| `npm test` | Suite de tests (Vitest + RTL) |
| `npm run lint` | ESLint |
| `npx tsc -p tsconfig.app.json` | Typecheck |

Backend esperado en `http://localhost:8080` (configurable vía `VITE_API_URL`, ver `.env.example`).

---

# Roadmap de mejoras propuestas

Estado actual: fases 4–10 completadas (seguridad/SEO, filtros avanzados, sidebar con conteos, headers dinámicos). Lo siguiente es el plan propuesto, agrupado en cuatro frentes.

## A. Núcleo del negocio (cobros)

El objetivo de esta línea es cerrar el ciclo completo de la venta: crear → cobrar → completar (o cancelar/reembolsar), y aumentar la tasa de cobro real.

### A1. Recordatorios WhatsApp
- **Qué:** botón de recordatorio (`wa.me`) en cuotas vencidas y próximas a vencer, con mensaje precargado: *"Hola Ana, te recuerdo que tu cuota de Gs. 50.000 vence mañana. ¡Gracias!"*.
- **Alcance:** solo frontend. Sin backend nuevo.
- **Impacto:** alto — contacto directo con el cliente en el canal que ya usa; reduce la mora sin costo.
- **Esfuerzo:** bajo.
- **Dónde:** `ventaDetalle` (cronograma de cuotas) y dashboard (alerta de cuotas vencidas).

### A2. Cancelación de venta + reembolso
- **Qué:** endpoint `PUT /api/sales/{id}/cancel` en el backend (marca la venta como `CANCELED`, registra `refundAmount` si corresponde) y restauración de la UI eliminada en la Fase 10 (tarjeta "Canceladas"/"Reembolsos" del dashboard, filtro del sidebar).
- **Contexto:** hoy el backend calcula esos campos pero no existe ningún flujo que ponga una venta en `CANCELED`; los valores siempre son 0.
- **Impacto:** alto — completa una funcionalidad a medias.
- **Esfuerzo:** medio (backend + frontend + tests).
- **Dónde:** backend (`VentaController`, `VentaServices`), frontend (dashboard, sidebar, detalle de venta).

### A3. Interés por mora automático
- **Qué:** recargo configurable por día/atraso sobre cuotas vencidas, visible en el cronograma y sumado al total a cobrar.
- **Impacto:** medio-alto — compensa la mora, pero cambia reglas de negocio (requiere decisión sobre días de gracia y tope).
- **Esfuerzo:** medio-alto (lógica nueva en backend, migración de datos históricos).

### A4. Recibo PDF al cobrar
- **Qué:** comprobante descargable/compartible tras registrar un pago de cuota (datos del cliente, monto, fecha, número de cuota).
- **Impacto:** medio — profesionaliza la operación y reduce disputas.
- **Esfuerzo:** medio (generación client-side o endpoint backend de PDF).

## B. SaaS real (multi-usuario)

Hoy existe un rol binario (ADMIN/USER). Para operar como SaaS multi-usuario hacen falta estas piezas:

### B1. Recuperación de contraseña
- **Qué:** flujo "olvidé mi contraseña" (solicitud por email + token de reset con expiración + formulario de nueva contraseña).
- **Impacto:** alto en producción — sin esto, un usuario bloqueado depende de intervención manual en BD.
- **Esfuerzo:** medio (backend: token + envío de email; frontend: dos pantallas nuevas).

### B2. Gestión de cobradores desde AdminPanel
- **Qué:** alta/baja/desactivación de usuarios cobradores, asignación de clientes/vendedores a cada cobrador, vista de cartera por cobrador.
- **Impacto:** alto — habilita el modelo de negocio con varios cobradores en campo.
- **Esfuerzo:** medio-alto (backend: CRUD de usuarios + relaciones; frontend: pantallas de administración).

### B3. Configuración del negocio
- **Qué:** parámetros editables por cuenta: moneda, tasa de interés por defecto, frecuencia de cuota por defecto, días de gracia de mora.
- **Impacto:** medio — elimina valores hardcodeados y prepara el terreno para A3 (mora) y multi-tenant.
- **Esfuerzo:** medio.

## C. Cobradores en la calle

La app se usa mayormente desde el celular, en terreno. Estas mejoras optimizan el caso de uso diario.

### C1. Ruta del día
- **Qué:** vista "cuotas que vencen hoy" ordenada (por zona/cliente), con check-off rápido de cobro desde la propia lista y acceso directo al detalle y al recordatorio WhatsApp (A1).
- **Impacto:** alto — consolida el valor core: saber a quién cobrarle hoy y hacerlo sin fricción.
- **Esfuerzo:** medio-bajo (el backend ya expone fechas de vencimiento; puede empezar siendo un filtro/agregación frontend sobre `/api/sales?aCobrar=true`).

### C2. PWA instalable
- **Qué:** manifest + service worker para instalar la app en el teléfono; base para capacidades offline futuras.
- **Impacto:** medio — mejora la experiencia móvil; offline real requiere estrategia de datos adicional (fase posterior).

## D. Infraestructura y calidad

### D1. CI con GitHub Actions
- **Qué:** workflow en cada push/PR: `lint` + `tsc` + `vitest run` + `build`.
- **Impacto:** alto a largo plazo — protege las 209+ tests existentes contra regresiones.
- **Esfuerzo:** bajo.

### D2. Seguridad pendiente (Bloque C de la Fase 4)
- **Qué:** CSP + HSTS en `SecurityHeadersFilter` del backend, CORS para múltiples puertos dev, `trust-proxy` detrás de reverse proxy. Snippet propuesto en `MEJORAS.md` (Fase 4, Bloque C).
- **Esfuerzo:** bajo-medio (solo backend).

### D3. Tests E2E con Playwright
- **Qué:** cobertura E2E de los flujos críticos: login → crear venta → cobrar cuota → verificar dashboard.
- **Impacto:** medio-alto — valida integración real frontend-backend.
- **Esfuerza:** medio-alto (requiere entorno con backend corriendo y datos sembrados).

---

## Orden recomendado

1. **A1 Recordatorios WhatsApp** — máximo impacto con mínimo esfuerzo, solo frontend.
2. **C1 Ruta del día** — consolida el caso de uso diario de la app; combina naturalmente con A1.
3. **A2 Cancelar venta** — cierra la funcionalidad a medias dejada por la Fase 10.
4. **D1 CI** — barato y protege todo lo anterior antes de que el proyecto crezca.

Después, priorizar según necesidad real: B1 (si hay usuarios reales), B2 (si hay varios cobradores), D3 (antes de refactorizaciones grandes).

## Convención de trabajo

Cada feature implementada se documenta como nueva fase en `MEJORAS.md`, siguiendo el formato existente: motivación, cambios frontend/backend, estado de tests y comandos de verificación (`vitest` + `tsc` + `lint`).
