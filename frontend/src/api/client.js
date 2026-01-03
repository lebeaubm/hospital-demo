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

    if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
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
        }
      } catch (refreshError) {
        refreshPromise = null
        clearTokens()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export { api, clearTokens, getAccessToken, setTokens }
