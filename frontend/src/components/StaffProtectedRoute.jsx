import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function StaffProtectedRoute({ children }) {
  const { isAuthenticated, isStaff } = useAuth()

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
