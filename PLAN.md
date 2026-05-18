# Plan de Implementacion - Ferreteria App

Sistema de gestion de tareas para taller de ferreteria.
**Stack:** React 19 + TypeScript + Vite + Supabase + Tailwind CSS

---

## Fase 1 - Fundacion y Configuracion ✅

- [x] Renombrar proyecto en `package.json` (name: "ferreteria")
- [x] Configurar variables de entorno (`.env`) con credenciales de Supabase
- [x] Crear cliente de Supabase en `src/lib/supabase.ts`
- [x] Configurar React Query (`QueryClientProvider`) en `main.tsx`
- [x] Configurar React Router (`BrowserRouter`) en `main.tsx`
- [x] Limpiar boilerplate de `App.tsx` y `App.css`
- [x] Crear estructura de carpetas base:
  - `src/components/ui/` (componentes reutilizables)
  - `src/components/layout/` (Sidebar, Navbar, Layout)
  - `src/pages/` (vistas/pantallas)
  - `src/hooks/` (custom hooks)
  - `src/types/` (interfaces TypeScript)
  - `src/services/` (llamadas a Supabase)

---

## Fase 2 - Base de Datos (Supabase) ✅

- [x] Crear tabla `clientes` (id, nombre, telefono, email, direccion, created_at)
- [x] Crear tabla `productos` (id, codigo, nombre, categoria, unidad, stock, stock_minimo, precio, created_at)
- [x] Crear tabla `categorias` (id, nombre, descripcion)
- [x] Crear tabla `ordenes` (id, numero, cliente_id, estado, fecha, total, notas, created_at)
- [x] Crear tabla `orden_items` (id, orden_id, producto_id, cantidad, precio_unitario, subtotal)
- [x] Crear tabla `tareas` (id, titulo, descripcion, estado, prioridad, orden_id, asignado_a, fecha_vencimiento, created_at)
- [x] Configurar Row Level Security (RLS) en Supabase
- [x] Crear tipos TypeScript que reflejen el schema en `src/types/database.ts`

---

## Fase 3 - Autenticacion ✅

- [x] Crear pagina `LoginPage` con formulario (email + password)
- [x] Integrar autenticacion con Supabase Auth
- [x] Crear hook `useAuth` para manejar sesion del usuario
- [x] Crear `AuthProvider` context para estado global de sesion
- [x] Implementar rutas protegidas (`ProtectedRoute` component)
- [x] Manejar redireccion automatica: logueado → dashboard, no logueado → login
- [ ] Boton de logout en la navegacion (se agrega en Fase 4 con el Navbar)

---

## Fase 4 - Layout y Navegacion ✅

- [x] Crear componente `Sidebar` con links a todas las secciones
- [x] Crear componente `Navbar` (header con titulo de pagina + user info)
- [x] Crear componente `Layout` que envuelve todas las paginas protegidas
- [x] Implementar sidebar colapsable (responsive mobile)
- [x] Crear componentes UI base:
  - `Button` (variantes: primary, secondary, danger, ghost)
  - `Input`, `Textarea`, `Select`
  - `Modal` / `Dialog`
  - `Badge` (para estados: pendiente, en progreso, completado)
  - `Table` (TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell)
  - `Card` (Card, CardHeader, CardTitle, CardContent, CardFooter)
  - `Spinner` / `FullPageSpinner`
  - `EmptyState`
- [x] Crear pagina `NotFound` (404)

---

## Fase 5 - Dashboard ✅

- [x] Crear `DashboardPage` como pagina principal
- [x] Tarjetas de resumen: total ordenes, tareas pendientes, clientes activos, productos con bajo stock
- [x] Grafica de ordenes por mes (Recharts - BarChart)
- [x] Lista de ultimas 5 ordenes recientes
- [x] Lista de tareas urgentes/proximas a vencer

---

## Fase 6 - Modulo de Clientes ✅

- [x] Crear `ClientesPage` con tabla de todos los clientes
- [x] Busqueda y filtrado de clientes (server-side con ilike)
- [x] Formulario para crear cliente (modal con React Hook Form + Zod)
- [x] Formulario para editar cliente (mismo modal, pre-poblado)
- [x] Boton para eliminar cliente (con confirmacion)
- [x] Vista de detalle de cliente con su historial de ordenes (modal)
- [x] Servicio `src/services/clientes.ts` con CRUD en Supabase

---

## Fase 7 - Modulo de Inventario (Productos) ✅

- [x] Crear `ProductosPage` con tabla de productos
- [x] Busqueda por nombre/codigo y filtro por categoria
- [x] Indicador visual de stock bajo (fila roja + icono AlertTriangle)
- [x] Formulario para crear producto (con categoria, unidad, precio, stock, stock minimo)
- [x] Formulario para editar producto (pre-poblado)
- [x] Eliminar producto (con confirmacion)
- [x] Modulo de categorias (CRUD inline en modal dedicado)
- [x] Ajuste de stock manual (entrada/salida con toggle visual)
- [x] Servicio `src/services/productos.ts` con CRUD en Supabase
- [x] Servicio `src/services/categorias.ts` con CRUD en Supabase

---

## Fase 8 - Modulo de Ordenes ✅

- [x] Crear `OrdenesPage` con tabla de ordenes
- [x] Filtros por estado (pendiente, en proceso, completada, cancelada) y busqueda por numero/cliente
- [x] Formulario de nueva orden:
  - Seleccionar cliente (dropdown)
  - Agregar productos con cantidad (tabla dinamica con useFieldArray)
  - Precio auto-completado al seleccionar producto
  - Calculo automatico de total en tiempo real
  - Campo de notas
- [x] Vista de detalle de orden con sus items (modal)
- [x] Cambio de estado de orden (flujo: pendiente → en proceso → completada / cancelada)
- [x] Editar orden existente (re-carga items desde Supabase)
- [x] Servicio `src/services/ordenes.ts` con CRUD en Supabase

---

## Fase 9 - Modulo de Tareas ✅

- [x] Crear `TareasPage` con vista tipo Kanban
- [x] Columnas de estado: Pendiente | En Progreso | Completada (con contadores)
- [x] Formulario para crear/editar tarea (titulo, descripcion, prioridad, estado, fecha vencimiento, asignado a, orden asociada)
- [x] Botones de avance/retroceso de estado en cada tarjeta (← →)
- [x] Filtro por prioridad (alta, media, baja) y busqueda por titulo
- [x] Indicador visual de tareas vencidas (badge rojo + fecha en rojo)
- [x] Borde izquierdo de color segun prioridad (rojo/ambar/gris)
- [x] Servicio `src/services/tareas.ts` con CRUD en Supabase

---

## Fase 10 - Reportes y Exportacion ✅

- [x] Crear `ReportesPage` con 3 tabs (Ordenes / Inventario / Clientes)
- [x] Reporte de ordenes: filtro por rango de fechas, resumen de totales
- [x] Reporte de inventario: tabla con estado de stock, filas rojas para stock bajo
- [x] Grafica de monto por mes (Recharts BarChart, calculado del rango filtrado)
- [x] Exportar ordenes a PDF (jsPDF + autoTable, carga dinamica)
- [x] Exportar inventario a Excel (XLSX, carga dinamica)
- [x] Exportar lista de clientes a Excel (XLSX, carga dinamica)

---

## Fase 11 - PWA y Pulido Final ✅

- [x] Verificar configuracion PWA en `vite.config.ts` (manifest, iconos)
- [x] Agregar iconos de app (192x192, 512x512) en `/public`
- [x] Probar instalacion como PWA en movil/escritorio
- [x] Agregar pantalla de carga (FullPageSpinner via Suspense fallback)
- [x] Manejo de errores global (`ErrorBoundary` class component)
- [x] Mensajes de exito/error con toasts (`toast.ts` + `Toaster.tsx`, auto-dismiss 4s)
- [x] Optimizar performance (lazy loading de rutas con React.lazy + Suspense)
- [x] Build de produccion y prueba final (`npm run build`) — OK, 0 errores TS

---

## Progreso General

| Fase | Estado |
|------|--------|
| Fase 1 - Fundacion | ✅ Completada |
| Fase 2 - Base de Datos | ✅ Completada |
| Fase 3 - Autenticacion | ✅ Completada |
| Fase 4 - Layout y Navegacion | ✅ Completada |
| Fase 5 - Dashboard | ✅ Completada |
| Fase 6 - Clientes | ✅ Completada |
| Fase 7 - Inventario | ✅ Completada |
| Fase 8 - Ordenes | ✅ Completada |
| Fase 9 - Tareas | ✅ Completada |
| Fase 10 - Reportes | ✅ Completada |
| Fase 11 - PWA y Pulido | ✅ Completada |
