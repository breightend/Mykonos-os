import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useSession } from '../contexts/SessionContext'
import { Loader2 } from 'lucide-react'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSession()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      setLocation('/')
    }
  }, [loading, isAuthenticated, setLocation])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    return null // Se redirigirá al login
  }

  return children
}

export default ProtectedRoute
