import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const careServices = [
  {
    icon: '✚',
    title: 'Skilled nursing',
    description: 'Registered nurses and licensed vocational nurses provide services as directed by the physician.',
  },
  {
    icon: '⌂',
    title: 'I.V. and line care',
    description: 'I.V. therapy and injections, plus central line maintenance and care.',
  },
  {
    icon: '✿',
    title: 'Wound and ostomy care',
    description: 'Wound care, wound vac support, and ostomy care at home.',
  },
  {
    icon: '◉',
    title: 'Feeding support',
    description: 'TPN and enteral feeding support planned around each patient.',
  },
  {
    icon: '♡',
    title: 'Respiratory support',
    description: 'Care for ventilator-dependent clients and tracheotomy maintenance.',
  },
  {
    icon: '↗',
    title: 'Therapy and daily support',
    description: 'Physical, occupational, and speech therapy, medical social services, and home health aides.',
  },
]

const serviceAreas = ['Los Angeles', 'Orange', 'Riverside', 'San Bernardino', 'Ventura', 'San Diego']
const acceptedCoverage = ['Medicare', 'Medi-Cal', 'Workers Compensation', 'Private Insurance', 'Private Payment', 'CCS', 'Regional Center']

const faqs = [
  {
    question: 'What areas do you serve?',
    answer: 'We serve Los Angeles, Orange, Riverside, San Bernardino, Ventura, and San Diego Counties.',
  },
  {
    question: 'What kinds of care do you provide?',
    answer: 'Services include skilled nursing, specialty treatments, therapy, medical social services, and home health aide support. Visit our Services page for details.',
  },
  {
    question: 'Who can receive care?',
    answer: 'Our home health services support children, adults, and seniors. Care is planned around each patient’s needs.',
  },
  {
    question: 'What insurance or payment options do you accept?',
    answer: 'Options include Medicare, Medi-Cal, Workers Compensation, private insurance, private payment, CCS, and Regional Center. Contact our team to discuss your specific situation.',
  },
  {
    question: 'How do I get started?',
    answer: 'Call our office or send us a message. Our team can answer questions about services, service areas, and coverage options.',
  },
]

export default function Home() {
  const { user, isGuest, isStaff } = useAuth()
  const isOwner = user?.role === 'OWNER'
  const isPatient = user?.role === 'PATIENT'
  const heroCareBanner = 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1600&q=80'

  return (
    <div className="home-landing-page">
      <section className="home-announcement" aria-label="Contact and service area">
        <div className="home-container home-announcement__inner">
          <span>Serving Ventura, Los Angeles, Orange, San Bernardino, Riverside, and San Diego Counties</span>
          <a href="tel:9516213600">Call (951) 621-3600</a>
        </div>
      </section>

      <section className="home-hero">
        <div className="home-container home-hero__layout">
          <div className="home-hero__copy">
            <p className="home-eyebrow">Home health, centered around you</p>
            <h1>Compassionate care, in the comfort of home.</h1>
            <p className="home-hero__intro">
              Skilled nursing, specialty services, and therapy support for children, adults, and seniors—planned with patients and families.
            </p>
            <div className="home-hero__actions">
              <a className="btn btn-primary home-button" href="tel:9516213600">Call (951) 621-3600</a>
              <Link className="btn btn-outline-primary home-button home-button--outline" to="/contact">Talk with our team</Link>
            </div>
            <p className="home-hero__note">Serving Los Angeles, Orange, Riverside, San Bernardino, Ventura, and San Diego Counties.</p>
          </div>

          <figure className="home-hero__photo-wrap">
            <img
              src={heroCareBanner}
              alt="A healthcare worker supporting a patient at home"
              className="home-hero__photo"
              fetchPriority="high"
              decoding="async"
            />
            <figcaption className="home-hero__photo-caption">
              <span className="home-gold-mark" aria-hidden="true">✦</span>
              <span><strong>Care for every age</strong><small>Children · Adults · Seniors</small></span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="home-trust" aria-label="Care highlights">
        <div className="home-container home-trust__grid">
          <div><span className="home-trust__accent" aria-hidden="true">✦</span><span>24/7 Availability</span></div>
          <div><span className="home-trust__accent" aria-hidden="true">✦</span><span>Personalized In-Home Care</span></div>
          <div><span className="home-trust__accent" aria-hidden="true">✦</span><span>Insurance Options</span></div>
        </div>
      </section>

      <section className="home-section home-services" aria-labelledby="home-services-title">
        <div className="home-container">
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">Our services</p>
              <h2 id="home-services-title">Support for life at home.</h2>
            </div>
            <p>Explore skilled care and support services tailored to each patient’s needs.</p>
          </div>

          <div className="home-service-grid">
            {careServices.map((service) => (
              <article className="home-service-card" key={service.title}>
                <span className="home-service-card__icon" aria-hidden="true">{service.icon}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
          <div className="home-section-link-wrap">
            <Link className="home-text-link" to="/services">Explore all services <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="home-approach" aria-labelledby="home-approach-title">
        <div className="home-container">
          <div className="home-approach__heading">
            <p className="home-eyebrow home-eyebrow--light">What matters in care</p>
            <h2 id="home-approach-title">A plan shaped around each person.</h2>
            <p>Patients and families are part of the plan, with care coordinated around individual needs and goals.</p>
          </div>
          <div className="home-approach__grid">
            <article>
              <span className="home-approach__number">01</span>
              <h3>Personalized care planning</h3>
              <p>Care plans are shaped around each patient’s needs.</p>
            </article>
            <article>
              <span className="home-approach__number">02</span>
              <h3>Family involvement</h3>
              <p>Patients and families are included in the plan of care.</p>
            </article>
            <article>
              <span className="home-approach__number">03</span>
              <h3>Care for all ages</h3>
              <p>Support for children, adults, and seniors at home.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-section home-coverage" aria-labelledby="home-coverage-title">
        <div className="home-container home-coverage__layout">
          <div>
            <p className="home-eyebrow">Communities we serve</p>
            <h2 id="home-coverage-title">Local care across Southern California.</h2>
            <p className="home-coverage__intro">Our team serves families throughout these counties.</p>
            <div className="home-area-list">
              {serviceAreas.map((area) => <span key={area}>{area}</span>)}
            </div>
          </div>

          <article className="home-coverage-card">
            <span className="home-service-card__icon" aria-hidden="true">♡</span>
            <h3>Insurance and payment options</h3>
            <p>Accepted options include:</p>
            <ul className="home-coverage-card__list">
              {acceptedCoverage.map((option) => <li key={option}>{option}</li>)}
            </ul>
            <p className="home-coverage-card__note">Contact our team to discuss your specific coverage questions.</p>
          </article>
        </div>
      </section>

      <section className="home-section home-faq" aria-labelledby="home-faq-title">
        <div className="home-container home-faq__layout">
          <div>
            <p className="home-eyebrow">Helpful information</p>
            <h2 id="home-faq-title">Questions about care?</h2>
            <p>Here are a few common questions. Our team can help with details about your situation.</p>
            <Link className="home-text-link" to="/contact">Contact our team <span aria-hidden="true">→</span></Link>
          </div>
          <div className="home-faq__list">
            {faqs.map((faq) => (
              <details className="home-faq__item" key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="home-final-cta" aria-labelledby="home-final-cta-title">
        <div className="home-container home-final-cta__inner">
          <div>
            <p className="home-eyebrow home-eyebrow--light">Here when you need us</p>
            <h2 id="home-final-cta-title">Let’s talk about care at home.</h2>
            <p>Call our office or send a message to connect with the team.</p>
          </div>
          <div className="home-final-cta__actions">
            <a className="btn home-button home-button--gold" href="tel:9516213600">Call (951) 621-3600</a>
            <Link className="btn home-button home-button--light" to="/contact">Contact Us</Link>
            {isPatient && <Link className="home-final-cta__portal-link" to="/portal">Open Patient Portal</Link>}
            {isStaff && <Link className="home-final-cta__portal-link" to="/staff">{isOwner ? 'Open Owners portal' : 'Open Staff Portal'}</Link>}
            {isGuest && <Link className="home-final-cta__portal-link" to="/team">Meet our team</Link>}
          </div>
        </div>
      </section>
    </div>
  )
}
