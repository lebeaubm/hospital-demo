import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, createCheckoutSession } from '../api/client'
import { SkeletonAppointmentCard } from '../components/SkeletonLoader'
import ErrorAlert from '../components/ErrorAlert'

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(null)
  const [stripeConfigured, setStripeConfigured] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/api/appointments/my/')
      setAppointments(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-warning'
      case 'CONFIRMED':
        return 'bg-success'
      case 'COMPLETED':
        return 'bg-secondary'
      case 'CANCELED':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const handlePayConsultationFee = async (appointmentId) => {
    setPaymentLoading(appointmentId)
    try {
      const data = await createCheckoutSession(appointmentId)
      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (err) {
      console.error('Payment error:', err)
      const errorMessage = err.response?.data?.error || 'Failed to create payment session. Please try again.'
      
      // Check if it's a Stripe configuration error
      if (err.response?.status === 503) {
        setStripeConfigured(false)
        alert('⚠️ Payment System Not Available\n\n' + errorMessage + '\n\nPayments are currently disabled. Please contact support or try again later.')
      } else {
        alert(errorMessage)
      }
      setPaymentLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="py-4">
        <h1 className="mb-3">My Appointments</h1>
        <div className="row g-3">
          {[1, 2, 3].map((i) => (
            <div className="col-12" key={i}>
              <SkeletonAppointmentCard />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <h1 className="mb-3">My Appointments</h1>
        <ErrorAlert error={error} onRetry={fetchAppointments} />
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">My Appointments</h1>
        <Link className="btn btn-primary" to="/portal/appointments/request">
          Request Appointment
        </Link>
      </div>

      {appointments.length === 0 && (
        <div className="alert alert-info">
          You have no appointments yet.{' '}
          <Link to="/portal/appointments/request">Request one now</Link>.
        </div>
      )}

      {!error && appointments.length > 0 && (
        <div className="row g-3">
          {appointments.map((appointment) => (
            <div className="col-12" key={appointment.id}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">
                      Appointment #{appointment.id}
                    </h5>
                    <span
                      className={`badge ${getStatusBadgeClass(appointment.status)}`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <p className="mb-1">
                        <strong>Reason:</strong> {appointment.reason}
                      </p>
                      <p className="mb-1">
                        <strong>Requested:</strong>{' '}
                        {formatDateTime(appointment.requested_start)}
                      </p>
                      {appointment.scheduled_start && (
                        <p className="mb-1">
                          <strong>Scheduled:</strong>{' '}
                          {formatDateTime(appointment.scheduled_start)}
                        </p>
                      )}
                    </div>
                    <div className="col-md-6">
                      {appointment.patient_notes && (
                        <p className="mb-1">
                          <strong>Your notes:</strong> {appointment.patient_notes}
                        </p>
                      )}
                      {appointment.staff_notes && (
                        <p className="mb-1">
                          <strong>Staff notes:</strong> {appointment.staff_notes}
                        </p>
                      )}
                      <p className="mb-0 text-muted">
                        <small>
                          Created: {formatDateTime(appointment.created_at)}
                        </small>
                      </p>
                    </div>
                  </div>
                  {stripeConfigured && (
                    <div className="mt-3">
                      <button
                        className="btn btn-primary"
                        onClick={() => handlePayConsultationFee(appointment.id)}
                        disabled={paymentLoading === appointment.id}
                      >
                        {paymentLoading === appointment.id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                          </>
                        ) : (
                          <>💳 Pay Consultation Fee</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
