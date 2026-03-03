import { createContext, useContext, useState, useEffect } from 'react'
import { getAccessToken } from '../api/client'
import { getUserInfo, decodeJWT } from '../utils/auth'
import { api } from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // Synchronously restore auth state from stored token
    const token = getAccessToken()
    if (token) {
      // Decode token synchronously so ProtectedRoutes don't flash to /login
      const payload = decodeJWT(token)
      if (payload) {
        const userInfo = {
          userId: payload.user_id,
          email: payload.email,
          role: payload.role,
        }
        setIsAuthenticated(true)
        setUser(userInfo)
        localStorage.setItem('user', JSON.stringify(userInfo))
      }
    }
    setAuthLoading(false)
  }, [])

  const login = (userData) => {
    setIsAuthenticated(true)
    if (userData) {
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('user')
  }

  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isStaff, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
