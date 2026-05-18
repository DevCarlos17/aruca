import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { FileText, Table2, Users, Download } from 'lucide-react'
import { cn } from '../lib/utils'

import { Button }    from '../components/ui/Button'
import { Input }     from '../components/ui/Input'
import { Spinner }   from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { EstadoOrdenBadge } from '../components/ui/Badge'
import {
  TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell,
} from '../components/ui/Table'

import {
  getReporteOrdenes, getReporteInventario, getReporteClientes,
  type OrdenReporte, type ProductoReporte, type ClienteReporte,
} from '../services/reportes'

// ---- Helpers -----------------------------------------------

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}
function formatMonto(n: number) { return `$${n.toLocaleString('es')}` }

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', en_proceso: 'En proceso',
  completada: 'Completada', cancelada: 'Cancelada',
}

// Build monthly chart data from an orders array
function groupByMonth(ordenes: OrdenReporte[]) {
  const map: Record<string, { ordenes: number; total: number }> = {}
  ordenes.forEach(o => {
    const key = o.fecha.substring(0, 7)
    if (!map[key]) map[key] = { ordenes: 0, total: 0 }
    map[key].ordenes++
    map[key].total += o.total
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [year, month] = key.split('-')
      const d    = new Date(Number(year), Number(month) - 1, 1)
      const mes  = d.toLocaleDateString('es', { month: 'short', year: '2-digit' })
      return { mes: mes.charAt(0).toUpperCase() + mes.slice(1), ordenes: v.ordenes, total: v.total }
    })
}

// ---- PDF Export --------------------------------------------

async function exportarOrdenPDF(
  ordenes: OrdenReporte[],
  desde:   string,
  hasta:   string,
) {
  const { jsPDF }   = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ARUCA Solutions — Reporte de Ordenes', 14, 20)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const rango = desde || hasta
    ? `Periodo: ${desde ? formatFecha(desde) : 'inicio'} al ${hasta ? formatFecha(hasta) : 'hoy'}`
    : 'Todas las ordenes'
  doc.text(rango, 14, 28)

  const totalMonto = ordenes.reduce((s, o) => s + o.total, 0)
  doc.text(
    `${ordenes.length} ordenes  |  Total acumulado: ${formatMonto(totalMonto)}`,
    14, 34,
  )

  autoTable(doc, {
    startY: 40,
    head: [['#Orden', 'Cliente', 'Fecha', 'Estado', 'Total']],
    body: ordenes.map(o => [
      `#${o.numero}`,
      o.clienteNombre,
      formatFecha(o.fecha),
      ESTADO_LABEL[o.estado] ?? o.estado,
      formatMonto(o.total),
    ]),
    styles:            { fontSize: 8, cellPadding: 2.5 },
    headStyles:        { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles:      { 4: { halign: 'right' } },
  })

  doc.save(`ordenes-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ---- Excel Exports -----------------------------------------

async function exportarInventarioExcel(productos: ProductoReporte[]) {
  const XLSX = await import('xlsx')

  const headers = ['Codigo', 'Nombre', 'Categoria', 'Unidad', 'Stock', 'Stock Min.', 'Precio', 'Estado']
  const rows    = productos.map(p => [
    p.codigo ?? '', p.nombre, p.categoria, p.unidad,
    p.stock, p.stock_minimo, p.precio, p.estadoStock,
  ])

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = [10, 30, 18, 10, 8, 10, 10, 8].map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
  XLSX.writeFile(wb, `inventario-${new Date().toISOString().split('T')[0]}.xlsx`)
}

async function exportarClientesExcel(clientes: ClienteReporte[]) {
  const XLSX = await import('xlsx')

  const headers = ['Nombre', 'Telefono', 'Email', 'Direccion', 'Registrado']
  const rows    = clientes.map(c => [
    c.nombre, c.telefono ?? '', c.email ?? '', c.direccion ?? '', formatFecha(c.created_at),
  ])

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = [25, 18, 28, 30, 12].map(w => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
  XLSX.writeFile(wb, `clientes-${new Date().toISOString().split('T')[0]}.xlsx`)
}

// ============================================================
// Tab: Órdenes
// ============================================================

function OrdenesTab() {
  const [desde,      setDesde]      = useState('')
  const [hasta,      setHasta]      = useState('')
  const [exporting,  setExporting]  = useState(false)

  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['reporte-ordenes', desde, hasta],
    queryFn:  () => getReporteOrdenes(desde || undefined, hasta || undefined),
  })

  const chartData   = ordenes ? groupByMonth(ordenes) : []
  const totalMonto  = ordenes?.reduce((s, o) => s + o.total, 0) ?? 0

  const handleExportPDF = async () => {
    if (!ordenes?.length) return
    setExporting(true)
    try { await exportarOrdenPDF(ordenes, desde, hasta) }
    finally { setExporting(false) }
  }

  return (
    <div className="space-y-5">

      {/* Filters + export */}
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Desde"
          type="date"
          value={desde}
          onChange={e => setDesde(e.target.value)}
          className="w-auto"
        />
        <Input
          label="Hasta"
          type="date"
          value={hasta}
          onChange={e => setHasta(e.target.value)}
          className="w-auto"
        />
        {(desde || hasta) && (
          <Button variant="ghost" size="sm" onClick={() => { setDesde(''); setHasta('') }}>
            Limpiar filtros
          </Button>
        )}
        <div className="ml-auto">
          <Button
            variant="secondary"
            onClick={handleExportPDF}
            loading={exporting}
            disabled={!ordenes?.length}
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && ordenes && (
        <div className="flex gap-6 p-4 bg-muted/40 rounded-lg border border-border text-sm">
          <div>
            <p className="text-muted-foreground">Total ordenes</p>
            <p className="text-xl font-bold text-foreground">{ordenes.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Monto acumulado</p>
            <p className="text-xl font-bold text-foreground">{formatMonto(totalMonto)}</p>
          </div>
          {ordenes.length > 0 && (
            <div>
              <p className="text-muted-foreground">Promedio por orden</p>
              <p className="text-xl font-bold text-foreground">
                {formatMonto(Math.round(totalMonto / ordenes.length))}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {!isLoading && chartData.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Monto por mes</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [formatMonto(Number(val ?? 0)), 'Total']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-muted-foreground" />
        </div>
      ) : !ordenes?.length ? (
        <EmptyState
          icon={FileText}
          title="Sin ordenes"
          description="No hay ordenes para el periodo seleccionado."
        />
      ) : (
        <TableRoot>
          <TableHead>
            <tr>
              <TableHeader>#</TableHeader>
              <TableHeader>Cliente</TableHeader>
              <TableHeader className="hidden sm:table-cell">Fecha</TableHeader>
              <TableHeader>Estado</TableHeader>
              <TableHeader className="text-right">Total</TableHeader>
            </tr>
          </TableHead>
          <TableBody>
            {ordenes.map(o => (
              <TableRow key={o.numero}>
                <TableCell className="font-medium text-muted-foreground">#{o.numero}</TableCell>
                <TableCell className="font-medium max-w-[160px] truncate">{o.clienteNombre}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatFecha(o.fecha)}
                </TableCell>
                <TableCell><EstadoOrdenBadge estado={o.estado} /></TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatMonto(o.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      )}
    </div>
  )
}

// ============================================================
// Tab: Inventario
// ============================================================

function InventarioTab() {
  const [exporting, setExporting] = useState(false)

  const { data: productos, isLoading } = useQuery({
    queryKey: ['reporte-inventario'],
    queryFn:  getReporteInventario,
  })

  const handleExportExcel = async () => {
    if (!productos?.length) return
    setExporting(true)
    try { await exportarInventarioExcel(productos) }
    finally { setExporting(false) }
  }

  const stockBajo = productos?.filter(p => p.estadoStock === 'Bajo').length ?? 0

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {!isLoading && productos && (
          <p className="text-sm text-muted-foreground">
            {productos.length} productos{stockBajo > 0 && ` · ${stockBajo} con stock bajo`}
          </p>
        )}
        <Button
          variant="secondary"
          onClick={handleExportExcel}
          loading={exporting}
          disabled={!productos?.length}
          className="ml-auto"
        >
          <Download className="w-4 h-4" /> Exportar Excel
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-muted-foreground" />
        </div>
      ) : !productos?.length ? (
        <EmptyState icon={Table2} title="Sin productos" description="No hay productos registrados." />
      ) : (
        <TableRoot>
          <TableHead>
            <tr>
              <TableHeader>Nombre</TableHeader>
              <TableHeader className="hidden md:table-cell">Categoria</TableHeader>
              <TableHeader className="hidden sm:table-cell">Unidad</TableHeader>
              <TableHeader className="text-right">Stock</TableHeader>
              <TableHeader className="hidden lg:table-cell text-right">Min.</TableHeader>
              <TableHeader className="text-right">Precio</TableHeader>
              <TableHeader>Estado</TableHeader>
            </tr>
          </TableHead>
          <TableBody>
            {productos.map((p, i) => (
              <TableRow key={i} className={p.estadoStock === 'Bajo' ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                <TableCell>
                  <div>
                    <p className="font-medium">{p.nombre}</p>
                    {p.codigo && <p className="text-xs text-muted-foreground">{p.codigo}</p>}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{p.categoria}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{p.unidad}</TableCell>
                <TableCell className={`text-right font-medium tabular-nums ${p.estadoStock === 'Bajo' ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {p.stock}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-right text-muted-foreground tabular-nums">{p.stock_minimo}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMonto(p.precio)}</TableCell>
                <TableCell>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    p.estadoStock === 'Bajo'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  )}>
                    {p.estadoStock}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      )}
    </div>
  )
}

// ============================================================
// Tab: Clientes
// ============================================================

function ClientesTab() {
  const [exporting, setExporting] = useState(false)

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['reporte-clientes'],
    queryFn:  getReporteClientes,
  })

  const handleExportExcel = async () => {
    if (!clientes?.length) return
    setExporting(true)
    try { await exportarClientesExcel(clientes) }
    finally { setExporting(false) }
  }

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {!isLoading && clientes && (
          <p className="text-sm text-muted-foreground">{clientes.length} clientes registrados</p>
        )}
        <Button
          variant="secondary"
          onClick={handleExportExcel}
          loading={exporting}
          disabled={!clientes?.length}
          className="ml-auto"
        >
          <Download className="w-4 h-4" /> Exportar Excel
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-muted-foreground" />
        </div>
      ) : !clientes?.length ? (
        <EmptyState icon={Users} title="Sin clientes" description="No hay clientes registrados." />
      ) : (
        <TableRoot>
          <TableHead>
            <tr>
              <TableHeader>Nombre</TableHeader>
              <TableHeader className="hidden md:table-cell">Telefono</TableHeader>
              <TableHeader className="hidden lg:table-cell">Email</TableHeader>
              <TableHeader className="hidden xl:table-cell">Direccion</TableHeader>
              <TableHeader className="hidden sm:table-cell">Registrado</TableHeader>
            </tr>
          </TableHead>
          <TableBody>
            {clientes.map((c, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{c.nombre}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {c.telefono ?? '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                  {c.email ?? '—'}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-muted-foreground max-w-[200px] truncate">
                  {c.direccion ?? '—'}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatFecha(c.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      )}
    </div>
  )
}

// ============================================================
// ReportesPage
// ============================================================

const TABS = [
  { id: 'ordenes',    label: 'Ordenes',    icon: FileText },
  { id: 'inventario', label: 'Inventario', icon: Table2   },
  { id: 'clientes',   label: 'Clientes',   icon: Users    },
] as const

type Tab = typeof TABS[number]['id']

export function ReportesPage() {
  const [tab, setTab] = useState<Tab>('ordenes')

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Reportes</h2>
        <p className="text-sm text-muted-foreground">Consulta y exporta informacion de tu negocio</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'ordenes'    && <OrdenesTab />}
      {tab === 'inventario' && <InventarioTab />}
      {tab === 'clientes'   && <ClientesTab />}
    </div>
  )
}
