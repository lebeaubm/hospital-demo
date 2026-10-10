import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import CareCTA from '../components/CareCTA'
import { acceptedCoverage } from '../data/siteContent'

const serviceGroups = [
  {
    id: 'nursing', title: 'Nursing',
    description: 'Care from registered nurses and licensed vocational nurses, directed by your physician.',
    details: [
      { title: 'Skilled nursing', description: 'Health assessments, treatment, and updates for your care team.' },
      { title: 'Pediatric nursing', description: 'In-home skilled nursing includes physician-directed Synagis administration.' },
      { title: 'Care for older adults', description: 'Nursing support for the needs of older adults.' },
    ],
  },
  {
    id: 'therapy', title: 'Therapy',
    description: 'Support for movement, daily activities, speech, and swallowing.',
    details: [
      { title: 'Physical therapy', description: 'Support for movement, mobility aids, and pain management.' },
      { title: 'Occupational therapy', description: 'Help with daily activities such as eating, bathing, dressing, and toileting.' },
      { title: 'Speech therapy', description: 'Support for speech and swallowing skills.' },
    ],
  },
  {
    id: 'specialty', title: 'Specialty care',
    description: 'Treatments and monitoring for specific care needs.',
    details: [
      { title: 'IV therapy and line care', description: 'IV therapy, injections, and central line care.' },
      { title: 'Wound and ostomy care', description: 'Wound care, wound vac support, and ostomy care.' },
      { title: 'Feeding support', description: 'TPN and enteral feeding: nutrition delivered through an IV or feeding tube.' },
      { title: 'Diabetes support', description: 'Diabetes education, blood sugar monitoring, and insulin preparation and administration.' },
      { title: 'Respiratory care', description: 'Tracheotomy care and support for patients who depend on a ventilator.' },
      { title: 'Other specialty services', description: 'Blood draws and Foley catheter care.' },
    ],
  },
  {
    id: 'daily-support', title: 'Daily support',
    description: 'Personal care, nutrition support, and community resources.',
    details: [
      { title: 'Home health aides', description: 'Personal care and help with housekeeping, shopping, and limited meal preparation.' },
      { title: 'Medical social services', description: 'Connections to resources such as delivered meals and transportation.' },
      { title: 'Dietitian consultation', description: 'Diet instructions from nurses and dietitian support for complex needs.' },
    ],
  },
]

export default function Services() {
  return (
    <div className="public-page">
      <PageHero eyebrow="Our services" title="Support for life at home" description="Nursing, therapy, specialty care, and daily support tailored to your care plan."
        image="https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1000&q=80" imageAlt="A healthcare professional providing clinical care">
        <Link className="btn btn-primary" to="/contact">Ask about care</Link>
      </PageHero>
      <section className="page-section" id="care-options" aria-labelledby="care-options-title">
        <div className="section-heading"><h2 id="care-options-title">Explore our services</h2><p>Select a category to see what’s included.</p></div>
        <div className="service-category-grid">{serviceGroups.map((group) => <article className="service-category-card" id={group.id} key={group.id}>
          <h3>{group.title}</h3><p>{group.description}</p>
          <details className="service-details"><summary aria-label={`View ${group.title.toLowerCase()} services`}>View services</summary><div className="service-details__content"><dl>{group.details.map((detail) => <div key={detail.title}><dt>{detail.title}</dt><dd>{detail.description}</dd></div>)}</dl></div></details>
        </article>)}</div>
      </section>
      <section className="page-section arranged-services" aria-labelledby="arranged-services-title">
        <div className="section-heading"><h2 id="arranged-services-title">Services by arrangement</h2><p>Ask us about coordinating additional support.</p></div>
        <ul className="coverage-chips"><li>Laboratory services</li><li>Pharmaceutical services</li><li>Respiratory treatment</li><li>Medical equipment and supplies</li></ul>
      </section>
      <section className="page-section coverage-section" aria-labelledby="services-coverage-title">
        <div className="section-heading"><h2 id="services-coverage-title">Insurance and payment</h2><p>Contact us to discuss your coverage.</p></div>
        <ul className="coverage-chips" aria-label="Accepted coverage and payment options">{acceptedCoverage.map((coverage) => <li key={coverage}>{coverage}</li>)}</ul>
      </section>
      <CareCTA title="Need help choosing care?" description="Tell us what support you need." />
    </div>
  )
}
