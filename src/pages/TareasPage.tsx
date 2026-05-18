import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus, Search, Pencil, Trash2, AlertTriangle,
  ChevronRight, ChevronLeft, CheckSquare,
} from 'lucide-react'

import { Button }          from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Select }          from '../components/ui/Select'
import { Modal }           from '../components/ui/Modal'
import { Spinner }         from '../components/ui/Spinner'
import { EmptyState }      from '../components/ui/EmptyState'
import { PrioridadBadge }  from '../components/ui/Badge'

import {
  getTareas, createTarea, updateTarea, deleteTarea, cambiarEstadoTarea,
  type TareaConOrden,
} from '../services/tareas'
import { getOrdenes } from '../services/ordenes'
import type { EstadoTarea, PrioridadTarea, TareaInsert } from '../types/database'
import { toast } from '../lib/toast'

// ---- Helpers -----------------------------------------------

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function todayISO() { return new Date().toISOString().split('T')[0] }

function isOverdue(t: TareaConOrden) {
  if (!t.fecha_vencimiento || t.estado === 'completada') return false
  return t.fecha_vencimiento < todayISO()
}

// ---- Kanban config -----------------------------------------

type ColConfig = { estado: EstadoTarea; label: string; headerColor: string }

const COLUMNAS: ColConfig[] = [
  { estado: 'pendiente',   label: 'Pendiente',   headerColor: 'border-t-yellow-400' },
  { estado: 'en_progreso', label: 'En Progreso', headerColor: 'border-t-blue-400'   },
  { estado: 'completada',  label: 'Completada',  headerColor: 'border-t-green-400'  },
]

const NEXT_STATE: Partial<Record<EstadoTarea, EstadoTarea>> = {
  pendiente:   'en_progreso',
  en_progreso: 'completada',
}
const PREV_STATE: Partial<Record<EstadoTarea, EstadoTarea>> = {
  en_progreso: 'pendiente',
  completada:  'en_progreso',
}

const PRIORIDAD_BORDER: Record<PrioridadTarea, string> = {
  alta:  'border-l-red-500',
  media: 'border-l-amber-400',
  baja:  'border-l-slate-300 dark:border-l-slate-600',
}

// ---- Schema ------------------------------------------------

const tareaSchema = z.object({
  titulo:            z.string().min(2, 'Minimo 2 caracteres'),
  descripcion:       z.string(),
  prioridad:         z.enum(['alta', 'media', 'baja']),
  estado:            z.enum(['pendiente', 'en_progreso', 'completada']),
  orden_id:          z.string(),
  asignado_a:        z.string(),
  fecha_vencimiento: z.string(),
})
type TareaFormData = z.infer<typeof tareaSchema>

// ---- Modal state -------------------------------------------

type ModalState =
  | { type: 'create' }
  | { type: 'edit';   tarea: TareaConOrden }
  | { type: 'delete'; tarea: TareaConOrden }
  | null

// ============================================================
// TareaFormModal
// ============================================================

function TareaFormModal({
  tarea,
  onClose,
}: {
  tarea?:  TareaConOrden
  onClose: () => void
}) {
  const qc        = useQueryClient()
  const isEditing = !!tarea

  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes', ''],
    queryFn:  () => getOrdenes(''),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<TareaFormData>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      titulo:            tarea?.titulo            ?? '',
      descripcion:       tarea?.descripcion       ?? '',
      prioridad:         tarea?.prioridad         ?? 'media',
      estado:            tarea?.estado            ?? 'pendiente',
      orden_id:          tarea?.orden_id          ?? '',
      asignado_a:        tarea?.asignado_a        ?? '',
      fecha_vencimiento: tarea?.fecha_vencimiento ?? '',
    },
  })

  const createMut = useMutation({
    mutationFn: (data: TareaInsert) => createTarea(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tareas'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Tarea creada')
      onClose()
    },
    onError: () => toast.error('Error al crear tarea'),
  })

  const updateMut = useMutation({
    mutationFn: (data: TareaInsert) => updateTarea(tarea!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tareas'] })
      toast.success('Tarea actualizada')
      onClose()
    },
    onError: () => toast.error('Error al actualizar tarea'),
  })

  const isPending = createMut.isPending || updateMut.isPending
  const isError   = createMut.isError   || updateMut.isError

  const onSubmit = (data: TareaFormData) => {
    const payload: TareaInsert = {
      titulo:            data.titulo.trim(),
      descripcion:       data.descripcion.trim() || null,
      prioridad:         data.prioridad,
      estado:            data.estado,
      orden_id:          data.orden_id || null,
      asignado_a:        data.asignado_a.trim() || null,
      fecha_vencimiento: data.fecha_vencimiento || null,
    }
    if (isEditing) updateMut.mutate(payload)
    else           createMut.mutate(payload)
  }

  const ordenOpts = ordenes.map(o => ({
    value: o.id,
    label: `#${o.numero} — ${o.clienteNombre}`,
  }))

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? 'Editar tarea' : 'Nueva tarea'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button form="tarea-form" type="submit" loading={isPending}>
            {isEditing ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <form id="tarea-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <Input
          label="Titulo *"
          placeholder="Descripcion breve de la tarea"
          autoFocus
          error={errors.titulo?.message}
          {...register('titulo')}
        />

        <Textarea
          label="Descripcion"
          placeholder="Detalles adicionales..."
          rows={2}
          {...register('descripcion')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Prioridad"
            options={[
              { value: 'alta',  label: 'Alta'  },
              { value: 'media', label: 'Media' },
              { value: 'baja',  label: 'Baja'  },
            ]}
            {...register('prioridad')}
          />
          <Select
            label="Estado"
            options={[
              { value: 'pendiente',   label: 'Pendiente'   },
              { value: 'en_progreso', label: 'En Progreso' },
              { value: 'completada',  label: 'Completada'  },
            ]}
            {...register('estado')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fecha vencimiento"
            type="date"
            {...register('fecha_vencimiento')}
          />
          <Input
            label="Asignado a"
            placeholder="Nombre del responsable"
            {...register('asignado_a')}
          />
        </div>

        <Select
          label="Orden asociada"
          placeholder="Sin orden asociada"
          options={ordenOpts}
          {...register('orden_id')}
        />

        {isError && (
          <p className="text-sm text-destructive">Error al guardar. Intenta de nuevo.</p>
        )}
      </form>
    </Modal>
  )
}

// ============================================================
// DeleteModal
// ============================================================

function DeleteModal({ tarea, onClose }: { tarea: TareaConOrden; onClose: () => void }) {
  const qc = useQueryClient()

  const deleteMut = useMutation({
    mutationFn: () => deleteTarea(tarea.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tareas'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Tarea eliminada')
      onClose()
    },
    onError: () => toast.error('Error al eliminar tarea'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Eliminar tarea"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={deleteMut.isPending}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteMut.mutate()} loading={deleteMut.isPending}>
            Eliminar
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        ¿Seguro que quieres eliminar{' '}
        <span className="font-semibold text-foreground">"{tarea.titulo}"</span>?
        Esta accion no se puede deshacer.
      </p>
      {deleteMut.isError && (
        <p className="text-sm text-destructive mt-3">Error al eliminar. Intenta de nuevo.</p>
      )}
    </Modal>
  )
}

// ============================================================
// TareaCard
// ============================================================

function TareaCard({
  tarea,
  onEdit,
  onDelete,
}: {
  tarea:    TareaConOrden
  onEdit:   (t: TareaConOrden) => void
  onDelete: (t: TareaConOrden) => void
}) {
  const qc      = useQueryClient()
  const overdue = isOverdue(tarea)

  const estadoMut = useMutation({
    mutationFn: (estado: EstadoTarea) => cambiarEstadoTarea(tarea.id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tareas'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.info('Estado actualizado')
    },
    onError: () => toast.error('Error al cambiar estado'),
  })

  const next = NEXT_STATE[tarea.estado]
  const prev = PREV_STATE[tarea.estado]

  return (
    <div className={`bg-card border border-border rounded-lg p-3 border-l-4 ${PRIORIDAD_BORDER[tarea.prioridad]} shadow-sm hover:shadow-md transition-shadow`}>

      {/* Priority + overdue */}
      <div className="flex items-center gap-1.5 mb-2">
        <PrioridadBadge prioridad={tarea.prioridad} />
        {overdue && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="w-3 h-3" /> Vencida
          </span>
        )}
      </div>

      {/* Title */}
      <p className={`text-sm font-medium leading-snug mb-1 ${tarea.estado === 'completada' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
        {tarea.titulo}
      </p>

      {/* Description */}
      {tarea.descripcion && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {tarea.descripcion}
        </p>
      )}

      {/* Meta */}
      <div className="flex flex-col gap-0.5 mb-3">
        {tarea.ordenNumero && (
          <p className="text-xs text-muted-foreground">Orden #{tarea.ordenNumero}</p>
        )}
        {tarea.asignado_a && (
          <p className="text-xs text-muted-foreground">Asignado: {tarea.asignado_a}</p>
        )}
        {tarea.fecha_vencimiento && (
          <p className={`text-xs ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
            Vence: {formatFecha(tarea.fecha_vencimiento)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
        {/* State navigation */}
        <div className="flex items-center gap-1">
          {prev && (
            <button
              onClick={() => estadoMut.mutate(prev)}
              disabled={estadoMut.isPending}
              title="Retroceder estado"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {next && (
            <button
              onClick={() => estadoMut.mutate(next)}
              disabled={estadoMut.isPending}
              title="Avanzar estado"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Edit / delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(tarea)}
            title="Editar"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(tarea)}
            title="Eliminar"
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// KanbanColumn
// ============================================================

function KanbanColumn({
  config,
  tareas,
  onEdit,
  onDelete,
}: {
  config:   ColConfig
  tareas:   TareaConOrden[]
  onEdit:   (t: TareaConOrden) => void
  onDelete: (t: TareaConOrden) => void
}) {
  return (
    <div className={`flex flex-col min-w-72 flex-1 bg-muted/40 rounded-xl border-t-4 ${config.headerColor} border border-border overflow-hidden`}>
      {/* Column header */}
      <div className="px-3 py-2.5 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-foreground">{config.label}</span>
        <span className="text-xs font-medium bg-background border border-border rounded-full px-2 py-0.5 text-muted-foreground">
          {tareas.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-32">
        {tareas.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Sin tareas</p>
        ) : (
          tareas.map(t => (
            <TareaCard key={t.id} tarea={t} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  )
}

// ============================================================
// TareasPage
// ============================================================

export function TareasPage() {
  const [search,    setSearch]    = useState('')
  const [prioridad, setPrioridad] = useState('')
  const [modal,     setModal]     = useState<ModalState>(null)

  const { data: allTareas, isLoading } = useQuery({
    queryKey: ['tareas', prioridad],
    queryFn:  () => getTareas(prioridad),
  })

  const tareas: TareaConOrden[] = (() => {
    if (!allTareas) return []
    if (!search.trim()) return allTareas
    const term = search.trim().toLowerCase()
    return allTareas.filter(t => t.titulo.toLowerCase().includes(term))
  })()

  const byEstado = (estado: EstadoTarea) =>
    tareas.filter(t => t.estado === estado)

  const close = () => setModal(null)

  return (
    <>
      <div className="flex flex-col gap-5 h-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tareas</h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? '...' : `${tareas.length} tarea${tareas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={() => setModal({ type: 'create' })}>
            <Plus className="w-4 h-4" /> Nueva tarea
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por titulo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <select
            value={prioridad}
            onChange={e => setPrioridad(e.target.value)}
            className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        {/* Kanban board */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-muted-foreground" />
          </div>
        ) : tareas.length === 0 && !search && !prioridad ? (
          <EmptyState
            icon={CheckSquare}
            title="Sin tareas aun"
            description="Crea tu primera tarea para comenzar."
            action={
              <Button size="sm" onClick={() => setModal({ type: 'create' })}>
                <Plus className="w-3.5 h-3.5" /> Nueva tarea
              </Button>
            }
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 flex-1">
            {COLUMNAS.map(col => (
              <KanbanColumn
                key={col.estado}
                config={col}
                tareas={byEstado(col.estado)}
                onEdit={t => setModal({ type: 'edit', tarea: t })}
                onDelete={t => setModal({ type: 'delete', tarea: t })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create' && <TareaFormModal                      onClose={close} />}
      {modal?.type === 'edit'   && <TareaFormModal tarea={modal.tarea}  onClose={close} />}
      {modal?.type === 'delete' && <DeleteModal    tarea={modal.tarea}  onClose={close} />}
    </>
  )
}
