import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setTokens } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { getUserInfo } from '../utils/auth'
import ErrorAlert from '../components/ErrorAlert'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSuccess('')
    setSubmitting(true)

    try {
      const { data } = await api.post('/api/auth/login/', {
        email,
        password,
      })
      setTokens({ access: data.access, refresh: data.refresh })
      
      // Fetch user info to get role
      const userInfo = await getUserInfo(api)
      
      login(userInfo)
      setSuccess('Logged in successfully.')
      
      // Redirect based on role
      if (userInfo?.role === 'STAFF' || userInfo?.role === 'ADMIN') {
        navigate('/staff/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4" style={{ maxWidth: '480px' }}>
      <h1 className="mb-3">Login</h1>
      <p className="text-muted">Use your email and password to sign in.</p>
      <form onSubmit={handleSubmit} className="card shadow-sm p-4">
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            className="form-control"
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            className="form-control"
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error && <ErrorAlert error={error} />}
        {success && <div className="alert alert-success">{success}</div>}
        <button className="btn btn-primary mb-3" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <div className="text-center">
          <small>
            Don't have an account? <Link to="/register">Register here</Link>
          </small>
        </div>
      </form>
    </div>
  )
}
