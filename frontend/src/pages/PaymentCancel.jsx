import { Link } from 'react-router-dom'

export default function PaymentCancel() {
  return (
    <div className="payment-result-page">
      <div className="row justify-content-center">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center">
              <div className="display-1 text-warning mb-3"></div>
              <h1 className="card-title h2 mb-3">Payment Canceled</h1>
              <p className="card-text">
                The payment process was canceled. You can return to your appointments or contact our office for help.
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
