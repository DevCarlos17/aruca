import { supabase } from '../lib/supabase'
import type { EstadoOrden } from '../types/database'

// ---- Types -------------------------------------------------

export type OrdenReporte = {
  numero:        number
  clienteNombre: string
  fecha:         string
  estado:        EstadoOrden
  total:         number
  notas:         string | null
}

export type ProductoReporte = {
  codigo:       string | null
  nombre:       string
  categoria:    string
  unidad:       string
  stock:        number
  stock_minimo: number
  precio:       number
  estadoStock:  'OK' | 'Bajo'
}

export type ClienteReporte = {
  nombre:     string
  telefono:   string | null
  email:      string | null
  direccion:  string | null
  created_at: string
}

// ---- Queries -----------------------------------------------

export async function getReporteOrdenes(
  desde?: string,
  hasta?: string,
): Promise<OrdenReporte[]> {
  let query = supabase
    .from('ordenes')
    .select('numero, estado, fecha, total, notas, clientes(nombre)')
    .order('fecha', { ascending: false })

  if (desde) query = query.gte('fecha', desde)
  if (hasta) query = query.lte('fecha', hasta)

  const { data, error } = await query
  if (error) throw error

  type Raw = {
    numero: number; estado: EstadoOrden; fecha: string
    total: number; notas: string | null
    clientes: { nombre: string }[] | null
  }

  return ((data as unknown as Raw[]) ?? []).map(o => ({
    numero:        o.numero,
    clienteNombre: o.clientes?.[0]?.nombre ?? '—',
    fecha:         o.fecha,
    estado:        o.estado,
    total:         Number(o.total),
    notas:         o.notas,
  }))
}

export async function getReporteInventario(): Promise<ProductoReporte[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('codigo, nombre, categorias(nombre), unidad, stock, stock_minimo, precio')
    .order('nombre')
  if (error) throw error

  type RawCat = { nombre: string }
  type Raw = {
    codigo: string | null; nombre: string; unidad: string
    stock: number; stock_minimo: number; precio: number
    categorias: RawCat | RawCat[] | null
  }

  return ((data as unknown as Raw[]) ?? []).map(p => {
    const cat = Array.isArray(p.categorias)
      ? (p.categorias[0] as RawCat | undefined)?.nombre
      : (p.categorias as RawCat | null)?.nombre
    return {
      codigo:       p.codigo,
      nombre:       p.nombre,
      categoria:    cat ?? 'Sin categoria',
      unidad:       p.unidad,
      stock:        Number(p.stock),
      stock_minimo: Number(p.stock_minimo),
      precio:       Number(p.precio),
      estadoStock:  Number(p.stock) <= Number(p.stock_minimo) ? 'Bajo' : 'OK',
    }
  })
}

export async function getReporteClientes(): Promise<ClienteReporte[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('nombre, telefono, email, direccion, created_at')
    .order('nombre')
  if (error) throw error
  return (data ?? []) as ClienteReporte[]
}
