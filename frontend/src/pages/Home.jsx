export default function Home() {
  const heroCareBanner = 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1600&q=80'

  const coreCareItems = [
    'Intermittent and Extended Care',
    'Private Duty and Shift Care',
    'Educational Programs for Individual Needs',
    'Patient Satisfaction Follow Up',
    'Cost-Competitive Quality Service',
    'Patient/Family Involvement in Plan of Care',
    'Team Approach and Community Resource',
  ]

  const featuredPrograms = [
    'I.V. Therapy/Injections',
    'TPN/Enteral Feedings',
    'Wound Care/Wound Vac',
    'Ventilator-Dependent Client Support',
    'Ostomy Care',
    'Central Line Maintenance and Care',
  ]

  return (
    <div className="py-4">
      <section className="mb-4 p-4 rounded bg-light border">
        <p className="text-uppercase text-muted mb-2 fw-semibold">A Choice That Puts You First</p>
        <h1 className="mb-3">Peaceloving Home Health Inc.</h1>
        <p className="lead mb-3">
          A home health team dedicated to compassionate, high-quality care with advanced technology and
          personalized attention in the comfort and privacy of your home.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <a className="btn btn-primary" href="tel:9516213600">
            Call (951) 621-3600
          </a>
          <a className="btn btn-outline-primary" href="/contact">
            Leave Us a Message
          </a>
        </div>
      </section>

      <section className="mb-4">
        <img
          src={heroCareBanner}
          alt="Healthcare worker helping a patient at home"
          className="img-fluid rounded shadow-sm border w-100"
          style={{ maxHeight: '360px', objectFit: 'cover' }}
        />
      </section>

      <section>
        <h2 className="h4 mb-3">Why Choose Us</h2>
        <div className="row g-3 mt-1">
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Comprehensive In-Home Care</h5>
              <ul className="mb-0 ps-3">
                {coreCareItems.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Personalized Care Planning</h5>
              <ul className="mb-0 ps-3">
                {coreCareItems.slice(3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-2 mb-0 fw-semibold">All in the privacy of your home.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">We Care for All Ages</h5>
              <p className="card-text mb-2">Our services have no age limits.</p>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge text-bg-primary">Children</span>
                <span className="badge text-bg-primary">Adults</span>
                <span className="badge text-bg-primary">Seniors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-2">
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h3 className="h5">What We Offer</h3>
              <ul className="mb-0 ps-3">
                {featuredPrograms.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h3 className="h5">Insurance Accepted</h3>
              <p className="mb-2">Medicare, Medi-Cal, Workers Compensation, Private Insurance, Private Payment, CCS, and Regional Center.</p>
              <p className="mb-0"><strong>Serving:</strong> Ventura, Los Angeles, Orange, San Bernardino, Riverside, and San Diego Counties.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-2">
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h3 className="h5">Why Families Choose Us</h3>
              <ul className="mb-0 ps-3">
                <li>Specialist doctor available</li>
                <li>Fast access to care</li>
                <li>Specialized personal care</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h3 className="h5">Did You Know?</h3>
              <p className="mb-0">Modern tools with a patient-centered digital care integrated clinical ecosystem.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h3 className="h5">More One-on-One</h3>
              <p className="mb-0">Personalized engagement and education with data-driven operations.</p>
            </div>
          </div>
        </div>
      </div>

        <div className="mt-4 d-flex flex-wrap gap-2">
          <span className="fw-semibold align-self-center me-2">Book An Appointment Now</span>
          <a className="btn btn-outline-secondary" href="/services">View Services</a>
          <a className="btn btn-outline-secondary" href="/doctors">Meet Doctors</a>
          <a className="btn btn-outline-secondary" href="/contact">Get in Touch</a>
        </div>
      </section>
    </div>
  )
}
