import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus, Search, Pencil, Trash2, Package,
  TrendingUp, TrendingDown, AlertTriangle, Tag, Check, X,
} from 'lucide-react'
import { cn } from '../lib/utils'

import { Button }     from '../components/ui/Button'
import { Input }      from '../components/ui/Input'
import { Select }     from '../components/ui/Select'
import { Modal }      from '../components/ui/Modal'
import { Spinner }    from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import {
  TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell,
} from '../components/ui/Table'

import {
  getProductos, createProducto, updateProducto, deleteProducto, ajustarStock,
  type ProductoConCategoria,
} from '../services/productos'
import {
  getCategorias, createCategoria, updateCategoria, deleteCategoria,
} from '../services/categorias'
import type { ProductoInsert, Categoria, CategoriaInsert } from '../types/database'
import { toast } from '../lib/toast'

// ---- Constantes --------------------------------------------

const UNIDADES = [
  { value: 'unidad',  label: 'Unidad'           },
  { value: 'kg',      label: 'Kilogramo (kg)'   },
  { value: 'gramo',   label: 'Gramo (g)'        },
  { value: 'litro',   label: 'Litro (L)'        },
  { value: 'ml',      label: 'Mililitro (mL)'   },
  { value: 'metro',   label: 'Metro (m)'        },
  { value: 'cm',      label: 'Centimetro (cm)'  },
  { value: 'par',     label: 'Par'              },
  { value: 'caja',    label: 'Caja'             },
  { value: 'paquete', label: 'Paquete'          },
  { value: 'rollo',   label: 'Rollo'            },
  { value: 'bolsa',   label: 'Bolsa'            },
  { value: 'set',     label: 'Set'              },
]

// ---- Schemas -----------------------------------------------

const productoSchema = z.object({
  codigo:       z.string(),
  nombre:       z.string().min(2, 'Minimo 2 caracteres'),
  categoria_id: z.string(),
  unidad:       z.string().min(1, 'Selecciona una unidad'),
  stock:        z.string().refine(v => !isNaN(Number(v)) && Number(v) >= 0, 'Debe ser >= 0'),
  stock_minimo: z.string().refine(v => !isNaN(Number(v)) && Number(v) >= 0, 'Debe ser >= 0'),
  precio:       z.string().refine(v => !isNaN(Number(v)) && Number(v) >= 0, 'Debe ser >= 0'),
})
type ProductoFormData = z.infer<typeof productoSchema>

const ajusteSchema = z.object({
  tipo:     z.enum(['entrada', 'salida']),
  cantidad: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Debe ser mayor a 0'),
})
type AjusteFormData = z.infer<typeof ajusteSchema>

// ---- Helpers -----------------------------------------------

function formatMonto(n: number) { return `$${n.toLocaleString('es')}` }

type ModalState =
  | { type: 'create' }
  | { type: 'edit';       producto: ProductoConCategoria }
  | { type: 'delete';     producto: ProductoConCategoria }
  | { type: 'ajuste';     producto: ProductoConCategoria }
  | { type: 'categorias' }
  | null

// ============================================================
// ProductoFormModal
// ============================================================

interface ProductoFormModalProps {
  producto:   ProductoConCategoria | null
  categorias: Categoria[]
  onClose:    () => void
}

function ProductoFormModal({ producto, categorias, onClose }: ProductoFormModalProps) {
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo:       producto?.codigo                    ?? '',
      nombre:       producto?.nombre                    ?? '',
      categoria_id: producto?.categoria_id              ?? '',
      unidad:       producto?.unidad                    ?? 'unidad',
      stock:        String(producto?.stock        ?? 0),
      stock_minimo: String(producto?.stock_minimo ?? 0),
      precio:       String(producto?.precio       ?? 0),
    },
  })

  const createMut = useMutation({
    mutationFn: (data: ProductoInsert) => createProducto(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Producto creado')
      onClose()
    },
    onError: () => toast.error('Error al crear producto'),
  })

  const updateMut = useMutation({
    mutationFn: (data: ProductoInsert) => updateProducto(producto!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Producto actualizado')
      onClose()
    },
    onError: () => toast.error('Error al actualizar producto'),
  })

  const isPending = producto ? updateMut.isPending : createMut.isPending
  const isError   = producto ? updateMut.isError   : createMut.isError

  const onSubmit = (data: ProductoFormData) => {
    const payload: ProductoInsert = {
      codigo:       data.codigo.trim()  || null,
      nombre:       data.nombre.trim(),
      categoria_id: data.categoria_id   || null,
      unidad:       data.unidad,
      stock:        Number(data.stock),
      stock_minimo: Number(data.stock_minimo),
      precio:       Number(data.precio),
    }
    if (producto) updateMut.mutate(payload)
    else          createMut.mutate(payload)
  }

  const catOptions = categorias.map(c => ({ value: c.id, label: c.nombre }))

  return (
    <Modal
      open
      onClose={onClose}
      title={producto ? 'Editar producto' : 'Nuevo producto'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button form="producto-form" type="submit" loading={isPending}>
            {producto ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </>
      }
    >
      <form id="producto-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            placeholder="Tornillo hex M8"
            autoFocus
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          <Input
            label="Codigo"
            placeholder="TOR-M8-001"
            error={errors.codigo?.message}
            {...register('codigo')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Categoria"
            placeholder="Sin categoria"
            options={catOptions}
            error={errors.categoria_id?.message}
            {...register('categoria_id')}
          />
          <Select
            label="Unidad *"
            options={UNIDADES}
            error={errors.unidad?.message}
            {...register('unidad')}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Stock"
            type="number"
            min="0"
            step="0.01"
            error={errors.stock?.message}
            {...register('stock')}
          />
          <Input
            label="Stock minimo"
            type="number"
            min="0"
            step="0.01"
            error={errors.stock_minimo?.message}
            {...register('stock_minimo')}
          />
          <Input
            label="Precio ($)"
            type="number"
            min="0"
            step="0.01"
            error={errors.precio?.message}
            {...register('precio')}
          />
        </div>

        {isError && (
          <p className="text-sm text-destructive">Error al guardar. Intenta de nuevo.</p>
        )}
      </form>
    </Modal>
  )
}

// ============================================================
// AjusteStockModal
// ============================================================

function AjusteStockModal({ producto, onClose }: { producto: ProductoConCategoria; onClose: () => void }) {
  const qc = useQueryClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AjusteFormData>({
    resolver: zodResolver(ajusteSchema),
    defaultValues: { tipo: 'entrada' as const, cantidad: '' },
  })

  const tipo = watch('tipo')

  const ajusteMut = useMutation({
    mutationFn: (data: AjusteFormData) => ajustarStock(producto.id, Number(data.cantidad), data.tipo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Stock ajustado')
      onClose()
    },
    onError: () => toast.error('Error al ajustar stock'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={`Ajustar stock: ${producto.nombre}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={ajusteMut.isPending}>Cancelar</Button>
          <Button form="ajuste-form" type="submit" loading={ajusteMut.isPending}>
            Confirmar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Stock actual */}
        <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-muted-foreground">Stock actual</span>
          <span className="font-semibold text-foreground">
            {producto.stock} {producto.unidad}
          </span>
        </div>

        <form id="ajuste-form" onSubmit={handleSubmit(d => ajusteMut.mutate(d))} className="space-y-4">
          {/* Toggle entrada / salida */}
          <div className="grid grid-cols-2 gap-2">
            {(['entrada', 'salida'] as const).map(t => (
              <label
                key={t}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors',
                  tipo === t
                    ? t === 'entrada'
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    : 'border-border text-muted-foreground hover:bg-accent',
                )}
              >
                <input type="radio" value={t} {...register('tipo')} className="sr-only" />
                {t === 'entrada'
                  ? <TrendingUp className="w-4 h-4" />
                  : <TrendingDown className="w-4 h-4" />
                }
                {t === 'entrada' ? 'Entrada' : 'Salida'}
              </label>
            ))}
          </div>

          <Input
            label={`Cantidad (${producto.unidad})`}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0"
            autoFocus
            error={errors.cantidad?.message}
            {...register('cantidad')}
          />
        </form>

        {ajusteMut.isError && (
          <p className="text-sm text-destructive">Error al ajustar. Intenta de nuevo.</p>
        )}
      </div>
    </Modal>
  )
}

// ============================================================
// CategoriasModal
// ============================================================

function CategoriasModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [editNombre,   setEditNombre]   = useState('')
  const [newNombre,    setNewNombre]    = useState('')
  const [showNewForm,  setShowNewForm]  = useState(false)

  const { data: categorias, isLoading } = useQuery({
    queryKey: ['categorias'],
    queryFn:  getCategorias,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['categorias'] })
    qc.invalidateQueries({ queryKey: ['productos'] })
  }

  const createMut = useMutation({
    mutationFn: (nombre: string) => createCategoria({ nombre, descripcion: null } as CategoriaInsert),
    onSuccess: () => { invalidate(); setNewNombre(''); setShowNewForm(false) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) =>
      updateCategoria(id, { nombre }),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategoria(id),
    onSuccess:  () => invalidate(),
  })

  return (
    <Modal open onClose={onClose} title="Gestionar categorias" size="sm">
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner className="text-muted-foreground" /></div>
        ) : !categorias?.length && !showNewForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay categorias. Crea la primera.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {categorias?.map((cat: Categoria) => (
              <li key={cat.id} className="flex items-center gap-2 px-3 py-2.5 bg-card">
                {editingId === cat.id ? (
                  <>
                    <input
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                      className="flex-1 text-sm border border-input rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      autoFocus
                    />
                    <button
                      onClick={() => updateMut.mutate({ id: cat.id, nombre: editNombre })}
                      disabled={updateMut.isPending || !editNombre.trim()}
                      className="p-1 rounded text-green-600 hover:bg-green-50 disabled:opacity-40"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded text-muted-foreground hover:bg-accent"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground">{cat.nombre}</span>
                    <button
                      onClick={() => { setEditingId(cat.id); setEditNombre(cat.nombre) }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMut.mutate(cat.id)}
                      disabled={deleteMut.isPending}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Nueva categoria */}
        {showNewForm ? (
          <div className="flex gap-2">
            <input
              value={newNombre}
              onChange={e => setNewNombre(e.target.value)}
              placeholder="Nombre de categoria"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && newNombre.trim()) createMut.mutate(newNombre.trim())
                if (e.key === 'Escape') setShowNewForm(false)
              }}
              className="flex-1 text-sm border border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              size="sm"
              onClick={() => { if (newNombre.trim()) createMut.mutate(newNombre.trim()) }}
              loading={createMut.isPending}
              disabled={!newNombre.trim()}
            >
              Agregar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNewForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full border border-dashed border-border"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="w-4 h-4" />
            Nueva categoria
          </Button>
        )}
      </div>
    </Modal>
  )
}

// ============================================================
// DeleteModal
// ============================================================

function DeleteModal({ producto, onClose }: { producto: ProductoConCategoria; onClose: () => void }) {
  const qc = useQueryClient()

  const deleteMut = useMutation({
    mutationFn: () => deleteProducto(producto.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Producto eliminado')
      onClose()
    },
    onError: () => toast.error('Error al eliminar producto'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Eliminar producto"
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
        <span className="font-semibold text-foreground">{producto.nombre}</span>?
        Esta accion no se puede deshacer.
      </p>
      {deleteMut.isError && (
        <p className="text-sm text-destructive mt-3">Error al eliminar. Intenta de nuevo.</p>
      )}
    </Modal>
  )
}

// ============================================================
// ProductosPage
// ============================================================

export function ProductosPage() {
  const [search,          setSearch]         = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [modal,           setModal]           = useState<ModalState>(null)

  const { data: productos,  isLoading } = useQuery({
    queryKey: ['productos', search, categoriaFilter],
    queryFn:  () => getProductos(search, categoriaFilter),
  })

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn:  getCategorias,
  })

  const close        = () => setModal(null)
  const stockBajo    = (p: ProductoConCategoria) => Number(p.stock) <= Number(p.stock_minimo)
  const catOptions   = [
    { value: '', label: 'Todas las categorias' },
    ...categorias.map(c => ({ value: c.id, label: c.nombre })),
  ]

  return (
    <>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Inventario</h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? '...' : `${productos?.length ?? 0} productos`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setModal({ type: 'categorias' })}>
              <Tag className="w-4 h-4" />
              Categorias
            </Button>
            <Button onClick={() => setModal({ type: 'create' })}>
              <Plus className="w-4 h-4" />
              Nuevo producto
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative sm:max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o codigo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <select
            value={categoriaFilter}
            onChange={e => setCategoriaFilter(e.target.value)}
            className="sm:max-w-[200px] px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {catOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-muted-foreground" />
          </div>
        ) : !productos?.length ? (
          <EmptyState
            icon={Package}
            title={search || categoriaFilter ? 'Sin resultados' : 'Sin productos aun'}
            description={
              search || categoriaFilter
                ? 'Prueba con otros filtros.'
                : 'Agrega tu primer producto al inventario.'
            }
            action={
              !search && !categoriaFilter ? (
                <Button size="sm" onClick={() => setModal({ type: 'create' })}>
                  <Plus className="w-3.5 h-3.5" /> Nuevo producto
                </Button>
              ) : undefined
            }
          />
        ) : (
          <TableRoot>
            <TableHead>
              <tr>
                <TableHeader className="hidden sm:table-cell">Codigo</TableHeader>
                <TableHeader>Nombre</TableHeader>
                <TableHeader className="hidden md:table-cell">Categoria</TableHeader>
                <TableHeader className="hidden lg:table-cell">Unidad</TableHeader>
                <TableHeader>Stock</TableHeader>
                <TableHeader className="hidden sm:table-cell">Precio</TableHeader>
                <TableHeader className="text-right">Acciones</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {productos.map(p => (
                <TableRow
                  key={p.id}
                  className={stockBajo(p) ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                >
                  <TableCell className="hidden sm:table-cell text-muted-foreground font-mono text-xs">
                    {p.codigo ?? '—'}
                  </TableCell>
                  <TableCell className="font-medium max-w-[140px] truncate">{p.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {p.categorias?.nombre ?? '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                    {p.unidad}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'font-medium',
                        stockBajo(p) ? 'text-destructive' : 'text-foreground',
                      )}>
                        {p.stock}
                      </span>
                      {stockBajo(p) && (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell font-medium">
                    {formatMonto(p.precio)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal({ type: 'ajuste', producto: p })}
                        title="Ajustar stock"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'edit', producto: p })}
                        title="Editar"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', producto: p })}
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
      {modal?.type === 'create' && (
        <ProductoFormModal producto={null} categorias={categorias} onClose={close} />
      )}
      {modal?.type === 'edit' && (
        <ProductoFormModal producto={modal.producto} categorias={categorias} onClose={close} />
      )}
      {modal?.type === 'ajuste'     && <AjusteStockModal producto={modal.producto} onClose={close} />}
      {modal?.type === 'delete'     && <DeleteModal      producto={modal.producto} onClose={close} />}
      {modal?.type === 'categorias' && <CategoriasModal  onClose={close} />}
    </>
  )
}
