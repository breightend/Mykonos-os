import { useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import { Loader2 } from 'lucide-react'
import { useHashLocation } from 'wouter/use-hash-location'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSession()
  const [, setLocation] = useHashLocation()

  useEffect(() => {
    // Only redirect if we're not loading and user is not authenticated
    if (!loading && !isAuthenticated()) {
      // Add a small delay to prevent redirect loops
      const timer = setTimeout(() => {
        setLocation('/')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [loading, isAuthenticated, setLocation])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
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
