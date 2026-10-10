import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const careTasks = [
  { title: 'Appointments', description: 'View appointments or request a visit.', to: '/portal/appointments' },
  { title: 'Medical records', description: 'View your shared health information and documents.', to: '/portal/records' },
  { title: 'Prescriptions', description: 'Review medicines and request refills.', to: '/portal/prescriptions' },
  { title: 'Lab results', description: 'View test results and available reports.', to: '/portal/lab-results' },
  { title: 'Family members', description: 'Manage family contacts and relationships.', to: '/portal/family' },
]

export default function PatientPortal() {
  return (
    <div className="portal-overview patient-portal">
      <PageHeader eyebrow="Your care" title="Patient portal" description="View your care information and manage appointments." />
      <div className="portal-task-grid">
        {careTasks.map((task) => <Link className="portal-task-card" key={task.to} to={task.to}>
          <h2>{task.title}</h2><p>{task.description}</p>
          <span className="portal-task-card__action">Open {task.title} <span aria-hidden="true">→</span></span>
        </Link>)}
      </div>
      <section className="portal-help-card">
        <div><h2>Need help?</h2><p>Contact our office for help with services or your account.</p></div>
        <a className="btn btn-primary" href="tel:9516213600">Call (951) 621-3600</a>
      </section>
    </div>
  )
}
