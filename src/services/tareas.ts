import { supabase } from '../lib/supabase'
import type { Tarea, TareaInsert, TareaUpdate, PrioridadTarea } from '../types/database'

// ---- Types -------------------------------------------------

export type TareaConOrden = {
  id:               string
  titulo:           string
  descripcion:      string | null
  estado:           Tarea['estado']
  prioridad:        PrioridadTarea
  orden_id:         string | null
  asignado_a:       string | null
  fecha_vencimiento: string | null
  created_at:       string
  ordenNumero:      number | null
}

// ---- Internal helpers --------------------------------------

const PRIORIDAD_ORDER: Record<PrioridadTarea, number> = { alta: 0, media: 1, baja: 2 }

function extractNumero(ordenes: unknown): number | null {
  if (!ordenes) return null
  if (Array.isArray(ordenes)) return (ordenes[0] as { numero: number } | undefined)?.numero ?? null
  return (ordenes as { numero: number }).numero ?? null
}

// ---- Service functions -------------------------------------

export async function getTareas(
  prioridad = '',
  ordenId   = '',
): Promise<TareaConOrden[]> {
  let query = supabase
    .from('tareas')
    .select('*, ordenes(id, numero)')
    .order('created_at', { ascending: false })

  if (prioridad) query = query.eq('prioridad', prioridad)
  if (ordenId)   query = query.eq('orden_id',  ordenId)

  const { data, error } = await query
  if (error) throw error

  const rows: TareaConOrden[] = ((data ?? []) as Record<string, unknown>[]).map(t => ({
    id:               t.id               as string,
    titulo:           t.titulo           as string,
    descripcion:      t.descripcion      as string | null,
    estado:           t.estado           as Tarea['estado'],
    prioridad:        t.prioridad        as PrioridadTarea,
    orden_id:         t.orden_id         as string | null,
    asignado_a:       t.asignado_a       as string | null,
    fecha_vencimiento: t.fecha_vencimiento as string | null,
    created_at:       t.created_at       as string,
    ordenNumero:      extractNumero(t.ordenes),
  }))

  // Sort: alta → media → baja, then by created_at (already desc from DB)
  return rows.sort((a, b) => PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad])
}

export async function createTarea(data: TareaInsert): Promise<Tarea> {
  const { data: created, error } = await supabase
    .from('tareas').insert(data).select().single()
  if (error) throw error
  return created as Tarea
}

export async function updateTarea(id: string, data: TareaUpdate): Promise<Tarea> {
  const { data: updated, error } = await supabase
    .from('tareas').update(data).eq('id', id).select().single()
  if (error) throw error
  return updated as Tarea
}

export async function cambiarEstadoTarea(id: string, estado: Tarea['estado']): Promise<void> {
  const { error } = await supabase.from('tareas').update({ estado }).eq('id', id)
  if (error) throw error
}

export async function deleteTarea(id: string): Promise<void> {
  const { error } = await supabase.from('tareas').delete().eq('id', id)
  if (error) throw error
}
