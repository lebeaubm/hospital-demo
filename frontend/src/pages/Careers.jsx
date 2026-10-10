import { Link } from 'react-router-dom'
import CareerApplicationForm from '../components/CareerApplicationForm'
import PageHero from '../components/PageHero'

export default function Careers() {
  return (
    <div className="public-page careers-page">
      <PageHero eyebrow="Careers" title="Build your career in home health" description="Bring your skills and compassion to patients and families in our community.">
        <a className="btn btn-primary" href="#career-application">Start an application</a>
        <Link className="page-text-link" to="/team">Meet our team <span aria-hidden="true">→</span></Link>
      </PageHero>
      <section className="page-section" id="career-application" aria-labelledby="career-application-title">
        <div className="section-heading"><h2 id="career-application-title">Your application</h2><p>Have your work history and references ready. Complete five sections and attach a resume if you wish.</p><p>For current openings and requirements, call <a href="tel:9516213600">(951) 621-3600</a>.</p></div>
        <CareerApplicationForm />
      </section>
    </div>
  )
}
