# SAAS.md — Plan de monetización y deploy

Plan para convertir la app en un SaaS multi-usuario con suscripciones de pago, landing pública y despliegue en producción.

## Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Gateway de pago | **MercadoPago** (Suscripciones / preapproval) | Cobertura LatAm, checkout hosted, webhooks nativos |
| Modelo multi-tenant | **Columna `business_id` en DB compartida** | Estándar de la industria; 1 migración, 1 backup, 1 deploy. BD física por usuario descartada (migraciones/backups ×N clientes) |
| Precios | **Un único plan mensual** + trial gratis 14 días | Simple de vender y de implementar; la entidad `Plan` se mantiene igualmente para poder cambiar el precio sin redeploy |

## Estado actual del backend (levantamiento)

- **PostgreSQL + Flyway** (`V1`–`V4`): base sólida para migraciones de tenancy.
- **Auth completa**: registro con verificación por email, forgot/reset password, JWT con rotación de refresh token, rate limiting.
- **Brechas críticas**: no existe ningún concepto de negocio/propietario — `Usuario` no tiene FK hacia datos del dominio; todo es un namespace plano compartido. `ProductType.name` es `UNIQUE` global (colisionaría entre negocios). El JWT solo lleva email + rol.

## Arquitectura objetivo

```
Landing pública (/) ──── Vercel (gratis), SEO indexable
    hero · features · precios · FAQ → CTA "Probar 14 días gratis"

App SPA (/login, /register) ──── el registro crea Business + usuario admin

Spring Boot (Railway/Render ~$5/mes) ── PostgreSQL gestionado c/backups (Neon/Railway)
    Tenant: business_id en todas las tablas, scoping automático (@Filter)
    Billing: Plan(único) + Subscription + webhooks MercadoPago
    Gate: filter → 402 PAYMENT_REQUIRED si no TRIALING/ACTIVE/gracia

MercadoPago Suscripciones ── cobra cada mes;
    webhook notifica pagos y altas/bajas de tarjeta → actualiza estado
```

### Ciclo de vida de la suscripción

```
Registro → TRIALING (14 días) → ACTIVE (paga vía MercadoPago)
                ↓ vence sin pagar            ↓ falla el pago
           PAST_DUE (5 días de gracia) ←──────┘
                ↓ sigue sin pagar
           BLOCKED → toda la API responde 402,
                     excepto /auth/*, billing y webhooks
```

- El bloqueo nunca borra datos: el cliente paga y recupera todo (mejor conversión que eliminar).
- Estados gestionados por webhook de MP, no por cron: `preapproval` cambia → actualizamos `Subscription.status`.

---

## Fase 11 — Multi-tenancy (backend)

La más grande. Nadie ve datos ajenos ni por accidente.

1. Nueva entidad `Business` (nombre del negocio, moneda, configuración futura).
2. Flyway `V5__add_business_tenancy.sql`: columna `business_id` NOT NULL en `usuario`, `client`, `sale`, `fee`, `product_type`; el `UNIQUE(name)` de product_type pasa a ser único **por negocio**.
3. JWT agrega claim `businessId` (además de email y rol); `JwtValidationFilter` lo expone al contexto.
4. Scoping automático en repositorios/servicios vía Hibernate `@Filter`/`@TenantFilter` activado por request con el `businessId` del token.
5. `/auth/register` transaccional: crea `Business` + usuario admin.
6. Migración de datos existentes: crear Business default y asignar todos los registros actuales (para no romper el entorno local).

## Fase 12 — Suscripciones MercadoPago + bloqueo

1. Entidades backend: `Plan` (nombre, precio, moneda, trialDays) y `Subscription` (business_id, plan_id, status, current_period_end, preapproval_id de MP).
2. `POST /api/billing/subscribe`: crea la suscripción (preapproval) en MP y devuelve el `init_point` para redirigir al checkout hosted de MP (nunca manejamos tarjetas nosotros).
3. `POST /api/webhooks/mercadopago`: endpoint público con validación de firma `x-signature`; sincroniza pagos recibidos y cambios de estado de la suscripción.
4. Filter de gating (después de validación JWT): si la subscription no está en `TRIALING/ACTIVE/PAST_DUE(gracia)`, responder `402 PAYMENT_REQUIRED` con JSON `{message}`, salvo rutas `/auth/*`, `/api/billing/*` y webhooks.
5. Frontend:
   - `authenticatedFetch` detecta 402 → redirige a pantalla de paywall `/app/suscripcion`.
   - Página "Mi suscripción": estado, fin del período, botón "Actualizar método de pago" (link MP), historial básico.
   - Banner durante trial: "Te quedan X días".
6. Definir precio final (sugerencia: valor de 2–4 cuotas semanales de un cliente promedio, cobrado por mes).

## Fase 13 — Landing pública (misma SPA)

1. Layout público nuevo (sin sidebar/auth) y rutas antes de `ProtectedRoute`:
   - `/` — hero ("Gestioná tus ventas y préstamos a cuotas desde tu celular"), features (cronograma de cuotas, cobro y posposición, recordatorios WhatsApp, dashboard de métricas), cómo funciona, FAQ, CTA trial.
   - `/precios` — el plan único: precio mensual, qué incluye, trial 14 días, botón de alta.
   - Footer legal: Términos y Condiciones + Política de Privacidad (obligatorio para cobrar).
2. SEO: invertir el bloqueo actual de la Fase 4 solo para rutas públicas — `robots.txt` permite `/` y `/precios`, meta `noindex` removido en esas páginas (se mantiene en la app privada).
3. `/register` extendido: pide nombre del negocio además de email/password.
4. Rutas privadas se agrupan bajo prefijo (`/app/*` o mantener `/dashboard/*`) según conveniencia.

## Fase 14 — Deploy y endurecimiento

| Componente | Servicio estimado | Costo |
|---|---|---|
| Frontend (estático) | Vercel / Netlify / Cloudflare Pages | $0 |
| Backend (JVM siempre encendido, necesita URL pública para webhooks) | Railway / Render / VPS barato | ~$5–10/mes |
| PostgreSQL gestionado **con backups automáticos** | Neon / Supabase / Railway | $0–10/mes |
| Dominio + HTTPS | Porkbun / Namecheap | ~$12/año |

Checklist:
- [ ] Variables de entorno: credenciales MP (producción), secreto de webhook, `VITE_API_URL`, orígenes CORS del dominio real.
- [ ] CORS multi-origen y CSP/HSTS en `SecurityHeadersFilter` (cierra el Bloque C pendiente de la Fase 4 de `MEJORAS.md`).
- [ ] Monitoreo: Sentry (frontend + backend, tier gratuito).
- [ ] Backups verificados (restore de prueba al menos una vez).
- [ ] Términos y Política de Privacidad publicados; política de retención de datos tras cancelación.

**Costo fijo inicial total: ~$10–20 USD/mes.**

## Orden de construcción

**13 → 11 → 12 → 14**

1. **Fase 13 primero**: es corta, independiente y da presencia pública inmediata (se puede lanzar con CTA de lista de espera mientras se construye el resto).
2. **Fase 11**: el cimiento técnico; sin tenancy no hay SaaS.
3. **Fase 12**: depende directamente de 11 (Subscription referencia Business).
4. **Fase 14**: el deploy final tiene sentido cuando el ciclo completo funciona; dominio y Sentry pueden avanzar en paralelo desde la Fase 13.

Cada fase implementada se documenta como nueva fase numerada en `MEJORAS.md`, siguiendo el formato existente (motivación, cambios frontend/backend, tests, verificación con vitest/tsc/lint y compilación backend con `mvnw.cmd -q compile -o`).
