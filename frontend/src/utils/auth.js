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
 * Get user role from token by fetching user details from backend
 * Since default JWT doesn't include role, we need to fetch it
 */
export async function getUserInfo(api) {
  try {
    // Try to get patient profile first
    const { data } = await api.get('/api/patients/me/')
    return {
      email: data.email,
      role: 'PATIENT',
      firstName: data.first_name,
      lastName: data.last_name,
    }
  } catch (error) {
    // If patient endpoint fails, user might be staff/admin
    // We'll need to add a general /me endpoint or decode from token
    // For now, we'll check if we can access staff endpoints
    try {
      await api.get('/api/staff/appointments/')
      // If this succeeds, user is staff or admin
      return {
        role: 'STAFF',
      }
    } catch {
      // If both fail, return null
      return null
    }
  }
}
