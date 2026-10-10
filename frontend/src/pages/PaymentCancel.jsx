import { Link } from 'react-router-dom'

export default function PaymentCancel() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <div className="display-1 text-warning mb-3"></div>
              <h2 className="card-title">Payment Canceled</h2>
              <p className="card-text">
                Your payment was canceled. No charges have been made to your account.
              </p>
              <p className="text-muted">
                If you experienced any issues during the payment process, please try again
                or contact support for assistance.
              </p>

              <div className="d-flex gap-2 justify-content-center mt-4">
                <Link to="/portal/appointments" className="btn btn-primary">
                  Back to Appointments
                </Link>
                <Link to="/contact" className="btn btn-outline-secondary">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
