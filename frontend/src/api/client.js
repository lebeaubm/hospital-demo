import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: apiBaseUrl,
})

const getAccessToken = () => localStorage.getItem('accessToken')
const getRefreshToken = () => localStorage.getItem('refreshToken')

const setTokens = ({ access, refresh }) => {
  if (access) {
    localStorage.setItem('accessToken', access)
  }
  if (refresh) {
    localStorage.setItem('refreshToken', refresh)
  }
}

const clearTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

const logout = () => {
  clearTokens()
  // Clear user data from localStorage
  localStorage.removeItem('user')
  // Redirect to login page
  window.location.href = '/login'
}

let refreshPromise = null

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const refreshToken = getRefreshToken()

    // Don't try to refresh if:
    // 1. Not a 401 error
    // 2. No refresh token available
    // 3. Already retried
    // 4. Request is to the refresh endpoint itself
    if (
      error.response?.status === 401 && 
      refreshToken && 
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh/')
    ) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = axios.post(`${apiBaseUrl}/api/auth/refresh/`, {
            refresh: refreshToken,
          })
        }

        const { data } = await refreshPromise
        refreshPromise = null

        if (data?.access) {
          setTokens({ access: data.access })
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return api(originalRequest)
        } else {
          // No access token in response, logout
          logout()
          return Promise.reject(error)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        refreshPromise = null
        console.error('Token refresh failed:', refreshError)
        logout()
        return Promise.reject(refreshError)
      }
    }

    // For 401 errors that can't be refreshed, logout
    if (error.response?.status === 401 && originalRequest._retry) {
      logout()
    }

    return Promise.reject(error)
  },
)

export { api, clearTokens, getAccessToken, setTokens, logout }
