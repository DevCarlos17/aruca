import { supabase } from '../lib/supabase'
import type { EstadoOrden, PrioridadTarea } from '../types/database'

// ---- Interfaces --------------------------------------------

export interface DashboardStats {
  totalOrdenes:     number
  tareasPendientes: number
  totalClientes:    number
  stockBajo:        number
}

export interface OrdenPorMes {
  mes:     string
  ordenes: number
  total:   number
}

export interface OrdenReciente {
  id:             string
  numero:         number
  estado:         EstadoOrden
  fecha:          string
  total:          number
  cliente_nombre: string | null
}

export interface TareaUrgente {
  id:                string
  titulo:            string
  prioridad:         PrioridadTarea
  estado:            string
  fecha_vencimiento: string | null
}

// ---- Queries -----------------------------------------------

export async function getStatsResumen(): Promise<DashboardStats> {
  const [
    { count: totalOrdenes },
    { count: tareasPendientes },
    { count: totalClientes },
    { data: productos },
  ] = await Promise.all([
    supabase.from('ordenes').select('*', { count: 'exact', head: true }),
    supabase.from('tareas').select('*', { count: 'exact', head: true })
      .in('estado', ['pendiente', 'en_progreso']),
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('productos').select('stock, stock_minimo'),
  ])

  const stockBajo = productos?.filter(
    p => Number(p.stock) <= Number(p.stock_minimo)
  ).length ?? 0

  return {
    totalOrdenes:     totalOrdenes ?? 0,
    tareasPendientes: tareasPendientes ?? 0,
    totalClientes:    totalClientes ?? 0,
    stockBajo,
  }
}

export async function getOrdenesPorMes(): Promise<OrdenPorMes[]> {
  // Armar los ultimos 6 meses, incluyendo meses sin ordenes
  const meses: Record<string, OrdenPorMes> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es', { month: 'short' })
    meses[key]  = {
      mes:     label.charAt(0).toUpperCase() + label.slice(1),
      ordenes: 0,
      total:   0,
    }
  }

  const fechaInicio = Object.keys(meses)[0] + '-01'
  const { data } = await supabase
    .from('ordenes')
    .select('fecha, total')
    .gte('fecha', fechaInicio)

  data?.forEach(o => {
    const [year, month] = o.fecha.split('-')
    const key = `${year}-${month}`
    if (meses[key]) {
      meses[key].ordenes += 1
      meses[key].total   += Number(o.total)
    }
  })

  return Object.values(meses)
}

export async function getOrdenesRecientes(): Promise<OrdenReciente[]> {
  const { data } = await supabase
    .from('ordenes')
    .select('id, numero, estado, fecha, total, clientes(nombre)')
    .order('created_at', { ascending: false })
    .limit(5)

  type Raw = {
    id: string; numero: number; estado: string
    fecha: string; total: number
    clientes: { nombre: string }[] | null
  }

  return (data as unknown as Raw[] ?? []).map(o => ({
    id:             o.id,
    numero:         o.numero,
    estado:         o.estado as EstadoOrden,
    fecha:          o.fecha,
    total:          Number(o.total),
    cliente_nombre: o.clientes?.[0]?.nombre ?? null,
  }))
}

export async function getTareasUrgentes(): Promise<TareaUrgente[]> {
  const { data } = await supabase
    .from('tareas')
    .select('id, titulo, prioridad, estado, fecha_vencimiento')
    .in('estado', ['pendiente', 'en_progreso'])
    .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
    .limit(10)

  const orden: Record<string, number> = { alta: 0, media: 1, baja: 2 }

  return (data ?? [])
    .sort((a, b) => (orden[a.prioridad] ?? 1) - (orden[b.prioridad] ?? 1))
    .slice(0, 5)
    .map(t => ({
      id:                t.id,
      titulo:            t.titulo,
      prioridad:         t.prioridad as PrioridadTarea,
      estado:            t.estado,
      fecha_vencimiento: t.fecha_vencimiento,
    }))
}
