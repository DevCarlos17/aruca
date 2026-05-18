import { supabase } from '../lib/supabase'
import type { EstadoOrden, OrdenInsert, OrdenItemInsert } from '../types/database'

// ---- Raw Supabase shapes -----------------------------------

type RawCliente = { nombre: string; telefono: string | null; email: string | null }

type RawItem = {
  id:              string
  orden_id:        string
  producto_id:     string | null
  cantidad:        number
  precio_unitario: number
  subtotal:        number
  productos: { id: string; nombre: string; codigo: string | null; unidad: string } | null
}

type RawOrden = {
  id:         string
  numero:     number
  cliente_id: string | null
  estado:     EstadoOrden
  fecha:      string
  total:      number
  notas:      string | null
  created_at: string
  clientes:   RawCliente[] | null
  orden_items?: RawItem[]
}

// ---- Exported types ----------------------------------------

export type OrdenConCliente = {
  id:           string
  numero:       number
  cliente_id:   string | null
  clienteNombre: string
  estado:       EstadoOrden
  fecha:        string
  total:        number
  notas:        string | null
  created_at:   string
}

export type OrdenItemDetalle = {
  id:              string
  producto_id:     string | null
  productoNombre:  string
  productoCodigo:  string | null
  productoUnidad:  string
  cantidad:        number
  precio_unitario: number
  subtotal:        number
}

export type OrdenDetalle = OrdenConCliente & {
  clienteTelefono: string | null
  clienteEmail:    string | null
  items:           OrdenItemDetalle[]
}

// ---- Internal mapper ---------------------------------------

function mapOrden(o: RawOrden): OrdenConCliente {
  return {
    id:            o.id,
    numero:        o.numero,
    cliente_id:    o.cliente_id,
    clienteNombre: o.clientes?.[0]?.nombre ?? '—',
    estado:        o.estado,
    fecha:         o.fecha,
    total:         o.total,
    notas:         o.notas,
    created_at:    o.created_at,
  }
}

// ---- Service functions -------------------------------------

export async function getOrdenes(estado = ''): Promise<OrdenConCliente[]> {
  let query = supabase
    .from('ordenes')
    .select('*, clientes(nombre)')
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) throw error
  return ((data as unknown as RawOrden[]) ?? []).map(mapOrden)
}

export async function getOrdenDetalle(id: string): Promise<OrdenDetalle> {
  const { data, error } = await supabase
    .from('ordenes')
    .select('*, clientes(nombre, telefono, email), orden_items(*, productos(id, nombre, codigo, unidad))')
    .eq('id', id)
    .single()
  if (error) throw error

  const raw = data as unknown as RawOrden

  return {
    ...mapOrden(raw),
    clienteTelefono: raw.clientes?.[0]?.telefono ?? null,
    clienteEmail:    raw.clientes?.[0]?.email    ?? null,
    items: (raw.orden_items ?? []).map(item => ({
      id:              item.id,
      producto_id:     item.producto_id,
      productoNombre:  item.productos?.nombre ?? '—',
      productoCodigo:  item.productos?.codigo ?? null,
      productoUnidad:  item.productos?.unidad ?? '',
      cantidad:        item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal:        item.subtotal,
    })),
  }
}

export async function createOrden(
  ordenData: OrdenInsert,
  items: Array<{ producto_id: string; cantidad: number; precio_unitario: number }>,
): Promise<string> {
  const { data: orden, error: ordenError } = await supabase
    .from('ordenes')
    .insert(ordenData)
    .select('id')
    .single()
  if (ordenError) throw ordenError

  if (items.length > 0) {
    const rows: OrdenItemInsert[] = items.map(item => ({ ...item, orden_id: orden.id }))
    const { error } = await supabase.from('orden_items').insert(rows)
    if (error) throw error
  }

  return orden.id
}

export async function updateOrden(
  id: string,
  ordenData: Partial<OrdenInsert>,
  items: Array<{ producto_id: string; cantidad: number; precio_unitario: number }>,
): Promise<void> {
  const { error: updateError } = await supabase.from('ordenes').update(ordenData).eq('id', id)
  if (updateError) throw updateError

  // Replace all items (cascade delete + re-insert)
  const { error: delError } = await supabase.from('orden_items').delete().eq('orden_id', id)
  if (delError) throw delError

  if (items.length > 0) {
    const rows: OrdenItemInsert[] = items.map(item => ({ ...item, orden_id: id }))
    const { error } = await supabase.from('orden_items').insert(rows)
    if (error) throw error
  }
}

export async function cambiarEstado(id: string, estado: EstadoOrden): Promise<void> {
  const { error } = await supabase.from('ordenes').update({ estado }).eq('id', id)
  if (error) throw error
}

export async function deleteOrden(id: string): Promise<void> {
  // orden_items are cascade-deleted automatically
  const { error } = await supabase.from('ordenes').delete().eq('id', id)
  if (error) throw error
}
