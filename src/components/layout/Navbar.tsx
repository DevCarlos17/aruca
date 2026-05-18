import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clientes':  'Clientes',
  '/productos': 'Inventario',
  '/ordenes':   'Ordenes',
  '/tareas':    'Tareas',
  '/reportes':  'Reportes',
}

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, signOut } = useAuth()
  const location           = useLocation()
  const navigate           = useNavigate()

  const title    = pageTitles[location.pathname] ?? 'ARUCA Solutions'
  const initials = (user?.email?.[0] ?? '?').toUpperCase()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      {/* Izquierda */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-foreground">{title}</h1>
      </div>

      {/* Derecha */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">{initials}</span>
          </div>
          <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[180px]">
            {user?.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesion"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>
    </header>
  )
}
