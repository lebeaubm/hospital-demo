import { Link } from 'react-router-dom'
import servicePrimaryCare from '../assets/service-primary-care.svg'

export default function ServicePrimaryCare() {
  return (
    <div className="py-4">
      <h1 className="mb-3">Primary Care and Wellness Exams</h1>
      <img src={servicePrimaryCare} alt="Primary care and wellness" className="img-fluid rounded shadow-sm border mb-4" />
      <p className="lead">
        Our primary care team focuses on preventive care, routine screenings, and personalized wellness support.
      </p>
      <p>
        Services include annual exams, chronic condition monitoring, medication review, and care planning to help
        patients stay healthy and independent.
      </p>
      <p className="mb-4">
        We coordinate closely with specialists when needed to ensure each patient receives consistent, connected care.
      </p>
      <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
    </div>
  )
}
