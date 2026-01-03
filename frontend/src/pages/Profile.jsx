import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone_number: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    insurance_provider: '',
    insurance_policy_number: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/api/patients/me/')
      setProfile(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        date_of_birth: data.date_of_birth || '',
        phone_number: data.phone_number || '',
        address: data.address || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        insurance_provider: data.insurance_provider || '',
        insurance_policy_number: data.insurance_policy_number || '',
      })
      setLoading(false)
    } catch (err) {
      setError('Unable to load profile.')
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const { data } = await api.patch('/api/patients/me/', formData)
      setProfile(data)
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-4">
        <h1 className="mb-3">My Profile</h1>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="py-4">
      <h1 className="mb-3">My Profile</h1>
      {profile && (
        <div className="mb-3">
          <p className="text-muted">
            Email: <strong>{profile.email}</strong>
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="card shadow-sm p-4">
        <h5 className="mb-3">Personal Information</h5>
        <div className="row">
          <div className="col-md-6 mb-3">
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
          <div className="col-md-6 mb-3">
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
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="date_of_birth">
              Date of Birth
            </label>
            <input
              className="form-control"
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="phone_number">
              Phone Number
            </label>
            <input
              className="form-control"
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="address">
            Address
          </label>
          <input
            className="form-control"
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <h5 className="mb-3 mt-4">Emergency Contact</h5>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="emergency_contact_name">
              Name
            </label>
            <input
              className="form-control"
              id="emergency_contact_name"
              name="emergency_contact_name"
              type="text"
              value={formData.emergency_contact_name}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="emergency_contact_phone">
              Phone
            </label>
            <input
              className="form-control"
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <h5 className="mb-3 mt-4">Insurance Information</h5>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="insurance_provider">
              Provider
            </label>
            <input
              className="form-control"
              id="insurance_provider"
              name="insurance_provider"
              type="text"
              value={formData.insurance_provider}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label" htmlFor="insurance_policy_number">
              Policy Number
            </label>
            <input
              className="form-control"
              id="insurance_policy_number"
              name="insurance_policy_number"
              type="text"
              value={formData.insurance_policy_number}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
