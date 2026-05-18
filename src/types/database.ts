// ============================================================
// Tipos de base de datos - Ferreteria
// Refleja el schema definido en supabase/schema.sql
// ============================================================

export type EstadoOrden   = 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'
export type EstadoTarea   = 'pendiente' | 'en_progreso' | 'completada'
export type PrioridadTarea = 'alta' | 'media' | 'baja'

// ---- Entidades base ----------------------------------------

export interface Categoria {
  id:          string
  nombre:      string
  descripcion: string | null
  created_at:  string
}

export interface Cliente {
  id:         string
  nombre:     string
  telefono:   string | null
  email:      string | null
  direccion:  string | null
  created_at: string
}

export interface Producto {
  id:           string
  codigo:       string | null
  nombre:       string
  categoria_id: string | null
  unidad:       string
  stock:        number
  stock_minimo: number
  precio:       number
  created_at:   string
  // Relaciones (cuando se hace JOIN)
  categoria?:   Categoria
}

export interface Orden {
  id:         string
  numero:     number
  cliente_id: string | null
  estado:     EstadoOrden
  fecha:      string
  total:      number
  notas:      string | null
  created_at: string
  // Relaciones (cuando se hace JOIN)
  cliente?:   Cliente
  items?:     OrdenItem[]
}

export interface OrdenItem {
  id:              string
  orden_id:        string
  producto_id:     string | null
  cantidad:        number
  precio_unitario: number
  subtotal:        number
  created_at:      string
  // Relaciones (cuando se hace JOIN)
  producto?:       Producto
}

export interface Tarea {
  id:               string
  titulo:           string
  descripcion:      string | null
  estado:           EstadoTarea
  prioridad:        PrioridadTarea
  orden_id:         string | null
  asignado_a:       string | null
  fecha_vencimiento: string | null
  created_at:       string
  // Relaciones (cuando se hace JOIN)
  orden?:           Pick<Orden, 'id' | 'numero' | 'estado'>
}

// ---- Tipos para INSERT (sin campos auto-generados) ----------

export type CategoriaInsert = Omit<Categoria, 'id' | 'created_at'>
export type ClienteInsert   = Omit<Cliente,   'id' | 'created_at'>
export type ProductoInsert  = Omit<Producto,  'id' | 'created_at' | 'categoria'>
export type OrdenInsert     = Omit<Orden,     'id' | 'numero' | 'created_at' | 'cliente' | 'items'>
export type OrdenItemInsert = Omit<OrdenItem, 'id' | 'subtotal' | 'created_at' | 'producto'>
export type TareaInsert     = Omit<Tarea,     'id' | 'created_at' | 'orden'>

// ---- Tipos para UPDATE (todos los campos opcionales) --------

export type CategoriaUpdate = Partial<CategoriaInsert>
export type ClienteUpdate   = Partial<ClienteInsert>
export type ProductoUpdate  = Partial<ProductoInsert>
export type OrdenUpdate     = Partial<OrdenInsert>
export type TareaUpdate     = Partial<TareaInsert>
