export default function Home() {
  return (
    <div className="py-4">
      <h1 className="mb-3">Hospital Demo</h1>
      <p className="lead">
        Welcome to the hospital demo portal. Explore our services, meet our
        doctors, and manage your appointments.
      </p>
      <div className="row g-3 mt-2">
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Compassionate Care</h5>
              <p className="card-text">
                Patient-first care with a focus on health outcomes.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Modern Facilities</h5>
              <p className="card-text">
                State-of-the-art diagnostics and treatment options.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Trusted Specialists</h5>
              <p className="card-text">
                Experienced clinicians across a wide range of specialties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
