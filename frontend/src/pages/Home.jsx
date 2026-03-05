import careHeart from '../assets/care-heart.svg'
import medicalCross from '../assets/medical-cross.svg'
import heartShield from '../assets/heart-shield.svg'

export default function Home() {
  return (
    <div className="py-4">
      <section className="mb-4 p-4 rounded bg-light border">
        <p className="text-uppercase text-muted mb-2 fw-semibold">We’re Here for You</p>
        <h1 className="mb-3">Providing Reliable Care at Home</h1>
        <p className="lead mb-3">
          Dedicated to helping patients and families access quality care,
          coordinate services, and stay connected with clinicians.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <a className="btn btn-primary" href="tel:5555555555">
            Call 555-555-5555
          </a>
          <a className="btn btn-outline-primary" href="/contact">
            Leave Us a Message
          </a>
        </div>
      </section>

      <section className="mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <img src={careHeart} alt="Heart care" className="img-fluid rounded shadow-sm border" />
          </div>
          <div className="col-md-4">
            <img src={medicalCross} alt="Medical cross" className="img-fluid rounded shadow-sm border" />
          </div>
          <div className="col-md-4">
            <img src={heartShield} alt="Protective heart" className="img-fluid rounded shadow-sm border" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="h4 mb-3">What You Can Do Here</h2>
        <div className="row g-3 mt-1">
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Compassionate Care</h5>
              <p className="card-text">
                Patient-first care with a focus on comfort, safety, and health outcomes.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Service Coordination</h5>
              <p className="card-text">
                Explore services, request appointments, and manage records in one place.
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

        <div className="mt-4 d-flex flex-wrap gap-2">
          <a className="btn btn-outline-secondary" href="/services">View Services</a>
          <a className="btn btn-outline-secondary" href="/doctors">Meet Doctors</a>
          <a className="btn btn-outline-secondary" href="/contact">Get in Touch</a>
        </div>
      </section>
    </div>
  )
}
