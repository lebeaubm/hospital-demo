import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setTokens } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { getUserInfo } from '../utils/auth'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
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
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      // Register the user
      await api.post('/api/auth/register/', formData)
      
      // Auto-login after successful registration
      const { data } = await api.post('/api/auth/login/', {
        email: formData.email,
        password: formData.password,
      })
      
      setTokens({ access: data.access, refresh: data.refresh })
      
      // Fetch user info to get role
      const userInfo = await getUserInfo(api)
      
      login(userInfo)
      setSuccess('Registration successful!')
      
      setTimeout(() => {
        navigate('/portal/profile')
      }, 500)
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data
        const errorMessages = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('. ')
        setError(errorMessages || 'Registration failed. Please try again.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4" style={{ maxWidth: '560px' }}>
      <h1 className="mb-3">Register</h1>
      <p className="text-muted">Create a patient account to get started.</p>
      <form onSubmit={handleSubmit} className="card shadow-sm p-4">
        <div className="mb-3">
          <label className="form-label" htmlFor="email">
            Email *
          </label>
          <input
            className="form-control"
            id="email"
            name="email"
            type="email"
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
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <button className="btn btn-primary mb-3" type="submit" disabled={submitting}>
          {submitting ? 'Registering...' : 'Register'}
        </button>
        <div className="text-center">
          <small>
            Already have an account? <Link to="/login">Login here</Link>
          </small>
        </div>
      </form>
    </div>
  )
}
