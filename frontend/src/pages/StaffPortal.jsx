import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const staffTasks = [
  { title: 'Appointments', label: 'Care', description: 'Review requests, schedule visits, and open patient records.', to: '/staff/dashboard' },
  { title: 'Lab results', label: 'Care', description: 'Manage lab orders and review results.', to: '/staff/lab-results' },
  { title: 'Demo EMR', label: 'Care', description: 'View demo charts, visits, and care tasks.', to: '/staff/demo-emr' },
  { title: 'Doctors', label: 'Care', description: 'Browse doctor profiles and specialties.', to: '/doctors' },
  { title: 'Email', label: 'Office', description: 'Send patient emails and review email history.', to: '/staff/emails' },
]
const ownerTasks = [
  { title: 'Appointments', label: 'Care', description: 'Review requests, schedule visits, and open patient records.', to: '/staff/dashboard' },
  { title: 'Lab results', label: 'Care', description: 'Manage lab orders and review results.', to: '/staff/lab-results' },
  { title: 'Doctors', label: 'Care', description: 'Browse doctor profiles and specialties.', to: '/doctors' },
  { title: 'Demo EMR', label: 'Care', description: 'View demo charts, visits, and care tasks.', to: '/staff/demo-emr' },
  { title: 'Email', label: 'Office', description: 'Send patient emails and review email history.', to: '/staff/emails' },
  { title: 'Career applications', label: 'Office', description: 'Review job applications.', to: '/admin/applications' },
  { title: 'Contact messages', label: 'Office', description: 'Review messages from the Contact page.', to: '/admin/contact-messages' },
]
const adminTasks = [
  { title: 'User management', description: 'Manage accounts and user roles.', to: '/admin/users' },
  { title: 'Career applications', description: 'Review job applications.', to: '/admin/applications' },
  { title: 'Contact messages', description: 'Review messages from the Contact page.', to: '/admin/contact-messages' },
]

export default function StaffPortal() {
  const { user } = useAuth()
  const isOwner = user?.role === 'OWNER'
  const tasks = isOwner ? ownerTasks : staffTasks
  return (
    <div className="portal-overview">
      <header className="portal-overview__header">
        <p className="page-eyebrow">Your workspace</p>
        <h1>{isOwner ? 'Owner portal' : 'Staff portal'}</h1>
        <p>Manage appointments, patient care, and office tasks.</p>
      </header>
      <div className="portal-task-grid">
        {tasks.map((task) => (
          <Link className="portal-task-card" key={task.to} to={task.to}>
            <span className="page-eyebrow">{task.label}</span>
            <h2>{task.title}</h2>
            <p>{task.description}</p>
            <span className="portal-task-card__action">Open {task.title} <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </div>
      {user?.role === 'ADMIN' && <section className="portal-admin-section">
        <h2>Administration</h2>
        <p>Manage accounts and follow up on applications and messages.</p>
        <div className="portal-task-grid">
          {adminTasks.map((task) => <Link className="portal-task-card" key={task.to} to={task.to}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <span className="portal-task-card__action">Open <span aria-hidden="true">→</span></span>
          </Link>)}
        </div>
      </section>}
    </div>
  )
}
