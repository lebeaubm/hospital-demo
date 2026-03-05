import careHeart from '../assets/care-heart.svg'
import medicalCross from '../assets/medical-cross.svg'
import heartShield from '../assets/heart-shield.svg'

export default function About() {
  return (
    <div className="py-4">
      <h1 className="mb-3">About Us</h1>
      <p className="lead mb-4">
        Hospital Demo is committed to delivering high-quality, compassionate care for patients and families.
      </p>

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

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h2 className="h5">Our Mission</h2>
              <div style={{ minHeight: '72px' }}></div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h2 className="h5">Why Families Choose Us</h2>
              <div style={{ minHeight: '72px' }}></div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h5 mb-3">Get in Touch</h2>
            <p className="mb-1"><strong>Phone:</strong> <a href="tel:5555555555">555-555-5555</a></p>
            <p className="mb-1"><strong>Email:</strong> <a href="mailto:hello@demohealth.com">hello@demohealth.com</a></p>
            <p className="mb-0"><strong>Location:</strong> 123 Care Lane, Suite 200, Cityville, CA 90000</p>
          </div>
        </div>
      </section>
    </div>
  )
}
