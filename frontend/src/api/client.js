import axios from 'axios'
import { getUserFromToken, isTokenUsable } from '../utils/auth.js'

const clientEnvironment = import.meta.env || {}
const configuredApiUrl = (clientEnvironment.VITE_API_URL || '').trim().replace(/\/$/, '')
const productionFallbackApiUrl = 'https://hospital-demo-api.onrender.com'
const apiBaseUrl = configuredApiUrl || (clientEnvironment.PROD ? productionFallbackApiUrl : 'http://127.0.0.1:8000')

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000,
})

const authRetryDelays = [1000, 3000]

const isAuthEndpoint = (requestUrl = '') =>
  requestUrl.includes('/api/auth/login/') ||
  requestUrl.includes('/api/auth/register/') ||
  requestUrl.includes('/api/auth/refresh/')

const isTimeoutError = (error) =>
  !error.response && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')

const getAccessToken = () => localStorage.getItem('accessToken')
const getRefreshToken = () => localStorage.getItem('refreshToken')

const setTokens = ({ access, refresh }) => {
  if (!getUserFromToken(access) || (refresh && !isTokenUsable(refresh, 'refresh'))) {
    throw new Error('Your sign-in session could not be read. Please sign in again.')
  }
  localStorage.setItem('accessToken', access)
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

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise
  const refreshToken = getRefreshToken()
  if (!isTokenUsable(refreshToken, 'refresh')) {
    const error = new Error('Your session has expired. Please sign in again.')
    error.code = 'INVALID_SESSION'
    throw error
  }
  refreshPromise = axios.post(`${apiBaseUrl}/api/auth/refresh/`, {
    refresh: refreshToken,
  }, { timeout: 20000 }).then(({ data }) => {
    if (!getUserFromToken(data?.access) || getRefreshToken() !== refreshToken) {
      const error = new Error('Your session could not be restored. Please sign in again.')
      error.code = 'INVALID_SESSION'
      throw error
    }
    setTokens({ access: data.access, refresh: data.refresh })
    return data.access
  }).finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const requestUrl = config.url || ''

  if (isAuthEndpoint(requestUrl)) {
    return config
  }

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
    const requestUrl = originalRequest?.url || ''
    const authEndpoint = isAuthEndpoint(requestUrl)

    if (authEndpoint && isTimeoutError(error)) {
      const retryCount = originalRequest._authRetryCount || 0
      const retryDelay = authRetryDelays[retryCount]

      if (retryDelay !== undefined) {
        originalRequest._authRetryCount = retryCount + 1
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        return api(originalRequest)
      }
    }

    // Don't try to refresh if:
    // 1. Not a 401 error
    // 2. No refresh token available
    // 3. Already retried
    // 4. Request is to an authentication endpoint
    if (
      error.response?.status === 401 && 
      !authEndpoint &&
      refreshToken && 
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh/')
    ) {
      originalRequest._retry = true

      try {
        const access = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        // An older request must not clear a new sign-in or replay its mutation under another account.
        const newerSession = getRefreshToken() !== refreshToken && getUserFromToken(getAccessToken())
        if (!newerSession) logout()
        return Promise.reject(refreshError)
      }
    }

    // For 401 errors that can't be refreshed, logout for protected API calls
    if (
      error.response?.status === 401 &&
      !authEndpoint &&
      (originalRequest._retry || !refreshToken)
    ) {
      logout()
    }

    return Promise.reject(error)
  },
)

// Payment API functions
export const createCheckoutSession = async (appointmentId = null) => {
  const { data } = await api.post('/api/payments/checkout-session/', {
    appointment_id: appointmentId
  })
  return data
}

export const verifyPayment = async (sessionId) => {
  const { data } = await api.get(`/api/payments/verify/?session_id=${sessionId}`)
  return data
}

export const getPaymentHistory = async () => {
  const { data } = await api.get('/api/payments/my/')
  return data
}

export const downloadInvoice = async (paymentId) => {
  const response = await api.get(`/api/payments/${paymentId}/invoice/`, {
    responseType: 'blob'
  })
  return response.data
}

export { api, clearTokens, getAccessToken, setTokens, logout, refreshAccessToken }
