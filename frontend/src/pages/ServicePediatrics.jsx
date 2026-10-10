import { Link } from 'react-router-dom'
import servicePediatrics from '../assets/service-pediatrics.svg'

export default function ServicePediatrics() {
  return (
    <div className="py-4">
      <h1 className="mb-3">Pediatrics and Family Care</h1>
      <img src={servicePediatrics} alt="Pediatrics and family care" className="img-fluid rounded shadow-sm border mb-4" />
      <p className="lead">
        Our pediatric and family care services provide compassionate support from infancy through adolescence.
      </p>
      <p>
        We offer wellness visits, developmental guidance, preventive screenings, and follow-up care tailored to
        children’s changing health needs.
      </p>
      <p className="mb-4">
        Families receive clear communication, care coordination, and practical guidance for at-home health support.
      </p>
      <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
    </div>
  )
}
