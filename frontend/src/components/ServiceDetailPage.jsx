import { Link } from 'react-router-dom'
import PageHero from './PageHero'
import CareCTA from './CareCTA'

export default function ServiceDetailPage({ title, description, image, imageAlt, paragraphs }) {
  return (
    <div className="public-page service-detail-page">
      <PageHero eyebrow="Care and wellness" title={title} description={description} image={image} imageAlt={imageAlt}>
        <Link className="btn btn-primary" to="/contact">Talk with Our Team</Link>
        <Link className="page-text-link" to="/services">All Services <span aria-hidden="true">→</span></Link>
      </PageHero>
      <section className="page-section service-detail-content">
        <div className="section-heading"><h2>How we can help.</h2></div>
        {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
      <CareCTA />
    </div>
  )
}
