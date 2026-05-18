import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Pencil, Trash2, Eye, User, ClipboardList } from 'lucide-react'

import { Button }              from '../components/ui/Button'
import { Input }               from '../components/ui/Input'
import { Modal }               from '../components/ui/Modal'
import { Spinner }             from '../components/ui/Spinner'
import { EmptyState }          from '../components/ui/EmptyState'
import { EstadoOrdenBadge }    from '../components/ui/Badge'
import {
  TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell,
} from '../components/ui/Table'

import {
  getClientes, createCliente, updateCliente, deleteCliente, getOrdenesByCliente,
  type OrdenResumen,
} from '../services/clientes'
import type { Cliente, ClienteInsert } from '../types/database'
import { toast } from '../lib/toast'

// ---- Schema ------------------------------------------------

const clienteSchema = z.object({
  nombre:    z.string().min(2, 'Minimo 2 caracteres'),
  telefono:  z.string(),
  email:     z.string().refine(
    val => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: 'Email invalido' },
  ),
  direccion: z.string(),
})
type ClienteFormData = z.infer<typeof clienteSchema>

// ---- Helpers -----------------------------------------------

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}
function formatMonto(n: number) { return `$${n.toLocaleString('es')}` }

// ---- Modal state -------------------------------------------

type ModalState =
  | { type: 'create' }
  | { type: 'edit';      cliente: Cliente }
  | { type: 'delete';    cliente: Cliente }
  | { type: 'historial'; cliente: Cliente }
  | null

// ============================================================
// ClienteFormModal
// ============================================================

function ClienteFormModal({ cliente, onClose }: { cliente: Cliente | null; onClose: () => void }) {
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre:    cliente?.nombre    ?? '',
      telefono:  cliente?.telefono  ?? '',
      email:     cliente?.email     ?? '',
      direccion: cliente?.direccion ?? '',
    },
  })

  const createMut = useMutation({
    mutationFn: (data: ClienteInsert) => createCliente(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Cliente creado')
      onClose()
    },
    onError: () => toast.error('Error al crear cliente'),
  })

  const updateMut = useMutation({
    mutationFn: (data: ClienteInsert) => updateCliente(cliente!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente actualizado')
      onClose()
    },
    onError: () => toast.error('Error al actualizar cliente'),
  })

  const isPending = cliente ? updateMut.isPending : createMut.isPending
  const isError   = cliente ? updateMut.isError   : createMut.isError

  const onSubmit = (data: ClienteFormData) => {
    const payload: ClienteInsert = {
      nombre:    data.nombre.trim(),
      telefono:  data.telefono.trim()  || null,
      email:     data.email.trim()     || null,
      direccion: data.direccion.trim() || null,
    }
    if (cliente) updateMut.mutate(payload)
    else         createMut.mutate(payload)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={cliente ? 'Editar cliente' : 'Nuevo cliente'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button form="cliente-form" type="submit" loading={isPending}>
            {cliente ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </>
      }
    >
      <form id="cliente-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre *"
          placeholder="Juan Perez"
          autoFocus
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Telefono"
            type="tel"
            placeholder="+54 11 1234-5678"
            error={errors.telefono?.message}
            {...register('telefono')}
          />
          <Input
            label="Email"
            placeholder="juan@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
        <Input
          label="Direccion"
          placeholder="Calle 123, Ciudad"
          error={errors.direccion?.message}
          {...register('direccion')}
        />
        {isError && (
          <p className="text-sm text-destructive">Error al guardar. Intenta de nuevo.</p>
        )}
      </form>
    </Modal>
  )
}

// ============================================================
// HistorialModal
// ============================================================

function HistorialModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['ordenes-by-cliente', cliente.id],
    queryFn:  () => getOrdenesByCliente(cliente.id),
  })

  return (
    <Modal open onClose={onClose} title={`Historial: ${cliente.nombre}`} size="lg">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : !ordenes?.length ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin ordenes"
          description="Este cliente no tiene ordenes registradas."
        />
      ) : (
        <TableRoot>
          <TableHead>
            <tr>
              <TableHeader>Orden</TableHeader>
              <TableHeader>Fecha</TableHeader>
              <TableHeader>Estado</TableHeader>
              <TableHeader className="text-right">Total</TableHeader>
            </tr>
          </TableHead>
          <TableBody>
            {ordenes.map((o: OrdenResumen) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">#{o.numero}</TableCell>
                <TableCell className="text-muted-foreground">{formatFecha(o.fecha)}</TableCell>
                <TableCell><EstadoOrdenBadge estado={o.estado} /></TableCell>
                <TableCell className="text-right font-medium">{formatMonto(o.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      )}
    </Modal>
  )
}

// ============================================================
// DeleteModal
// ============================================================

function DeleteModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const qc = useQueryClient()

  const deleteMut = useMutation({
    mutationFn: () => deleteCliente(cliente.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Cliente eliminado')
      onClose()
    },
    onError: () => toast.error('Error al eliminar cliente'),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Eliminar cliente"
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
        ¿Seguro que quieres eliminar a{' '}
        <span className="font-semibold text-foreground">{cliente.nombre}</span>?
        Esta accion no se puede deshacer.
      </p>
      {deleteMut.isError && (
        <p className="text-sm text-destructive mt-3">Error al eliminar. Intenta de nuevo.</p>
      )}
    </Modal>
  )
}

// ============================================================
// ClientesPage
// ============================================================

export function ClientesPage() {
  const [search, setSearch] = useState('')
  const [modal,  setModal]  = useState<ModalState>(null)

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes', search],
    queryFn:  () => getClientes(search),
  })

  const close = () => setModal(null)

  return (
    <>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? '...' : `${clientes?.length ?? 0} registros`}
            </p>
          </div>
          <Button onClick={() => setModal({ type: 'create' })}>
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </Button>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-muted-foreground" />
          </div>
        ) : !clientes?.length ? (
          <EmptyState
            icon={User}
            title={search ? 'Sin resultados' : 'Sin clientes aun'}
            description={
              search
                ? `No se encontraron clientes con "${search}".`
                : 'Agrega tu primer cliente para comenzar.'
            }
            action={
              !search ? (
                <Button size="sm" onClick={() => setModal({ type: 'create' })}>
                  <Plus className="w-3.5 h-3.5" /> Nuevo cliente
                </Button>
              ) : undefined
            }
          />
        ) : (
          <TableRoot>
            <TableHead>
              <tr>
                <TableHeader>Nombre</TableHeader>
                <TableHeader className="hidden md:table-cell">Telefono</TableHeader>
                <TableHeader className="hidden lg:table-cell">Email</TableHeader>
                <TableHeader className="hidden sm:table-cell">Registrado</TableHeader>
                <TableHeader className="text-right">Acciones</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {clientes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium max-w-[160px] truncate">{c.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {c.telefono ?? '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                    {c.email ?? '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatFecha(c.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal({ type: 'historial', cliente: c })}
                        title="Ver historial"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'edit', cliente: c })}
                        title="Editar"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', cliente: c })}
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
      {modal?.type === 'create'    && <ClienteFormModal cliente={null}          onClose={close} />}
      {modal?.type === 'edit'      && <ClienteFormModal cliente={modal.cliente} onClose={close} />}
      {modal?.type === 'delete'    && <DeleteModal      cliente={modal.cliente} onClose={close} />}
      {modal?.type === 'historial' && <HistorialModal   cliente={modal.cliente} onClose={close} />}
    </>
  )
}
