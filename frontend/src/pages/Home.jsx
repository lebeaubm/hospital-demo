import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Home() {
  const { user } = useAuth()
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN'
  const isPatient = user?.role === 'PATIENT'

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
    <div className="pt-2 pb-4">
      <section className="mb-4 p-4 rounded marketing-card border">
        <p className="text-uppercase text-muted mb-2 fw-semibold">A Choice That Puts You First</p>
        <h1 className="display-6 fw-semibold mb-3">Peaceloving Home Health Inc.</h1>
        <p className="lead mb-3">
          A home health team dedicated to compassionate, high-quality care with advanced technology and
          personalized attention in the comfort and privacy of your home.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <a className="btn btn-primary" href="tel:9516213600">
            Call (951) 621-3600
          </a>
          <Link className="btn btn-outline-primary" to="/contact">
            Leave Us a Message
          </Link>
        </div>
      </section>

      <section className="mb-4">
        <div className="hero-banner-wrap" style={{ '--hero-height': '360px' }}>
          <img
            src={heroCareBanner}
            alt="Healthcare worker helping a patient at home"
            className="hero-banner-image"
            fetchPriority="high"
            decoding="async"
          />
          <div className="hero-overlay">
            <p className="hero-overlay-title">Compassionate In-Home Health Care</p>
            <p className="hero-overlay-subtitle">Supporting patients and families with warmth, dignity, and clinical excellence.</p>
          </div>
        </div>
      </section>

      <section className="mb-4">
        <div className="trust-strip d-flex flex-wrap gap-3 justify-content-between align-items-center">
          <span className="trust-chip">24/7 Availability</span>
          <span className="trust-chip">Personalized In-Home Care</span>
          <span className="trust-chip">Insurance Accepted</span>
        </div>
      </section>

      <section>
        <p className="section-kicker">Our Advantage</p>
        <h2 className="h4 mb-3">Why Choose Us</h2>
        <p className="section-intro">A coordinated care model designed to keep families informed, supported, and confident.</p>
        <div className="row g-3 mt-1">
        <div className="col-md-4">
          <div className="card h-100 marketing-card">
            <div className="card-body">
              <h3 className="h5 card-title">Comprehensive In-Home Care</h3>
              <ul className="mb-0 ps-3">
                {coreCareItems.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 marketing-card">
            <div className="card-body">
              <h3 className="h5 card-title">Personalized Care Planning</h3>
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
          <div className="card h-100 marketing-card">
            <div className="card-body">
              <h3 className="h5 card-title">We Care for All Ages</h3>
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
          <div className="card h-100 marketing-card">
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
          <div className="card h-100 marketing-card">
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
          <div className="card h-100 marketing-card">
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
          <div className="card h-100 marketing-card">
            <div className="card-body">
              <h3 className="h5">Stay Connected</h3>
              <p className="mb-0">A patient portal brings appointment requests and shared care information together in one place.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 marketing-card">
            <div className="card-body">
              <h3 className="h5">More One-on-One</h3>
              <p className="mb-0">Clear communication helps patients and families understand the plan for each visit.</p>
            </div>
          </div>
        </div>
      </div>

        <div className="mt-4 d-flex flex-wrap gap-2 cta-group">
          {isPatient && <Link className="btn btn-primary" to="/portal/appointments/request">Request Appointment</Link>}
          {isStaff && <Link className="btn btn-primary" to="/staff/dashboard">Open Staff Dashboard</Link>}
          <Link className="btn btn-outline-primary" to="/services">View Services</Link>
          <Link className="btn btn-outline-primary" to="/team">Meet Our Team</Link>
          <Link className="btn btn-outline-primary" to="/contact">Get in Touch</Link>
        </div>
      </section>

      <section className="mt-5" aria-labelledby="demo-overview-title">
        <h2 className="h4 mb-3" id="demo-overview-title">Quick Access</h2>
        <div className="row g-3">
          <div className="col-md-4">
            <article className="card marketing-card h-100"><div className="card-body d-flex flex-column">
              <h3 className="h5">Careers</h3>
              <p>Join our home health team.</p>
              <Link className="btn btn-outline-primary mt-auto align-self-start" to="/careers">Apply Now</Link>
            </div></article>
          </div>
          <div className="col-md-4">
            <article className="card marketing-card h-100"><div className="card-body d-flex flex-column">
              <h3 className="h5">Contact Us</h3>
              <p>Get in touch with our office.</p>
              <Link className="btn btn-outline-primary mt-auto align-self-start" to="/contact">Leave a Message</Link>
            </div></article>
          </div>
          <div className="col-md-4">
            <article className="card marketing-card h-100"><div className="card-body d-flex flex-column">
              <h3 className="h5">Patient & Staff Portal</h3>
              <p>Manage appointments and care information.</p>
              <Link className="btn btn-outline-primary mt-auto align-self-start" to={isStaff ? '/staff/dashboard' : isPatient ? '/portal/profile' : '/login'}>{isStaff || isPatient ? 'Open Workspace' : 'Sign In'}</Link>
            </div></article>
          </div>
        </div>
      </section>
    </div>
  )
}
