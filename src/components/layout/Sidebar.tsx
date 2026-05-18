import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Package,
  ClipboardList, CheckSquare, BarChart2, X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/clientes',  label: 'Clientes',   icon: Users           },
  { to: '/productos', label: 'Inventario', icon: Package         },
  { to: '/ordenes',   label: 'Ordenes',    icon: ClipboardList   },
  { to: '/tareas',    label: 'Tareas',     icon: CheckSquare     },
  { to: '/reportes',  label: 'Reportes',   icon: BarChart2       },
]

interface SidebarProps {
  open:    boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col',
        'transition-transform duration-200 ease-in-out',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>

        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ARUCA Solutions</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground">ARUCA Solutions v1.0</p>
        </div>
      </aside>
    </>
  )
}
