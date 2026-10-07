import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import CareCTA from '../components/CareCTA'
import { acceptedCoverage } from '../data/siteContent'

const serviceGroups = [
  {
    id: 'nursing', title: 'Nursing', label: 'Professional care at home',
    description: 'Registered nurses and licensed vocational nurses provide care directed by your physician, assess your needs, and keep your care team informed.',
    details: [
      { title: 'Professional nursing', description: 'Skilled nurses assess treatment needs, deliver care, and report on patient health status.' },
      { title: 'Pediatric nursing', description: 'In-home skilled nursing includes physician-directed Synagis administration.' },
      { title: 'Geriatric care', description: 'Nursing support for the needs of older adults.' },
    ],
  },
  {
    id: 'therapy', title: 'Therapy', label: 'Support for everyday progress',
    description: 'Work on mobility, daily activities, speech, and swallowing with professional therapy support.',
    details: [
      { title: 'Physical therapy', description: 'Support for mobility, using mobility aids, and managing pain.' },
      { title: 'Occupational therapy', description: 'Help with daily activities such as eating, bathing, dressing, and toileting.' },
      { title: 'Speech therapy', description: 'Support for speech and swallowing skills.' },
    ],
  },
  {
    id: 'specialty', title: 'Specialty Care', label: 'Support for specific care needs',
    description: 'Nursing treatments and monitoring for patients who need specialized support at home.',
    details: [
      { title: 'I.V. and line care', description: 'I.V. therapy, injections, and central line maintenance and care.' },
      { title: 'Wound and ostomy care', description: 'Wound care, wound vac support, and ostomy care.' },
      { title: 'Feeding support', description: 'TPN and enteral feedings: nutrition delivered through an I.V. or feeding tube.' },
      { title: 'Diabetes support', description: 'Diabetes education, blood sugar monitoring, and insulin preparation and administration.' },
      { title: 'Respiratory care', description: 'Tracheotomy maintenance and care, and support for ventilator-dependent clients.' },
      { title: 'Other specialty services', description: 'Blood draws and Foley catheter maintenance and care.' },
    ],
  },
  {
    id: 'daily-support', title: 'Daily Support', label: 'Help beyond clinical care',
    description: 'Personal care, nutrition support, and practical resources for patients and their families.',
    details: [
      { title: 'Home health aides', description: 'Personal care and help with housekeeping, shopping, and limited meal preparation.' },
      { title: 'Medical social services', description: 'Practical support and connections to community resources such as delivered meals and transportation.' },
      { title: 'Dietitian consultation', description: 'Nurses provide diet instructions, with a dietitian available for complex nutritional needs.' },
    ],
  },
]

export default function Services() {
  return (
    <div className="public-page">
      <PageHero eyebrow="Our Services" title="The right support, right at home." description="Explore nursing, therapy, specialty care, and everyday support personalized to patients and families."
        image="https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1000&q=80" imageAlt="A healthcare professional providing clinical care">
        <Link className="btn btn-primary" to="/contact">Ask About Care</Link>
        <a className="page-text-link" href="#care-options">Explore Care Options <span aria-hidden="true">↓</span></a>
      </PageHero>
      <section className="page-section" id="care-options" aria-labelledby="care-options-title">
        <div className="section-heading"><p className="page-eyebrow">Find your care options</p><h2 id="care-options-title">Four ways we support you.</h2><p>Choose a category to see the services it includes. Our team can help you understand which options fit your needs.</p></div>
        <div className="service-category-grid">{serviceGroups.map((group, index) => <article className="service-category-card" key={group.id}>
          <span className="number-mark" aria-hidden="true">0{index + 1}</span><p className="page-eyebrow">{group.label}</p><h3>{group.title}</h3><p>{group.description}</p>
          <details className="service-details"><summary>View {group.title} Services</summary><div className="service-details__content"><dl>{group.details.map((detail) => <div key={detail.title}><dt>{detail.title}</dt><dd>{detail.description}</dd></div>)}</dl></div></details>
        </article>)}</div>
      </section>
      <section className="page-section arranged-services">
        <div className="section-heading"><p className="page-eyebrow">Additional support</p><h2>Services by arrangement.</h2><p>Ask our team about coordinating these services as part of your care.</p></div>
        <ul className="coverage-chips"><li>Laboratory services</li><li>Pharmaceutical services</li><li>Respiratory treatment</li><li>Medical equipment and supplies</li></ul>
      </section>
      <section className="page-section coverage-section">
        <div className="section-heading"><p className="page-eyebrow">Planning for care</p><h2>Insurance and payment options.</h2><p>Contact us to discuss your plan and service needs.</p></div>
        <ul className="coverage-chips" aria-label="Accepted coverage and payment options">{acceptedCoverage.map((coverage) => <li key={coverage}>{coverage}</li>)}</ul>
      </section>
      <CareCTA title="Not sure where to start?" description="Tell us what kind of support you are looking for. Our team can explain the next steps." />
    </div>
  )
}
