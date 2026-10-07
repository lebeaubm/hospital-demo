import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const careTasks = [
  { title: 'Appointments', description: 'See your appointments or request a new visit.', to: '/portal/appointments' },
  { title: 'Medical Records', description: 'View the health information and documents shared with you.', to: '/portal/records' },
  { title: 'Prescriptions', description: 'Review your medicines and request prescription refills.', to: '/portal/prescriptions' },
  { title: 'Lab Results', description: 'See your test results and available reports.', to: '/portal/lab-results' },
  { title: 'Billing & Payments', description: 'Review your bills, balances, and payment options.', to: '/portal/billing' },
  { title: 'Family Members', description: 'Manage your family contacts and relationships.', to: '/portal/family' },
]

export default function PatientPortal() {
  return (
    <div className="portal-overview patient-portal">
      <PageHeader eyebrow="Your care, in one place" title="Welcome to your Patient Portal." description="Choose what you would like to do. You can return to this overview at any time." />
      <div className="portal-task-grid">
        {careTasks.map((task) => <Link className="portal-task-card" key={task.to} to={task.to}>
          <h2>{task.title}</h2><p>{task.description}</p>
          <span className="portal-task-card__action">Open {task.title} <span aria-hidden="true">→</span></span>
        </Link>)}
      </div>
      <section className="portal-help-card">
        <div><h2>Need a hand?</h2><p>Our office can help you find the right service or answer questions about your account.</p></div>
        <a className="btn btn-primary" href="tel:9516213600">Call (951) 621-3600</a>
      </section>
    </div>
  )
}
