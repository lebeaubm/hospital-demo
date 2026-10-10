import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { teamRoles } from '../data/siteContent'

export default function Team() {
  return (
    <div className="public-page">
      <PageHero eyebrow="Our team" title="Your home health team" description="Nurses, therapists, aides, and coordinators work with you, your family, and your physician."
        image="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1000&q=85" imageAlt="Healthcare professionals working together in a clinical setting">
        <Link className="btn btn-primary" to="/contact">Contact us</Link>
      </PageHero>
      <section className="page-section" aria-labelledby="team-roles-title">
        <div className="section-heading"><h2 id="team-roles-title">The people behind your care</h2></div>
        <div className="team-role-grid">{teamRoles.map((role) => <article className="team-role-card" key={role.title}>
          <p className="page-eyebrow">{role.label}</p><h3>{role.title}</h3><p>{role.description}</p>
        </article>)}</div>
        <p className="team-careers-link">Interested in joining us? <Link to="/careers">View careers <span aria-hidden="true">→</span></Link></p>
      </section>
      <section className="team-access" aria-labelledby="team-access-title">
        <div><h2 id="team-access-title">Access your account</h2><p>Patients can sign in or create an account. Contact our office for staff access.</p></div>
        <div className="page-actions"><Link className="btn btn-primary" to="/login">Sign in</Link><Link className="btn btn-outline-primary" to="/register">Create patient account</Link></div>
      </section>
    </div>
  )
}
