# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dueños y empleados de pequeños negocios (comercios que venden contado y a cuotas, y prestan dinero) que registran operaciones del día y mantienen su catálogo. Cada negocio (`Business`) es un tenant con sus propios clientes, productos y ventas.

## Product Purpose

Registrar y controlar ventas (contado y cuotas), préstamos y cobros de un negocio desde una SPA, con catálogo de productos/variantes, clientes, agenda de cuotas y resumen diario. Éxito: el negocio asienta cada operación sin errores y sabe qué cobrar hoy.

## Positioning

Herramienta de gestión operativa — "libro de caja vivo" — que combina ventas y préstamos/cobros a cuotas en un mismo lugar, con el importe siempre ligado a su moneda y datos multi-tenant por negocio.

## Operating Context

Uso diario en el negocio, desde escritorio y móvil. El catálogo se mantiene en esporádicas sesiones de administración y se consume al crear ventas. Backend Spring Boot 3.5 + PostgreSQL en `http://localhost:8080`; pagos de suscripción vía Mercado Pago.

## Capabilities and Constraints

- Catálogo: producto base → variantes (SKU); una venta elige una variante; categorías jerárquicas (slug único por negocio); atributos generan variantes por combinación (cartesiano, máx. 200).
- La moneda es parte del importe: una VENTA hereda la moneda de su producto (se elige al crear y no se edita); un PRESTAMO la elige en el alta. Nunca se convierte ni se reetiqueta un importe guardado.
- Multi-tenant por `Business`: todo dato pertenece al negocio activo.
- Roles: `ROLE_ADMIN` → `/admin`, `ROLE_USER` → `/dashboard`.
- Stack: React 18 + TypeScript + Vite + Tailwind CSS 3 + Zustand; sin librería de componentes UI.
- Español para toda la copy, mensajes de error y commits.

## Brand Commitments

Nombre **Cobros&Ventas**; identidad verde (verde de marca `#1a8059`, títulos Archivo) documentada en `DESIGN.md`; tono operativo, claro y directo.

## Evidence on Hand

- `DESIGN.md` — sistema visual completo (color, tipografía, componentes, reglas).
- `SAAS.md` — decisiones de monetización, multi-tenancy y deploy.
- `AGENTS.md` — convenciones de arquitectura y API.
- Tests RTL en `src/**/test` como comportamiento verificable.
- Sin testimonios, clientes ni métricas reales: no inventar evidencia.

## Product Principles

- Un importe siempre va con su moneda: nunca se reinterpreta ni se convierte.
- La venta consume el catálogo, no lo edita: el catálogo se mantiene en su sección.
- Operación primero: densidad escaneable, estados visibles y confirmación antes de destruir datos.
- Todo dato pertenece al negocio activo (multi-tenant por defecto).
