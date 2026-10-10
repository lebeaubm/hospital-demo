import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import CareCTA from '../components/CareCTA'
import ServiceArea from '../components/ServiceArea'

const values = [
  { title: 'Dignity', description: 'Respect for your choices, comfort, and independence.' },
  { title: 'Family', description: 'Care planned with you and your loved ones.' },
  { title: 'Compassion', description: 'Our Christian foundation guides kind, professional care.' },
]

export default function About() {
  return (
    <div className="public-page">
      <PageHero eyebrow="About Peaceloving" title="Care rooted in compassion" description="We bring nursing, therapy, and daily support to children, adults, and seniors across Southern California."
        image="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=80" imageAlt="A family spending time together outdoors">
        <Link className="btn btn-primary" to="/services">View services</Link>
        <Link className="page-text-link" to="/team">Meet our team <span aria-hidden="true">→</span></Link>
      </PageHero>
      <section className="purpose-band page-section" aria-label="Our mission and vision">
        <div><p className="page-eyebrow">Our mission</p><h2>Dignity and independence</h2><p>Compassionate home health care that supports your quality of life.</p></div>
        <div><p className="page-eyebrow">Our vision</p><h2>Continually improving care</h2><p>Professional best practices, guided by each patient’s needs.</p></div>
      </section>
      <section className="page-section" aria-labelledby="about-values-title">
        <div className="section-heading"><h2 id="about-values-title">What guides us</h2></div>
        <div className="value-grid">{values.map((value, index) => <article className="value-card" key={value.title}>
          <span className="number-mark" aria-hidden="true">0{index + 1}</span><h3>{value.title}</h3><p>{value.description}</p>
        </article>)}</div>
      </section>
      <ServiceArea />
      <CareCTA />
    </div>
  )
}
