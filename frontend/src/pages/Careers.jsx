import { Link } from 'react-router-dom'
import CareerApplicationForm from '../components/CareerApplicationForm'
import PageHero from '../components/PageHero'
import { teamRoles } from '../data/siteContent'

export default function Careers() {
  return (
    <div className="public-page careers-page">
      <PageHero eyebrow="Careers" title="Bring your skills. Make care personal." description="Explore opportunities to support patients and families through compassionate home health care.">
        <a className="btn btn-primary" href="#career-application">Start an Application</a>
        <Link className="page-text-link" to="/team">Get to Know Our Team <span aria-hidden="true">→</span></Link>
      </PageHero>
      <section className="page-section story-layout">
        <div className="section-heading"><p className="page-eyebrow">Our approach to care</p><h2>Professional care with a human connection.</h2></div>
        <div className="story-copy"><p>Our work centers on dignity, independence, and strong relationships with patients and families. Nurses, therapists, aides, and coordinators each bring practical skills to that shared purpose.</p><p>Tell us about your experience and the role you are interested in. Contact our office to ask about current openings and role requirements.</p></div>
      </section>
      <section className="page-section">
        <div className="section-heading"><p className="page-eyebrow">Where your skills fit</p><h2>Roles on our care team.</h2><p>These are areas of work on our team. Please call to confirm current openings.</p></div>
        <div className="career-role-grid">{teamRoles.map((role) => <article className="career-role-card" key={role.title}><p className="page-eyebrow">{role.label}</p><h3>{role.title}</h3><p>{role.description}</p></article>)}</div>
      </section>
      <section className="application-intro" aria-labelledby="application-intro-title">
        <div><p className="page-eyebrow">Before you begin</p><h2 id="application-intro-title">Have your work history and references ready.</h2><p>The application has five sections. You can also attach a resume before submitting.</p></div>
        <a className="page-text-link" href="tel:9516213600">Questions? Call (951) 621-3600</a>
      </section>
      <section className="page-section" id="career-application" aria-labelledby="career-application-title">
        <div className="section-heading"><p className="page-eyebrow">Take the next step</p><h2 id="career-application-title">Apply to join our team.</h2><p>Complete the application below so our team can review your experience.</p></div>
        <CareerApplicationForm />
      </section>
    </div>
  )
}
