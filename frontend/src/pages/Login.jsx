import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setTokens } from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const { data } = await api.post('/api/auth/login/', {
        email,
        password,
      })
      setTokens({ access: data.access, refresh: data.refresh })
      setSuccess('Logged in successfully.')
      navigate('/doctors')
    } catch (err) {
      setError('Login failed. Check your credentials and try again.')
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
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
