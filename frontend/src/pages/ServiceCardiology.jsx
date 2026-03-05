import { Link } from 'react-router-dom'
import serviceCardiology from '../assets/service-cardiology.svg'

export default function ServiceCardiology() {
  return (
    <div className="py-4">
      <h1 className="mb-3">Cardiology and Heart Health</h1>
      <img src={serviceCardiology} alt="Cardiology and heart health" className="img-fluid rounded shadow-sm border mb-4" />
      <p className="lead">
        Our heart health services support patients with cardiovascular risk factors and existing cardiac conditions.
      </p>
      <p>
        Care includes blood pressure and cholesterol monitoring, follow-up evaluations, medication management, and
        lifestyle guidance tailored to each patient’s needs.
      </p>
      <p className="mb-4">
        We work with patients and families to improve long-term outcomes and reduce avoidable complications.
      </p>
      <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
    </div>
  )
}
