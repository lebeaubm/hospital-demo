import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import CareCTA from '../components/CareCTA'
import ServiceArea from '../components/ServiceArea'

const values = [
  { title: 'Dignity in every visit', description: 'Respect for each person’s choices, independence, and comfort guides our care.' },
  { title: 'Families belong in the conversation', description: 'We value strong family relationships and help loved ones stay connected to care.' },
  { title: 'Compassion with purpose', description: 'Our Christian foundation guides a commitment to kindness, empathy, and professional care.' },
]

export default function About() {
  return (
    <div className="public-page">
      <PageHero eyebrow="About Peaceloving" title="Care rooted in compassion." description="Professional home health care with a personal purpose: helping people live with comfort, independence, and dignity."
        image="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=80" imageAlt="A family spending time together outdoors">
        <Link className="btn btn-primary" to="/services">Explore Our Services</Link>
        <Link className="page-text-link" to="/team">Meet Our Team <span aria-hidden="true">→</span></Link>
      </PageHero>
      <section className="page-section story-layout">
        <div className="section-heading"><p className="page-eyebrow">Our story</p><h2>Home is where care becomes personal.</h2></div>
        <div className="story-copy">
          <p>Peaceloving Home Health Inc. brings nursing, therapy, and daily support into the place patients know best. We serve children, adults, and seniors across Southern California.</p>
          <p>Our foundation is rooted in Christian principles and a simple promise: treat every patient with dignity, respect, and empathy. We work with patients and families to support care that fits their needs.</p>
        </div>
      </section>
      <section className="purpose-band page-section">
        <div><p className="page-eyebrow">Our mission</p><h2>Support a better quality of life.</h2><p>Deliver compassionate, professional home health care while promoting each patient’s independence and dignity.</p></div>
        <div><p className="page-eyebrow">Our vision</p><h2>Keep moving care forward.</h2><p>Pursue excellence through thoughtful care, professional best practices, and a focus on each patient’s needs.</p></div>
      </section>
      <section className="page-section">
        <div className="section-heading"><p className="page-eyebrow">What guides us</p><h2>Our values, in everyday care.</h2></div>
        <div className="value-grid">{values.map((value, index) => <article className="value-card" key={value.title}>
          <span className="number-mark" aria-hidden="true">0{index + 1}</span><h3>{value.title}</h3><p>{value.description}</p>
        </article>)}</div>
      </section>
      <ServiceArea />
      <CareCTA />
    </div>
  )
}
