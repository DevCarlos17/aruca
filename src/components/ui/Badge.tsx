import { cn } from '../../lib/utils'
import type { EstadoOrden, EstadoTarea, PrioridadTarea } from '../../types/database'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

interface BadgeProps {
  children:  React.ReactNode
  variant?:  BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  danger:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  muted:   'bg-muted text-muted-foreground',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      variantClasses[variant],
      className,
    )}>
      {children}
    </span>
  )
}

export function EstadoOrdenBadge({ estado }: { estado: EstadoOrden }) {
  const map: Record<EstadoOrden, { label: string; variant: BadgeVariant }> = {
    pendiente:  { label: 'Pendiente',  variant: 'warning' },
    en_proceso: { label: 'En proceso', variant: 'info'    },
    completada: { label: 'Completada', variant: 'success' },
    cancelada:  { label: 'Cancelada',  variant: 'danger'  },
  }
  const { label, variant } = map[estado]
  return <Badge variant={variant}>{label}</Badge>
}

export function EstadoTareaBadge({ estado }: { estado: EstadoTarea }) {
  const map: Record<EstadoTarea, { label: string; variant: BadgeVariant }> = {
    pendiente:   { label: 'Pendiente',   variant: 'warning' },
    en_progreso: { label: 'En progreso', variant: 'info'    },
    completada:  { label: 'Completada',  variant: 'success' },
  }
  const { label, variant } = map[estado]
  return <Badge variant={variant}>{label}</Badge>
}

export function PrioridadBadge({ prioridad }: { prioridad: PrioridadTarea }) {
  const map: Record<PrioridadTarea, { label: string; variant: BadgeVariant }> = {
    alta:  { label: 'Alta',  variant: 'danger'  },
    media: { label: 'Media', variant: 'warning' },
    baja:  { label: 'Baja',  variant: 'muted'   },
  }
  const { label, variant } = map[prioridad]
  return <Badge variant={variant}>{label}</Badge>
}
