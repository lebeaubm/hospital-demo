import { Link } from 'react-router-dom'

export default function CareCTA({ title = 'Questions about care?', description = 'Our team can help with services, coverage, and next steps.' }) {
  return (
    <section className="care-cta" aria-label="Talk with our team">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="page-actions">
        <Link className="btn btn-gold" to="/contact">Contact us</Link>
        <a className="care-cta__phone" href="tel:9516213600">Call (951) 621-3600</a>
      </div>
    </section>
  )
}
