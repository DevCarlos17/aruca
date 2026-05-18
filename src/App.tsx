import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './context/AuthContext'
import { ProtectedRoute }  from './components/ProtectedRoute'
import { ErrorBoundary }   from './components/ErrorBoundary'
import { Layout }          from './components/layout/Layout'
import { Toaster }         from './components/ui/Toaster'
import { FullPageSpinner } from './components/ui/Spinner'

// Carga sincrona — paginas pequenas que se necesitan inmediatamente
import { LoginPage }    from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'

// Lazy loading — cada pagina carga su propio chunk solo cuando se navega a ella
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientesPage  = lazy(() => import('./pages/ClientesPage').then(m =>  ({ default: m.ClientesPage  })))
const ProductosPage = lazy(() => import('./pages/ProductosPage').then(m => ({ default: m.ProductosPage })))
const OrdenesPage   = lazy(() => import('./pages/OrdenesPage').then(m =>   ({ default: m.OrdenesPage   })))
const TareasPage    = lazy(() => import('./pages/TareasPage').then(m =>    ({ default: m.TareasPage    })))
const ReportesPage  = lazy(() => import('./pages/ReportesPage').then(m =>  ({ default: m.ReportesPage  })))

// Wrapper para envolver cada ruta lazy en Suspense
function S({ Page }: { Page: React.ComponentType }) {
  return <Suspense fallback={<FullPageSpinner />}><Page /></Suspense>
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>

          {/* Publica */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protegidas con Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<S Page={DashboardPage} />} />
              <Route path="/clientes"  element={<S Page={ClientesPage}  />} />
              <Route path="/productos" element={<S Page={ProductosPage} />} />
              <Route path="/ordenes"   element={<S Page={OrdenesPage}   />} />
              <Route path="/tareas"    element={<S Page={TareasPage}    />} />
              <Route path="/reportes"  element={<S Page={ReportesPage}  />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </AuthProvider>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
