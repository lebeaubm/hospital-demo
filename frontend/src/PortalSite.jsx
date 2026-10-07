import { AuthProvider } from './context/AuthContext'
import App from './App'

export default function PortalSite() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}
