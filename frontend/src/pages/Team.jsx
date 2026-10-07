import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { teamRoles } from '../data/siteContent'

const careConnections = [
  { title: 'Listen to your needs', description: 'Your goals, routines, and family’s questions help shape the conversation about care.' },
  { title: 'Bring the right skills', description: 'Nursing, therapy, and daily support work together around the care plan directed by your physician.' },
  { title: 'Keep people connected', description: 'Care coordination helps patients, families, and professionals stay informed throughout care.' },
]

export default function Team() {
  return (
    <div className="public-page">
      <PageHero eyebrow="Our Team" title="People who care. Skills you can count on." description="Home health is personal. Our team brings professional care, patience, and kindness to support patients and families."
        image="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1000&q=85" imageAlt="Healthcare professionals working together in a clinical setting">
        <Link className="btn btn-primary" to="/contact">Talk with Our Team</Link>
      </PageHero>
      <section className="page-section">
        <div className="section-heading"><p className="page-eyebrow">Different skills. Shared purpose.</p><h2>The people behind your care.</h2><p>Each role brings a different kind of support, with your needs at the center.</p></div>
        <div className="team-role-grid">{teamRoles.map((role) => <article className="team-role-card" key={role.title}>
          <p className="page-eyebrow">{role.label}</p><h3>{role.title}</h3><p>{role.description}</p>
        </article>)}</div>
      </section>
      <section className="page-section team-approach">
        <div className="section-heading"><p className="page-eyebrow">Working together</p><h2>One care plan. A connected team.</h2></div>
        <ol className="care-steps">{careConnections.map((step, index) => <li key={step.title}>
          <span className="number-mark" aria-hidden="true">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div>
        </li>)}</ol>
        <p className="team-careers-link">Interested in joining us? <Link to="/careers">Explore Careers <span aria-hidden="true">→</span></Link></p>
      </section>
      <section className="team-access" aria-labelledby="team-access-title">
        <div><p className="page-eyebrow">Account access</p><h2 id="team-access-title">Already part of our care community?</h2><p>Patients, staff, and administrators can sign in to their workspace. Sign up creates a patient account; contact our office about staff access.</p></div>
        <div className="page-actions"><Link className="btn btn-primary" to="/login">Sign In</Link><Link className="btn btn-outline-primary" to="/register">Sign Up</Link></div>
      </section>
    </div>
  )
}
