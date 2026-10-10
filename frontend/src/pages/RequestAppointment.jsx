import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'
import { doctorListFromResponse, prepareAppointmentRequest } from '../utils/appointments'

export default function RequestAppointment() {
  const [formData, setFormData] = useState({
    requested_start: '',
    reason: '',
    patient_notes: '',
    doctor: '',
  })
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [doctorError, setDoctorError] = useState(null)
  const [doctorReload, setDoctorReload] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const pendingSubmission = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    const loadDoctors = async () => {
      setLoadingDoctors(true)
      setDoctorError(null)
      try {
        const { data } = await api.get('/api/my-doctors/', { signal: controller.signal, timeout: 90000 })
        const availableDoctors = doctorListFromResponse(data)
        if (controller.signal.aborted) return
        setDoctors(availableDoctors)
        setFormData(current => availableDoctors.some(doctor => String(doctor.id) === current.doctor)
          ? current : { ...current, doctor: '' })
      } catch (requestError) {
        if (controller.signal.aborted) return
        setDoctorError(requestError)
      } finally {
        if (!controller.signal.aborted) setLoadingDoctors(false)
      }
    }
    loadDoctors()
    return () => controller.abort()
  }, [doctorReload])

  useEffect(() => () => pendingSubmission.current?.abort(), [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (pendingSubmission.current || loadingDoctors || doctorError) return
    setError(null)

    const controller = new AbortController()
    try {
      const requestData = prepareAppointmentRequest(formData, doctors)
      pendingSubmission.current = controller
      setSubmitting(true)
      await api.post('/api/appointments/', requestData, { signal: controller.signal, timeout: 90000 })
      if (!controller.signal.aborted) navigate('/portal/appointments')
    } catch (err) {
      if (!controller.signal.aborted) setError(err)
    } finally {
      pendingSubmission.current = null
      if (!controller.signal.aborted) setSubmitting(false)
    }
  }

  return (
    <div className="py-4" style={{ maxWidth: '600px' }}>
      <h1 className="mb-3">Request Appointment</h1>
      <p className="text-muted">
        Fill out the form below to request an appointment. Our staff will review
        and confirm your request.
      </p>
      <p className="small text-muted">Demo test</p>

      <form onSubmit={handleSubmit} className="card shadow-sm p-4" aria-busy={submitting}>
        <fieldset disabled={submitting}>
        <div className="mb-3">
          <label className="form-label" htmlFor="doctor">
            Doctor *
          </label>
          {loadingDoctors ? (
            <p className="text-muted small" role="status">Loading available doctors…</p>
          ) : doctorError ? (
            <ErrorAlert error={doctorError} onRetry={() => setDoctorReload(current => current + 1)} />
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
            maxLength={255}
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
            maxLength={5000}
            onChange={handleChange}
          />
        </div>

        {error && <ErrorAlert error={error} />}

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || loadingDoctors || !!doctorError || !formData.doctor || doctors.length === 0}
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
        </fieldset>
      </form>
    </div>
  )
}
