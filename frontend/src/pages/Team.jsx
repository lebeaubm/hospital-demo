import { Link } from 'react-router-dom'

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
        />
      </section>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <section className="card h-100 marketing-card">
            <div className="card-body">
              <h2 className="h5">Care with heart</h2>
              <p className="mb-0">
                Our caregivers meet each person with respect, warmth, and attention to the things
                that make them feel safe and understood.
              </p>
            </div>
          </section>
        </div>
        <div className="col-md-4">
          <section className="card h-100 marketing-card">
            <div className="card-body">
              <h2 className="h5">People who show up</h2>
              <p className="mb-0">
                From clinical professionals to the people coordinating each visit, our team works
                hard behind the scenes and at the bedside to make care dependable.
              </p>
            </div>
          </section>
        </div>
        <div className="col-md-4">
          <section className="card h-100 marketing-card">
            <div className="card-body">
              <h2 className="h5">One team, working together</h2>
              <p className="mb-0">
                We stay connected with patients and families, sharing information and coordinating
                support around each person’s needs and goals.
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
          <Link className="btn btn-primary flex-shrink-0" to="/login">
            Team Login
          </Link>
        </div>
        <div className="card-body pt-0">
          <Link className="btn btn-outline-primary" to="/register">
            Sign Up
          </Link>
        </div>
      </section>
    </div>
  )
}