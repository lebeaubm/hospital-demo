import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export default function RequestAppointment() {
  const [formData, setFormData] = useState({
    requested_start: '',
    reason: '',
    patient_notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

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
      if (err.response?.data) {
        const errorData = err.response.data
        const errorMessages = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('. ')
        setError(errorMessages || 'Failed to request appointment.')
      } else {
        setError('Failed to request appointment. Please try again.')
      }
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

        {error && <div className="alert alert-danger">{error}</div>}
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
