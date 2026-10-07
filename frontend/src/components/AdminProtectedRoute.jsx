import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

export default function AdminProtectedRoute({ children, allowedRoles = ['ADMIN'] }) {
  const { isAuthenticated, user, authLoading } = useAuth()

  if (authLoading) {
    return <Loading message="Checking your sign-in session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user?.role)) {
    return (
      <div className="py-4">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You do not have permission to access this page. {allowedRoles.includes('OWNER') ? 'Owner or admin' : 'Admin'} access required.</p>
        </div>
      </div>
    )
  }

  return children
}
