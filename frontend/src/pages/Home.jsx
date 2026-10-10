import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { acceptedCoverage, serviceAreas } from '../data/siteContent'

const careServices = [
  {
    icon: '✚',
    title: 'Nursing and specialty care',
    description: 'Skilled nursing, wound care, and IV therapy directed by your physician.',
    path: '/services#nursing',
  },
  {
    icon: '↗',
    title: 'Therapy',
    description: 'Physical, occupational, and speech therapy to support everyday activities.',
    path: '/services#therapy',
  },
  {
    icon: '♡',
    title: 'Daily support',
    description: 'Home health aides, nutrition support, and community resources.',
    path: '/services#daily-support',
  },
]

export default function Home() {
  const { user, isGuest, isStaff } = useAuth()
  const isOwner = user?.role === 'OWNER'
  const isPatient = user?.role === 'PATIENT'
  const heroCareBanner = 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1600&q=80'

  return (
    <div className="home-landing-page">
      <section className="home-hero">
        <div className="home-container home-hero__layout">
          <div className="home-hero__copy">
            <p className="home-eyebrow">Peaceloving Home Health</p>
            <h1>Compassionate care at home</h1>
            <p className="home-hero__intro">
              Nursing, therapy, and daily support for all ages, planned with you and your family.
            </p>
            <div className="home-hero__actions">
              <a className="btn btn-primary home-button" href="tel:9516213600">Call (951) 621-3600</a>
              <Link className="btn btn-outline-primary home-button home-button--outline" to="/contact">Contact us</Link>
            </div>
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
          <div><span className="home-trust__accent" aria-hidden="true">✦</span><span>24/7 care availability</span></div>
          <div><span className="home-trust__accent" aria-hidden="true">✦</span><span>Care planned around you</span></div>
          <div><span className="home-trust__accent" aria-hidden="true">✦</span><span>Insurance and payment options</span></div>
        </div>
      </section>

      <section className="home-section home-services" aria-labelledby="home-services-title">
        <div className="home-container">
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">Our services</p>
              <h2 id="home-services-title">Care that fits your needs</h2>
            </div>
          </div>

          <div className="home-service-grid">
            {careServices.map((service) => (
              <article className="home-service-card" key={service.title}>
                <span className="home-service-card__icon" aria-hidden="true">{service.icon}</span>
                <h3><Link to={service.path}>{service.title}</Link></h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
          <div className="home-section-link-wrap">
            <Link className="home-text-link" to="/services">View all services <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="home-section home-coverage" aria-labelledby="home-coverage-title">
        <div className="home-container home-coverage__layout">
          <div>
            <p className="home-eyebrow">Communities we serve</p>
            <h2 id="home-coverage-title">Care across six counties</h2>
            <ul className="home-area-list" aria-label="Counties served">
              {serviceAreas.map((area) => <li key={area}>{area}</li>)}
            </ul>
            <p>Call to confirm care at your address.</p>
          </div>

          <article className="home-coverage-card">
            <span className="home-service-card__icon" aria-hidden="true">♡</span>
            <h3>Insurance and payment options</h3>
            <ul className="home-coverage-card__list">
              {acceptedCoverage.map((option) => <li key={option}>{option}</li>)}
            </ul>
            <p className="home-coverage-card__note">Contact us to discuss your coverage.</p>
          </article>
        </div>
      </section>

      <section className="home-final-cta" aria-labelledby="home-final-cta-title">
        <div className="home-container home-final-cta__inner">
          <div>
            <h2 id="home-final-cta-title">Ready to discuss care?</h2>
            <p>Call us or send a message.</p>
          </div>
          <div className="home-final-cta__actions">
            <a className="btn home-button home-button--gold" href="tel:9516213600">Call (951) 621-3600</a>
            <Link className="btn home-button home-button--light" to="/contact">Contact us</Link>
            {isPatient && <Link className="home-final-cta__portal-link" to="/portal">Patient portal</Link>}
            {isStaff && <Link className="home-final-cta__portal-link" to="/staff">{isOwner ? 'Owner portal' : 'Staff portal'}</Link>}
            {isGuest && <Link className="home-final-cta__portal-link" to="/team">Meet our team</Link>}
          </div>
        </div>
      </section>
    </div>
  )
}
