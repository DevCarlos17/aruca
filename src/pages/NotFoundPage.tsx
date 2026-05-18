import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-6xl font-bold text-muted-foreground mb-3">404</p>
        <h1 className="text-xl font-semibold text-foreground mb-2">Pagina no encontrada</h1>
        <p className="text-muted-foreground mb-6">La pagina que buscas no existe o fue movida.</p>
        <Button onClick={() => navigate('/dashboard')}>Volver al inicio</Button>
      </div>
    </div>
  )
}
