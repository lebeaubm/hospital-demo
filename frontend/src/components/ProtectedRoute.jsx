import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth()

  if (authLoading) {
    return <Loading message="Checking your sign-in session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
