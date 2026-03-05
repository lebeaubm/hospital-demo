import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, user, authLoading } = useAuth()

  if (authLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="py-4">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You do not have permission to access this page. Admin access required.</p>
        </div>
      </div>
    )
  }

  return children
}
