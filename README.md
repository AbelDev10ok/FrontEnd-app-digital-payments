# FrontEnd-app-digital-payments


# TAREAS 🔨

pensar si si crearVenta utiliza mismo servicios que ventas


            {/* Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {sales.filter(s => s.completed).length}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(sales.filter(s => s.completed).reduce((sum, s) => sum + s.priceTotal, 0))}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendiente Cobro</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(sales.reduce((sum, s) => sum + s.remainingAmount, 0))}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div> */}


Checklist de hallazgos y recomendaciones 🔍
Prioridad: Alta ✅
Centralizar refresh de token

Archivos relevantes:
Layout.tsx
DashboardLayout.tsx
Problema: useTokenRefresh() se invoca en múltiples layouts (duplicación e impacto global).
Recomendación: Mover la llamada a useTokenRefresh() a un único lugar (p. ej. App.tsx o main.tsx) para ejecutarlo una vez por aplicación.
Extraer Header común

Archivos relevantes:
Layout.tsx
DashboardLayout.tsx
Problema: Cabecera (avatar, email, logout, título) duplicada en ambos componentes.
Recomendación: Crear src/shared/components/layout/Header.tsx que reciba props:
props sugeridas: title: string, user: User | null, onLogout: () => void, roleLabel?: string
Beneficio: DRY, testable, y facilita variaciones (admin vs usuario).
Desacoplar acceso a auth dentro de componentes compartidos

Archivos relevantes:
Layout.tsx, DashboardLayout.tsx, Header.tsx (propuesto), TokenRefreshHandler.tsx
Problema: Shared components llaman useAuthStore() directamente (menos reutilizables).
Recomendación: Pasar user y onLogout como props al Header, o introducir un AuthProvider en root y usar hooks sólo en un nivel superior.
Agregar export de Layout en el barrel de layout

Archivo: index.ts
Problema: Actualmente exporta { DashboardLayout, Sidebar } pero no Layout.
Recomendación: Añadir export { default as Layout } from './Layout'; para consistencia y facilitar imports (@/shared).
Prioridad: Media ⚠️
Corregir imports inconsistentes/obsoletos

Archivos donde revisar:
Dashboard.tsx (usa @/shared/components/layout/DashboardLayout — ok)
Otros archivos antes detectados que importaban ../components/dashboard/DashBoardLayout — revisar todos los imports que apunten a components/dashboard/* y actualizar para usar @/shared o la ruta correcta.
Recomendación: Hacer búsqueda global por DashBoardLayout / components/dashboard y reemplazar con @/shared/components/layout/DashboardLayout o usar barrels.
Revisar Sidebar y rutas

Archivo: Sidebar.tsx
Observación: Diseño OK; confirmar que las rutas (/dashboard/...) existen y los NavLink funcionan según estructura de routes.
Recomendación: Mantener, pero validar que el menú y los expanded no duplican estado en otras capas.
Prioridad: Baja 💡
Mover páginas a feature folder (opcional)

Ejemplo: Dashboard.tsx → Dashboard.tsx
Beneficio: Refuerza la Screaming Architecture en proyectos grandes; opcional para ahora.
Tests y verificación

Añadir/actualizar tests de snapshot/unit para:
Header (una vez extraído)
Layout y DashboardLayout (asegurar que usan el Header correctamente)
Probar navegación: abrir páginas que usan DashboardLayout y Layout para validar UI y logout.
Pasos propuestos si quieres que aplique cambios 🔧
Crear Header.tsx y mover la UI duplicada (1 commit).
Actualizar Layout.tsx y DashboardLayout.tsx para usar Header (1 commit).
Mover useTokenRefresh() a App.tsx (1 commit).
Añadir export en index.ts y arreglar imports rotos (1 commit).
Ejecutar tests y revisar manualmente rutas y comportamiento de logout (1 commit).
¿Quieres que genere el checklist como un PR sugerido con cambios en small commits (puedo hacerlo paso a paso), o prefieres que primero aplique solo la extracción de Header y la centralización de useTokenRefresh()? 🔁