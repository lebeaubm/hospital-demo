import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'

export default function RequestAppointment() {
  const [formData, setFormData] = useState({
    requested_start: '',
    reason: '',
    patient_notes: '',
    doctor: '',
  })
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/my-doctors/')
      .then(res => setDoctors(res.data.results || res.data))
      .catch(console.error)
      .finally(() => setLoadingDoctors(false))
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess('')
    setSubmitting(true)

    try {
      // Convert local datetime to ISO format
      const requestData = {
        ...formData,
        requested_start: new Date(formData.requested_start).toISOString(),
      }
      
      await api.post('/api/appointments/', requestData)
      setSuccess('Appointment requested successfully!')
      
      setTimeout(() => {
        navigate('/portal/appointments')
      }, 1000)
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4" style={{ maxWidth: '600px' }}>
      <h1 className="mb-3">Request Appointment</h1>
      <p className="text-muted">
        Fill out the form below to request an appointment. Our staff will review
        and confirm your request.
      </p>

      <form onSubmit={handleSubmit} className="card shadow-sm p-4">
        <div className="mb-3">
          <label className="form-label" htmlFor="doctor">
            Doctor *
          </label>
          {loadingDoctors ? (
            <p className="text-muted small">Loading available doctors…</p>
          ) : doctors.length === 0 ? (
            <div className="alert alert-warning py-2">
              No doctors have been assigned to your account yet. Please contact staff.
            </div>
          ) : (
            <select
              className="form-select"
              id="doctor"
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              required
            >
              <option value="">-- Select a doctor --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} &mdash; {d.specialty}
                  {d.is_accessible_to_all ? ' (General)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="requested_start">
            Preferred Date & Time *
          </label>
          <input
            className="form-control"
            id="requested_start"
            name="requested_start"
            type="datetime-local"
            value={formData.requested_start}
            onChange={handleChange}
            required
          />
          <small className="text-muted">
            Select your preferred appointment time. Staff will confirm availability.
          </small>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="reason">
            Reason for Visit *
          </label>
          <input
            className="form-control"
            id="reason"
            name="reason"
            type="text"
            placeholder="e.g., Annual checkup, Follow-up, Consultation"
            value={formData.reason}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="patient_notes">
            Additional Notes
          </label>
          <textarea
            className="form-control"
            id="patient_notes"
            name="patient_notes"
            rows="4"
            placeholder="Any additional information or preferences..."
            value={formData.patient_notes}
            onChange={handleChange}
          />
        </div>

        {error && <ErrorAlert error={error} />}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate('/portal/appointments')}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
