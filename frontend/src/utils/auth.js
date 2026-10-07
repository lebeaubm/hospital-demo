/**
 * Decode JWT token payload (without verification - for reading claims only)
 */
export function decodeJWT(token) {
  if (typeof token !== 'string') return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null
  } catch {
    return null
  }
}

// These checks restore the UI session; the backend verifies token signatures and access.
export function isTokenUsable(token, tokenType = 'access', now = Date.now()) {
  const payload = decodeJWT(token)
  return Boolean(payload && payload.token_type === tokenType &&
    typeof payload.exp === 'number' && Number.isFinite(payload.exp) && payload.exp * 1000 > now)
}

export function getUserFromToken(token, now = Date.now()) {
  if (!isTokenUsable(token, 'access', now)) return null
  const payload = decodeJWT(token)
  const validId = (typeof payload.user_id === 'number' && Number.isInteger(payload.user_id) && payload.user_id > 0) ||
    (typeof payload.user_id === 'string' && payload.user_id.trim().length > 0)
  if (!validId || typeof payload.email !== 'string' || !payload.email.trim() ||
    !['PATIENT', 'STAFF', 'OWNER', 'ADMIN'].includes(payload.role)) return null
  return { userId: payload.user_id, email: payload.email, role: payload.role }
}

export async function getUserInfo() {
  return getUserFromToken(localStorage.getItem('accessToken'))
}

export async function restoreAuthSession(storage, refreshAccessToken, now = Date.now) {
  let userInfo = getUserFromToken(storage.getItem('accessToken'), now())
  if (!userInfo) {
    storage.removeItem('user')
    storage.removeItem('accessToken')
    if (!isTokenUsable(storage.getItem('refreshToken'), 'refresh', now())) {
      storage.removeItem('refreshToken')
      return null
    }
    try {
      const access = await refreshAccessToken()
      userInfo = getUserFromToken(access, now())
      if (!userInfo) {
        storage.removeItem('accessToken')
        storage.removeItem('refreshToken')
        return null
      }
    } catch (error) {
      const currentUser = getUserFromToken(storage.getItem('accessToken'), now())
      if (currentUser) {
        storage.setItem('user', JSON.stringify(currentUser))
        return currentUser
      }
      if ([400, 401, 403].includes(error.response?.status) || error.code === 'INVALID_SESSION') {
        storage.removeItem('refreshToken')
      }
      storage.removeItem('accessToken')
      return null
    }
  }
  storage.setItem('user', JSON.stringify(userInfo))
  return userInfo
}
