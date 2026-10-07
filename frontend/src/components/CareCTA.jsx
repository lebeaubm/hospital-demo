import { Link } from 'react-router-dom'

export default function CareCTA({ title = 'Let’s talk about the care you need.', description = 'Ask about our services, coverage options, or care in your area.' }) {
  return (
    <section className="care-cta" aria-label="Talk with our team">
      <div>
        <p className="page-eyebrow">Here to help</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="page-actions">
        <Link className="btn btn-gold" to="/contact">Contact Us</Link>
        <a className="care-cta__phone" href="tel:9516213600">Call (951) 621-3600</a>
      </div>
    </section>
  )
}
