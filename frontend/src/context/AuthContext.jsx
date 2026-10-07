import { createContext, useContext, useState, useEffect } from 'react'
import { clearTokens, getAccessToken, refreshAccessToken } from '../api/client'
import { getUserFromToken, restoreAuthSession } from '../utils/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    restoreAuthSession(localStorage, refreshAccessToken).then((userInfo) => {
      if (cancelled) return
      setIsAuthenticated(Boolean(userInfo))
      setUser(userInfo)
      setAuthLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const login = () => {
    const userInfo = getUserFromToken(getAccessToken())
    if (!userInfo) {
      clearTokens()
      setIsAuthenticated(false)
      setUser(null)
      localStorage.removeItem('user')
      throw new Error('Your sign-in session could not be read. Please sign in again.')
    }
    setIsAuthenticated(true)
    setUser(userInfo)
    localStorage.setItem('user', JSON.stringify(userInfo))
    return userInfo
  }

  const logout = () => {
    clearTokens()
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('user')
  }

  const isOwner = user?.role === 'OWNER'
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN' || isOwner
  const currentRole = isAuthenticated ? user?.role : 'GUEST'
  const isGuest = currentRole === 'GUEST'

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isStaff, isOwner, isGuest, currentRole, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- The auth hook shares this existing context module with its provider.
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
