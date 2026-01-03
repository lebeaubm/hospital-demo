import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyPayment } from '../api/client'
import { SkeletonCard } from '../components/SkeletonLoader'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      setError('No session ID provided')
      setLoading(false)
      return
    }

    const verify = async () => {
      try {
        const data = await verifyPayment(sessionId)
        setPayment(data)
      } catch (err) {
        console.error('Verification error:', err)
        setError(err.response?.data?.error || 'Failed to verify payment')
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [searchParams])

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="display-1 text-danger mb-3">❌</div>
                <h2 className="card-title">Payment Verification Failed</h2>
                <p className="card-text text-muted">{error}</p>
                <Link to="/portal/appointments" className="btn btn-primary">
                  Back to Appointments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <div className="display-1 text-success mb-3">✅</div>
              <h2 className="card-title">Payment Successful!</h2>
              <p className="card-text">
                Thank you for your payment. Your consultation fee has been processed.
              </p>

              {payment && (
                <div className="mt-4">
                  <div className="alert alert-info text-start">
                    <h5 className="alert-heading">Payment Details</h5>
                    <hr />
                    <p className="mb-1">
                      <strong>Amount:</strong> ${payment.amount} {payment.currency.toUpperCase()}
                    </p>
                    <p className="mb-1">
                      <strong>Status:</strong>{' '}
                      <span className="badge bg-success">{payment.status}</span>
                    </p>
                    {payment.paid_at && (
                      <p className="mb-0">
                        <strong>Paid At:</strong>{' '}
                        {new Date(payment.paid_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {payment.has_invoice && (
                    <div className="alert alert-success">
                      Your invoice is ready! You can download it from the{' '}
                      <Link to="/portal/payments">Payments page</Link>.
                    </div>
                  )}
                </div>
              )}

              <div className="d-flex gap-2 justify-content-center mt-4">
                <Link to="/portal/payments" className="btn btn-primary">
                  View Payment History
                </Link>
                <Link to="/portal/appointments" className="btn btn-outline-secondary">
                  Back to Appointments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
