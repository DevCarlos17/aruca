import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon?:        LucideIcon
  title:        string
  description?: string
  action?:      React.ReactNode
  className?:   string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  )
}
