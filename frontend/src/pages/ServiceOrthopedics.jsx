import { Link } from 'react-router-dom'
import serviceOrthopedics from '../assets/service-orthopedics.svg'

export default function ServiceOrthopedics() {
  return (
    <div className="py-4">
      <h1 className="mb-3">Orthopedics and Sports Medicine</h1>
      <img src={serviceOrthopedics} alt="Orthopedics and sports medicine" className="img-fluid rounded shadow-sm border mb-4" />
      <p className="lead">
        Our orthopedic and mobility care helps patients recover from injuries and improve daily movement.
      </p>
      <p>
        We support joint pain management, rehabilitation coordination, recovery monitoring, and practical strategies
        to improve strength, balance, and flexibility.
      </p>
      <p className="mb-4">
        Treatment plans are designed around each patient’s activity level and long-term function goals.
      </p>
      <Link to="/contact" className="btn btn-primary">Get in Touch</Link>
    </div>
  )
}
