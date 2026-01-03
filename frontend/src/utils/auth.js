/**
 * Decode JWT token payload (without verification - for reading claims only)
 */
export function decodeJWT(token) {
  if (!token) return null
  
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Get user info from JWT token
 * The token now includes user_id, email, and role
 */
export async function getUserInfo(api) {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken')
    if (!token) {
      return null
    }
    
    // Decode the token to get user info
    const payload = decodeJWT(token)
    if (!payload) {
      return null
    }
    
    // The JWT payload now includes: user_id, email, role
    return {
      userId: payload.user_id,
      email: payload.email,
      role: payload.role, // PATIENT, STAFF, or ADMIN
    }
  } catch (error) {
    console.error('Failed to get user info:', error)
    return null
  }
}
