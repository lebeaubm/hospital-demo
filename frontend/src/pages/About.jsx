import careHeart from '../assets/care-heart.svg'
import medicalCross from '../assets/medical-cross.svg'
import heartShield from '../assets/heart-shield.svg'

export default function About() {
  return (
    <div className="py-4">
      <h1 className="mb-3">About Us</h1>
      <p className="lead mb-4">
        Peaceloving Home Health Inc. provides compassionate, professional home health care that improves
        quality of life while promoting autonomy and dignity.
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
              <h2 className="h5">Mission</h2>
              <p className="mb-3">
                To deliver compassionate, professional home health care that enhances patient quality of life
                while promoting autonomy and dignity.
              </p>
              <h2 className="h5">Value</h2>
              <p className="mb-0">
                We prioritize strong family relationships in a healing, comfortable environment and provide
                respectful, empathetic care tailored to each patient.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h2 className="h5">Vision</h2>
              <p className="mb-3">
                To set a benchmark for excellence in home health care through innovative,
                patient-centered solutions and best practices.
              </p>
              <h2 className="h5">Our Promise</h2>
              <p className="mb-0">To treat every patient with dignity, respect, and empathy.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h5 mb-2">Service Area</h2>
            <p className="mb-0">We serve cities in Ventura, Los Angeles, Orange, San Bernardino, Riverside, and San Diego Counties.</p>
          </div>
        </div>
      </section>

      <section className="mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="h5 mb-3">Get in Touch</h2>
            <p className="mb-1"><strong>Phone:</strong> <a href="tel:9516213600">(951) 621-3600</a></p>
            <p className="mb-1"><strong>Fax:</strong> (951) 621-3606</p>
            <p className="mb-1"><strong>Hours:</strong> 24 Hours a Day, 7 Days a Week</p>
            <p className="mb-0"><strong>Location:</strong> 1307 W 6th Street, Suite 220C, Corona, CA 92882</p>
          </div>
        </div>
      </section>
    </div>
  )
}
