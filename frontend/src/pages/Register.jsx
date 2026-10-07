import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setTokens } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorAlert from '../components/ErrorAlert'
import AccountLayout from '../components/AccountLayout'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting || accountCreated) return
    setError(null)
    setSuccess('')
    setSubmitting(true)

    try {
      await api.post('/api/auth/register/', formData)
      setAccountCreated(true)
    } catch (err) {
      setError(err)
      setSubmitting(false)
      return
    }

    try {
      const { data } = await api.post('/api/auth/login/', {
        email: formData.email,
        password: formData.password,
      })
      
      setTokens({ access: data.access, refresh: data.refresh })
      login()
      setSuccess('Registration successful!')
      navigate('/portal')
    } catch {
      setSuccess('Your account was created. Automatic sign-in could not be completed. Please sign in with your new account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AccountLayout title="Create your account." description="Sign up for a patient account to get started with your personal workspace.">
      <form onSubmit={handleSubmit} className="auth-panel" aria-busy={submitting} aria-describedby="signup-account-notice">
        <p className="auth-panel__hint" id="signup-account-notice">New accounts are patient accounts. For staff access, <Link to="/contact">contact our office</Link>.</p>
        <p className="small text-muted">Demo test</p>
        <fieldset disabled={submitting || accountCreated}>
        <legend className="visually-hidden">Sign Up</legend>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">
            Email *
          </label>
          <input
            className="form-control"
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            maxLength={254}
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="password">
            Password *
          </label>
          <input
            className="form-control"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="first_name">
            First Name
          </label>
          <input
            className="form-control"
            id="first_name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            value={formData.first_name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="last_name">
            Last Name
          </label>
          <input
            className="form-control"
            id="last_name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>
        {error && <ErrorAlert error={error} />}
        {success && <div className="alert alert-success" role="status">{success}{accountCreated && !submitting && <> <Link to="/login">Sign in</Link>.</>}</div>}
        <button className="btn btn-primary" type="submit" disabled={submitting || accountCreated}>
          {submitting ? 'Creating account…' : 'Sign Up'}
        </button>
        </fieldset>
        <p className="auth-panel__switch">Already have an account? <Link to="/login">Sign In</Link></p>
      </form>
    </AccountLayout>
  )
}
