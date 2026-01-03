import { createContext, useContext, useState, useEffect } from 'react'
import { getAccessToken } from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user has a valid token on mount
    const token = getAccessToken()
    if (token) {
      setIsAuthenticated(true)
      // Try to load user from localStorage
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (e) {
          console.error('Failed to parse saved user:', e)
        }
      }
    }
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
    <AuthContext.Provider value={{ isAuthenticated, user, isStaff, login, logout }}>
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
