import { supabase } from '../lib/supabase'
import type { Cliente, ClienteInsert, ClienteUpdate, EstadoOrden } from '../types/database'

export type OrdenResumen = {
  id:     string
  numero: number
  estado: EstadoOrden
  fecha:  string
  total:  number
}

export async function getClientes(search = ''): Promise<Cliente[]> {
  let query = supabase.from('clientes').select('*').order('nombre')
  if (search.trim()) {
    query = query.ilike('nombre', `%${search.trim()}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Cliente[]
}

export async function createCliente(data: ClienteInsert): Promise<Cliente> {
  const { data: created, error } = await supabase
    .from('clientes').insert(data).select().single()
  if (error) throw error
  return created as Cliente
}

export async function updateCliente(id: string, data: ClienteUpdate): Promise<Cliente> {
  const { data: updated, error } = await supabase
    .from('clientes').update(data).eq('id', id).select().single()
  if (error) throw error
  return updated as Cliente
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
}

export async function getOrdenesByCliente(clienteId: string): Promise<OrdenResumen[]> {
  const { data, error } = await supabase
    .from('ordenes')
    .select('id, numero, estado, fecha, total')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as OrdenResumen[]
}
