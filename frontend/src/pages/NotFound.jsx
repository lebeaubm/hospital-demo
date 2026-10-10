import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <section className="card marketing-card">
            <div className="card-body p-4">
              <p className="section-kicker">404</p>
              <h1 className="mb-3">Page not found</h1>
              <p className="lead mb-4">
                This link may have changed, or the address may be incomplete. Head to our
                home page or contact page to find what you need.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link className="btn btn-primary" to="/">Back to Home</Link>
                <Link className="btn btn-outline-primary" to="/contact">Contact Us</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
