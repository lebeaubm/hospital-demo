import { PORTAL_SITE_URL } from '../config/site'

export default function Team() {
  return (
    <div className="pt-2 pb-4">
      <p className="section-kicker">The People Behind Your Care</p>
      <h1 className="mb-3">A caring team, right there at home</h1>
      <p className="lead mb-4">
        Home health is personal. Our dedicated team brings skill, patience, and a little extra
        kindness to every visit, helping people feel supported in the place they know best.
      </p>

      <section className="mb-4">
        <img
          src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1800&q=85"
          alt="Home health professionals working together to support patient care"
          className="gallery-image w-100"
          decoding="async"
        />
      </section>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <section className="card h-100 marketing-card">
            <div className="card-body">
              <h2 className="h5">Skilled nursing</h2>
              <p className="mb-0">
                Nurses support each person's care plan and keep patients and families informed
                throughout their home health visits.
              </p>
            </div>
          </section>
        </div>
        <div className="col-md-4">
          <section className="card h-100 marketing-card">
            <div className="card-body">
              <h2 className="h5">Therapy and daily support</h2>
              <p className="mb-0">
                Therapists and home health aides bring practical support to daily routines,
                with attention to each person's goals and needs.
              </p>
            </div>
          </section>
        </div>
        <div className="col-md-4">
          <section className="card h-100 marketing-card">
            <div className="card-body">
              <h2 className="h5">Care coordination</h2>
              <p className="mb-0">
                Our coordinators help organize visits and keep the care team, patients,
                and families connected.
              </p>
            </div>
          </section>
        </div>
      </div>

      <section className="card marketing-card">
        <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="h5 mb-1">Part of the care team?</h2>
            <p className="mb-0">Sign in to continue to your team workspace.</p>
          </div>
          <a className="btn btn-primary flex-shrink-0" href={`${PORTAL_SITE_URL}/login`}>
            Team Login
          </a>
        </div>
        <div className="card-body pt-0">
          <a className="btn btn-outline-primary" href={`${PORTAL_SITE_URL}/register`}>
            Sign Up
          </a>
        </div>
      </section>
    </div>
  )
}
