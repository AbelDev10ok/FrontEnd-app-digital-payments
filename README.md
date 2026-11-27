# Frontend — App-cobros (Cobros&Ventas)

SPA del producto: agenda de cobros, ventas, préstamos, cuotas, clientes,
catálogo, inventario y suscripciones. React 18 + TypeScript + Vite + Tailwind.
Consume la API del backend (repo `backend-app-digital-payments`).

## Arranque

```powershell
npm install
npm run dev
```

`http://localhost:5173`. Apunta al backend en `http://localhost:8080` por
defecto; para cambiarlo, copiá `.env.example` a `.env` y editá `VITE_API_URL`.

Usar `npm`, no `pnpm` (aunque `package.json` declare `packageManager`).

## Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción. **No typechequea** |
| `npx tsc -p tsconfig.app.json` | Typecheck real |
| `npm test` | Vitest + Testing Library |
| `npm run lint` | ESLint |

## Documentación

| Documento | Contenido |
|-----------|-----------|
| `AGENTS.md` | Convenciones: comandos, alias, endpoints, flujos de cobro y remitos |
| `PRODUCT.md` | Verdad de producto: propósito, capacidades, principios |
| `DESIGN.md` | Sistema visual: color, tipografía, componentes, modo oscuro |
| `SAAS.md` | Monetización, multi-tenancy y deploy |

## Convenciones

- **Español** en toda la copy, mensajes de error y commits.
- Rutas centralizadas en `src/App.tsx`; alias `@/`, `@features/`, `@shared/`.
- Sin librería de UI: Tailwind + componentes propios.
