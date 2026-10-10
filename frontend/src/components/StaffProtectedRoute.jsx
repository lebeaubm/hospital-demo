import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

export default function StaffProtectedRoute({ children }) {
  const { isAuthenticated, isStaff, authLoading } = useAuth()

  if (authLoading) {
    return <Loading message="Checking your sign-in session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isStaff) {
    return (
      <div className="py-4">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You do not have permission to access this page. Staff or admin access required.</p>
        </div>
      </div>
    )
  }

  return children
}
