import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus, Search, Pencil, Trash2, Eye, ClipboardList, X,
  ChevronRight, PhoneCall, Mail,
} from 'lucide-react'

import { Button }           from '../components/ui/Button'
import { Input, Textarea }  from '../components/ui/Input'
import { Select }           from '../components/ui/Select'
import { Modal }            from '../components/ui/Modal'
import { Spinner }          from '../components/ui/Spinner'
import { EmptyState }       from '../components/ui/EmptyState'
import { EstadoOrdenBadge } from '../components/ui/Badge'
import {
  TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell,
} from '../components/ui/Table'

import {
  getOrdenes, getOrdenDetalle, createOrden, updateOrden, cambiarEstado, deleteOrden,
  type OrdenConCliente,
} from '../services/ordenes'
import { getClientes }  from '../services/clientes'
import { getProductos } from '../services/productos'
import type { EstadoOrden } from '../types/database'
import { toast } from '../lib/toast'

// ---- Helpers -----------------------------------------------

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}
function formatMonto(n: number) { return `$${n.toLocaleString('es')}` }
function todayISO() { return new Date().toISOString().split('T')[0] }

// ---- Schema ------------------------------------------------

const itemSchema = z.object({
  producto_id:     z.string().min(1, 'Selecciona un producto'),
  cantidad:        z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0,  'Cantidad invalida'),
  precio_unitario: z.string().refine(v => !isNaN(Number(v)) && Number(v) >= 0, 'Precio invalido'),
})

const ordenSchema = z.object({
  cliente_id: z.string().min(1, 'Selecciona un cliente'),
  fecha:      z.string().min(1, 'Ingresa la fecha'),
  notas:      z.string(),
  items:      z.array(itemSchema).min(1, 'Agrega al menos un producto'),
})
type OrdenFormData = z.infer<typeof ordenSchema>

// ---- Estado options ----------------------------------------

const ESTADO_OPTIONS = [
  { value: '',           label: 'Todos los estados' },
  { value: 'pendiente',  label: 'Pendiente'         },
  { value: 'en_proceso', label: 'En proceso'        },
  { value: 'completada', label: 'Completada'        },
  { value: 'cancelada',  label: 'Cancelada'         },
]

// ---- Modal state -------------------------------------------

type ModalState =
  | { type: 'create' }
  | { type: 'edit';    ordenId: string }
  | { type: 'delete';  orden:   OrdenConCliente }
  | { type: 'detalle'; ordenId: string }
  | null

// ============================================================
// OrdenFormModal
// ============================================================

function OrdenFormModal({
  ordenId,
  onClose,
}: {
  ordenId?: string
  onClose:  () => void
}) {
  const qc        = useQueryClient()
  const isEditing = !!ordenId

  const { data: clientes  = [] } = useQuery({
    queryKey: ['clientes', ''],
    queryFn:  () => getClientes(''),
  })
  const { data: productos = [] } = useQuery({
    queryKey: ['productos', '', ''],
    queryFn:  () => getProductos('', ''),
  })
  const { data: ordenDetalle, isLoading: loadingDetalle } = useQuery({
    queryKey: ['orden-detalle', ordenId],
    queryFn:  () => getOrdenDetalle(ordenId!),
    enabled:  isEditing,
  })

  const {
    register, handleSubmit, control, setValue, reset,
    formState: { errors },
  } = useForm<OrdenFormData>({
    resolver: zodResolver(ordenSchema),
    defaultValues: { cliente_id: '', fecha: todayISO(), notas: '', items: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = useWatch({ control, name: 'items' })

  const total = (watchedItems ?? []).reduce((sum, item) =>
    sum + (Number(item?.cantidad) || 0) * (Number(item?.precio_unitario) || 0), 0)

  // Populate form when editing
  useEffect(() => {
    if (ordenDetalle) {
      reset({
        cliente_id: ordenDetalle.cliente_id ?? '',
        fecha:      ordenDetalle.fecha,
        notas:      ordenDetalle.notas ?? '',
        items: ordenDetalle.items.map(item => ({
          producto_id:     item.producto_id     ?? '',
          cantidad:        String(item.cantidad),
          precio_unitario: String(item.precio_unitario),
        })),
      })
    }
  }, [ordenDetalle, reset])

  const createMut = useMutation({
    mutationFn: (payload: { ordenData: Parameters<typeof createOrden>[0]; items: Parameters<typeof createOrden>[1] }) =>
      createOrden(payload.ordenData, payload.items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Orden creada')
      onClose()
    },
    onError: () => toast.error('Error al crear orden'),
  })

  const updateMut = useMutation({
    mutationFn: (payload: { ordenData: Parameters<typeof updateOrden>[1]; items: Parameters<typeof updateOrden>[2] }) =>
      updateOrden(ordenId!, payload.ordenData, payload.items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes'] })
      qc.invalidateQueries({ queryKey: ['orden-detalle', ordenId] })
      toast.success('Orden actualizada')
      onClose()
    },
    onError: () => toast.error('Error al actualizar orden'),
  })

  const isPending = createMut.isPending || updateMut.isPending
  const isError   = createMut.isError   || updateMut.isError

  const onSubmit = (data: OrdenFormData) => {
    const items = data.items.map(item => ({
      producto_id:     item.producto_id,
      cantidad:        Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
    }))
    const totalCalc = items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)

    if (isEditing) {
      updateMut.mutate({
        ordenData: {
          cliente_id: data.cliente_id,
          fecha:      data.fecha,
          total:      totalCalc,
          notas:      data.notas.trim() || null,
        },
        items,
      })
    } else {
      createMut.mutate({
        ordenData: {
          cliente_id: data.cliente_id,
          estado:     'pendiente',
          fecha:      data.fecha,
          total:      totalCalc,
          notas:      data.notas.trim() || null,
        },
        items,
      })
    }
  }

  const clienteOpts  = clientes.map(c => ({ value: c.id, label: c.nombre }))
  const productoOpts = productos.map(p => ({
    value: p.id,
    label: p.codigo ? `[${p.codigo}] ${p.nombre}` : p.nombre,
  }))

  if (isEditing && loadingDetalle) {
    return (
      <Modal open onClose={onClose} title="Editar orden">
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-muted-foreground" />
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? `Editar orden #${ordenDetalle?.numero ?? ''}` : 'Nueva orden'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button form="orden-form" type="submit" loading={isPending}>
            {isEditing ? 'Guardar cambios' : 'Crear orden'}
          </Button>
        </>
      }
    >
      <form id="orden-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Cliente y Fecha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Cliente *"
            placeholder="Seleccionar cliente"
            options={clienteOpts}
            error={errors.cliente_id?.message}
            {...register('cliente_id')}
          />
          <Input
            label="Fecha *"
            type="date"
            error={errors.fecha?.message}
            {...register('fecha')}
          />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Productos *
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ producto_id: '', cantidad: '1', precio_unitario: '0' })}
            >
              <Plus className="w-3.5 h-3.5" /> Agregar
            </Button>
          </div>

          {errors.items && typeof errors.items.message === 'string' && (
            <p className="text-xs text-destructive mb-2">{errors.items.message}</p>
          )}

          {fields.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground">Sin productos. Agrega al menos uno.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Column headers */}
              <div className="flex gap-2 text-xs text-muted-foreground px-1 hidden sm:flex">
                <span className="flex-1">Producto</span>
                <span className="w-20 shrink-0">Cantidad</span>
                <span className="w-24 shrink-0">Precio</span>
                <span className="w-24 shrink-0 text-right">Subtotal</span>
                <span className="w-8 shrink-0" />
              </div>
              {fields.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-start">
                  {/* Producto */}
                  <div className="flex-1 min-w-0">
                    <Controller
                      control={control}
                      name={`items.${i}.producto_id`}
                      render={({ field: f }) => (
                        <select
                          {...f}
                          onChange={(e) => {
                            f.onChange(e)
                            const prod = productos.find(p => p.id === e.target.value)
                            if (prod) setValue(`items.${i}.precio_unitario`, String(prod.precio))
                          }}
                          className="w-full px-2 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        >
                          <option value="">Producto...</option>
                          {productoOpts.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.items?.[i]?.producto_id && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.items[i].producto_id?.message}
                      </p>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="w-20 shrink-0">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Cant."
                      {...register(`items.${i}.cantidad`)}
                      className="w-full px-2 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                    {errors.items?.[i]?.cantidad && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.items[i].cantidad?.message}
                      </p>
                    )}
                  </div>

                  {/* Precio unitario */}
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Precio"
                      {...register(`items.${i}.precio_unitario`)}
                      className="w-full px-2 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                    {errors.items?.[i]?.precio_unitario && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.items[i].precio_unitario?.message}
                      </p>
                    )}
                  </div>

                  {/* Subtotal display */}
                  <div className="w-24 shrink-0 py-2 text-sm text-right text-muted-foreground tabular-nums">
                    {formatMonto(
                      (Number(watchedItems?.[i]?.cantidad) || 0) *
                      (Number(watchedItems?.[i]?.precio_unitario) || 0),
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {fields.length > 0 && (
            <div className="flex justify-end items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="text-base font-semibold text-foreground tabular-nums">
                {formatMonto(total)}
              </span>
            </div>
          )}
        </div>

        {/* Notas */}
        <Textarea
          label="Notas"
          placeholder="Indicaciones adicionales..."
          rows={2}
          {...register('notas')}
        />

        {isError && (
          <p className="text-sm text-destructive">Error al guardar. Intenta de nuevo.</p>
        )}
      </form>
    </Modal>
  )
}

// ============================================================
// OrdenDetalleModal
// ============================================================

function OrdenDetalleModal({ ordenId, onClose }: { ordenId: string; onClose: () => void }) {
  const qc = useQueryClient()

  const { data: orden, isLoading } = useQuery({
    queryKey: ['orden-detalle', ordenId],
    queryFn:  () => getOrdenDetalle(ordenId),
  })

  const estadoMut = useMutation({
    mutationFn: (estado: EstadoOrden) => cambiarEstado(ordenId, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes'] })
      qc.invalidateQueries({ queryKey: ['orden-detalle', ordenId] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al cambiar estado'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={orden ? `Orden #${orden.numero}` : 'Detalle de orden'}
      size="lg"
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-muted-foreground" />
        </div>
      ) : !orden ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No se pudo cargar la orden.
        </p>
      ) : (
        <div className="space-y-5">

          {/* Header info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cliente</p>
              <p className="text-sm font-semibold text-foreground">{orden.clienteNombre}</p>
              {orden.clienteTelefono && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <PhoneCall className="w-3 h-3" /> {orden.clienteTelefono}
                </p>
              )}
              {orden.clienteEmail && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> {orden.clienteEmail}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha</p>
                <p className="text-sm text-foreground">{formatFecha(orden.fecha)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estado</p>
                <EstadoOrdenBadge estado={orden.estado} />
              </div>
            </div>
          </div>

          {/* Items table */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Productos</p>
            {orden.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin items registrados.</p>
            ) : (
              <TableRoot>
                <TableHead>
                  <tr>
                    <TableHeader>Producto</TableHeader>
                    <TableHeader className="text-right">Cant.</TableHeader>
                    <TableHeader className="hidden sm:table-cell text-right">P. Unitario</TableHeader>
                    <TableHeader className="text-right">Subtotal</TableHeader>
                  </tr>
                </TableHead>
                <TableBody>
                  {orden.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productoNombre}</p>
                          {item.productoCodigo && (
                            <p className="text-xs text-muted-foreground">{item.productoCodigo}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.cantidad} {item.productoUnidad}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground">
                        {formatMonto(item.precio_unitario)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMonto(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            )}
            <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="text-base font-semibold text-foreground tabular-nums">
                {formatMonto(orden.total)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {orden.notas && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-foreground bg-muted/50 rounded-md px-3 py-2">
                {orden.notas}
              </p>
            </div>
          )}

          {/* Status change actions */}
          {(orden.estado === 'pendiente' || orden.estado === 'en_proceso') && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {orden.estado === 'pendiente' && (
                <Button
                  size="sm"
                  onClick={() => estadoMut.mutate('en_proceso')}
                  loading={estadoMut.isPending}
                >
                  <ChevronRight className="w-3.5 h-3.5" /> Iniciar trabajo
                </Button>
              )}
              {orden.estado === 'en_proceso' && (
                <Button
                  size="sm"
                  onClick={() => estadoMut.mutate('completada')}
                  loading={estadoMut.isPending}
                >
                  <ChevronRight className="w-3.5 h-3.5" /> Marcar completada
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => estadoMut.mutate('cancelada')}
                loading={estadoMut.isPending}
              >
                Cancelar orden
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ============================================================
// DeleteModal
// ============================================================

function DeleteModal({ orden, onClose }: { orden: OrdenConCliente; onClose: () => void }) {
  const qc = useQueryClient()

  const deleteMut = useMutation({
    mutationFn: () => deleteOrden(orden.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Orden eliminada')
      onClose()
    },
    onError: () => toast.error('Error al eliminar orden'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Eliminar orden"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={deleteMut.isPending}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMut.mutate()}
            loading={deleteMut.isPending}
          >
            Eliminar
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        ¿Seguro que quieres eliminar la{' '}
        <span className="font-semibold text-foreground">Orden #{orden.numero}</span>{' '}
        de {orden.clienteNombre}? Esta accion no se puede deshacer.
      </p>
      {deleteMut.isError && (
        <p className="text-sm text-destructive mt-3">Error al eliminar. Intenta de nuevo.</p>
      )}
    </Modal>
  )
}

// ============================================================
// OrdenesPage
// ============================================================

export function OrdenesPage() {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [modal,  setModal]  = useState<ModalState>(null)

  const { data: allOrdenes, isLoading } = useQuery({
    queryKey: ['ordenes', estado],
    queryFn:  () => getOrdenes(estado),
  })

  const ordenes = (() => {
    if (!allOrdenes) return []
    if (!search.trim()) return allOrdenes
    const term = search.trim().toLowerCase()
    return allOrdenes.filter(
      o => String(o.numero).includes(term) || o.clienteNombre.toLowerCase().includes(term),
    )
  })()

  const close = () => setModal(null)

  return (
    <>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ordenes</h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? '...' : `${ordenes.length} registros`}
            </p>
          </div>
          <Button onClick={() => setModal({ type: 'create' })}>
            <Plus className="w-4 h-4" /> Nueva orden
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por #orden o cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            {ESTADO_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-muted-foreground" />
          </div>
        ) : !ordenes.length ? (
          <EmptyState
            icon={ClipboardList}
            title={search || estado ? 'Sin resultados' : 'Sin ordenes aun'}
            description={
              search || estado
                ? 'Intenta cambiar los filtros de busqueda.'
                : 'Crea tu primera orden para comenzar.'
            }
            action={
              !search && !estado ? (
                <Button size="sm" onClick={() => setModal({ type: 'create' })}>
                  <Plus className="w-3.5 h-3.5" /> Nueva orden
                </Button>
              ) : undefined
            }
          />
        ) : (
          <TableRoot>
            <TableHead>
              <tr>
                <TableHeader>#</TableHeader>
                <TableHeader>Cliente</TableHeader>
                <TableHeader className="hidden sm:table-cell">Fecha</TableHeader>
                <TableHeader>Estado</TableHeader>
                <TableHeader className="hidden md:table-cell text-right">Total</TableHeader>
                <TableHeader className="text-right">Acciones</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {ordenes.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-muted-foreground w-12">
                    #{o.numero}
                  </TableCell>
                  <TableCell className="font-medium max-w-[140px] truncate">
                    {o.clienteNombre}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatFecha(o.fecha)}
                  </TableCell>
                  <TableCell>
                    <EstadoOrdenBadge estado={o.estado} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right font-medium tabular-nums">
                    {formatMonto(o.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal({ type: 'detalle', ordenId: o.id })}
                        title="Ver detalle"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'edit', ordenId: o.id })}
                        title="Editar"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', orden: o })}
                        title="Eliminar"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create'  && <OrdenFormModal                       onClose={close} />}
      {modal?.type === 'edit'    && <OrdenFormModal ordenId={modal.ordenId} onClose={close} />}
      {modal?.type === 'detalle' && <OrdenDetalleModal ordenId={modal.ordenId} onClose={close} />}
      {modal?.type === 'delete'  && <DeleteModal    orden={modal.orden}    onClose={close} />}
    </>
  )
}
