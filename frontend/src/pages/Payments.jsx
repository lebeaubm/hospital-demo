import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPaymentHistory, downloadInvoice } from '../api/client'
import { SkeletonList } from '../components/SkeletonLoader'
import ErrorAlert from '../components/ErrorAlert'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPaymentHistory()
      setPayments(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async (paymentId, invoiceNumber) => {
    setDownloadingInvoice(paymentId)
    try {
      const blob = await downloadInvoice(paymentId)
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice_${invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download invoice. Please try again.')
    } finally {
      setDownloadingInvoice(null)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-success'
      case 'PENDING':
        return 'bg-warning'
      case 'FAILED':
        return 'bg-danger'
      case 'REFUNDED':
        return 'bg-secondary'
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

  if (loading) {
    return (
      <div className="py-4">
        <h1 className="mb-3">Payment History</h1>
        <SkeletonList />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <h1 className="mb-3">Payment History</h1>
        <ErrorAlert error={error} onRetry={fetchPayments} />
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">Payment History</h1>
        <Link className="btn btn-primary" to="/portal/appointments">
          Back to Appointments
        </Link>
      </div>

      {payments.length === 0 && (
        <div className="alert alert-info">
          You have no payment history yet.{' '}
          <Link to="/portal/appointments">View your appointments</Link> to make a payment.
        </div>
      )}

      {payments.length > 0 && (
        <div className="row g-3">
          {payments.map((payment) => (
            <div className="col-12" key={payment.id}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">
                      Payment #{payment.id}
                    </h5>
                    <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-1">
                        <strong>Amount:</strong> ${payment.amount} {payment.currency.toUpperCase()}
                      </p>
                      <p className="mb-1">
                        <strong>Created:</strong> {formatDateTime(payment.created_at)}
                      </p>
                      {payment.paid_at && (
                        <p className="mb-1">
                          <strong>Paid:</strong> {formatDateTime(payment.paid_at)}
                        </p>
                      )}
                    </div>
                    <div className="col-md-6">
                      {payment.appointment_id && (
                        <p className="mb-1">
                          <strong>Appointment:</strong> #{payment.appointment_id}
                        </p>
                      )}
                      {payment.stripe_payment_intent_id && (
                        <p className="mb-1">
                          <strong>Payment Intent:</strong>{' '}
                          <small className="text-muted font-monospace">
                            {payment.stripe_payment_intent_id.substring(0, 20)}...
                          </small>
                        </p>
                      )}
                      {payment.receipt_url && (
                        <p className="mb-1">
                          <a 
                            href={payment.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-decoration-none"
                          >
                            View Stripe Receipt →
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {payment.status === 'PAID' && payment.has_invoice && (
                    <div className="mt-3">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleDownloadInvoice(payment.id, `${payment.id}`)}
                        disabled={downloadingInvoice === payment.id}
                      >
                        {downloadingInvoice === payment.id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Downloading...
                          </>
                        ) : (
                          <>📄 Download Invoice</>
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
