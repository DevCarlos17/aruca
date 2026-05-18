import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ClipboardList, Users, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { EstadoOrdenBadge, PrioridadBadge } from '../components/ui/Badge'
import {
  TableRoot, TableHead, TableBody, TableRow, TableHeader, TableCell,
} from '../components/ui/Table'
import {
  getStatsResumen, getOrdenesPorMes, getOrdenesRecientes, getTareasUrgentes,
} from '../services/dashboard'

// ---- Helpers -----------------------------------------------

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function formatMonto(n: number) {
  return `$${n.toLocaleString('es')}`
}

// ---- StatCard ----------------------------------------------

interface StatCardProps {
  title:     string
  value:     number
  icon:      React.ElementType
  bgColor:   string
  iconColor: string
  loading:   boolean
}

function StatCard({ title, value, icon: Icon, bgColor, iconColor, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            {loading
              ? <Spinner size="sm" className="mt-2 text-muted-foreground" />
              : <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            }
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Page --------------------------------------------------

export function DashboardPage() {
  const stats     = useQuery({ queryKey: ['dashboard-stats'],   queryFn: getStatsResumen    })
  const meses     = useQuery({ queryKey: ['ordenes-por-mes'],   queryFn: getOrdenesPorMes   })
  const recientes = useQuery({ queryKey: ['ordenes-recientes'], queryFn: getOrdenesRecientes })
  const urgentes  = useQuery({ queryKey: ['tareas-urgentes'],   queryFn: getTareasUrgentes  })

  return (
    <div className="space-y-6">

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ordenes"
          value={stats.data?.totalOrdenes ?? 0}
          icon={ClipboardList}
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          loading={stats.isLoading}
        />
        <StatCard
          title="Tareas Activas"
          value={stats.data?.tareasPendientes ?? 0}
          icon={Clock}
          bgColor="bg-yellow-100 dark:bg-yellow-900/30"
          iconColor="text-yellow-600 dark:text-yellow-400"
          loading={stats.isLoading}
        />
        <StatCard
          title="Clientes"
          value={stats.data?.totalClientes ?? 0}
          icon={Users}
          bgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          loading={stats.isLoading}
        />
        <StatCard
          title="Stock Bajo"
          value={stats.data?.stockBajo ?? 0}
          icon={AlertTriangle}
          bgColor="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
          loading={stats.isLoading}
        />
      </div>

      {/* Grafica + Tareas urgentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Ordenes por mes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ordenes por mes</CardTitle>
          </CardHeader>
          <CardContent>
            {meses.isLoading ? (
              <div className="h-52 flex items-center justify-center">
                <Spinner className="text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={meses.data}
                  margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar
                    dataKey="ordenes"
                    name="Ordenes"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tareas urgentes */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Tareas urgentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2 flex-1">
            {urgentes.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="text-muted-foreground" />
              </div>
            ) : urgentes.data?.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Sin tareas urgentes"
                description="Todas las tareas estan al dia."
              />
            ) : (
              <ul className="divide-y divide-border">
                {urgentes.data?.map(t => (
                  <li key={t.id} className="px-5 py-3 space-y-1.5">
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                      {t.titulo}
                    </p>
                    <div className="flex items-center gap-2">
                      <PrioridadBadge prioridad={t.prioridad} />
                      {t.fecha_vencimiento && (
                        <span className="text-xs text-muted-foreground">
                          Vence: {formatFecha(t.fecha_vencimiento)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Ultimas ordenes */}
      <Card>
        <CardHeader>
          <CardTitle>Ultimas ordenes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recientes.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : recientes.data?.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin ordenes aun"
              description="Las ordenes creadas apareceran aqui."
              className="py-10"
            />
          ) : (
            <TableRoot className="border-0 rounded-none rounded-b-xl">
              <TableHead>
                <tr>
                  <TableHeader>Orden</TableHeader>
                  <TableHeader>Cliente</TableHeader>
                  <TableHeader className="hidden sm:table-cell">Fecha</TableHeader>
                  <TableHeader>Estado</TableHeader>
                  <TableHeader className="text-right">Total</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {recientes.data?.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">#{o.numero}</TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {o.cliente_nombre ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatFecha(o.fecha)}
                    </TableCell>
                    <TableCell>
                      <EstadoOrdenBadge estado={o.estado} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMonto(o.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
