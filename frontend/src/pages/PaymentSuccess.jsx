import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyPayment } from '../api/client'
import { SkeletonCard } from '../components/SkeletonLoader'
import PageHeader from '../components/PageHeader'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      setError('We could not find a payment to check. Return to your appointments, or call our office if you need help.')
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
      <div className="payment-result-page">
        <PageHeader title="Checking your payment…" description="Please wait while we confirm the payment details." eyebrow="Payments" />
        <div className="row justify-content-center">
          <div className="col-12">
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="payment-result-page">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center">
                <div className="display-1 text-danger mb-3"></div>
                <h1 className="card-title h2 mb-3">Payment Verification Failed</h1>
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
    <div className="payment-result-page">
      <div className="row justify-content-center">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center">
              <div className="display-1 text-success mb-3"></div>
              <h1 className="card-title h2 mb-3">Payment Successful!</h1>
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
