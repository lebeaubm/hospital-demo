import { createContext, useContext, useState, useEffect } from 'react'
import { getAccessToken } from '../api/client'
import { getUserInfo } from '../utils/auth'
import { api } from '../api/client'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user has a valid token on mount
    const token = getAccessToken()
    if (token) {
      setIsAuthenticated(true)
      // Try to get user info from the token
      const loadUser = async () => {
        try {
          const userInfo = await getUserInfo(api)
          if (userInfo) {
            setUser(userInfo)
            localStorage.setItem('user', JSON.stringify(userInfo))
          }
        } catch (error) {
          console.error('Failed to load user info:', error)
          // If token is invalid, clear authentication
          setIsAuthenticated(false)
          setUser(null)
        }
      }
      loadUser()
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
