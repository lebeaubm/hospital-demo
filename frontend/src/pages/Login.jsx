import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setTokens } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { getUserInfo } from '../utils/auth'
import ErrorAlert from '../components/ErrorAlert'
import AccountLayout from '../components/AccountLayout'

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
    if (submitting) return
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
      if (userInfo?.role === 'STAFF' || userInfo?.role === 'OWNER' || userInfo?.role === 'ADMIN') {
        navigate('/staff')
      } else {
        navigate('/portal')
      }
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AccountLayout title="Welcome back." description="Sign in with your patient, staff, owner, or administrator account to open your workspace.">
      <form onSubmit={handleSubmit} className="auth-panel" aria-busy={submitting}>
        <fieldset disabled={submitting}>
        <legend className="visually-hidden">Sign In</legend>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            className="form-control"
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            maxLength={254}
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
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error && <ErrorAlert error={error} />}
        {success && <div className="alert alert-success">{success}</div>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
        </fieldset>
        <p className="auth-panel__switch">New here? <Link to="/register">Sign Up for a patient account</Link></p>
      </form>
    </AccountLayout>
  )
}
