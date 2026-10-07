import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const staffTasks = [
  { title: 'Appointments', label: 'Care', description: 'Review requests, schedule visits, and open patient records.', to: '/staff/dashboard' },
  { title: 'Lab Results', label: 'Care', description: 'Manage lab orders and review patient results.', to: '/staff/lab-results' },
  { title: 'Demo EMR', label: 'Care', description: 'Open the demonstration workspace for charts and care workflows.', to: '/staff/demo-emr' },
  { title: 'Doctors', label: 'Care', description: 'Browse the doctor directory and view provider details.', to: '/doctors' },
  { title: 'Email', label: 'Office', description: 'Send patient emails and review email logs.', to: '/staff/emails' },
]
const ownerTasks = [
  { title: 'Appointments', label: 'Care', description: 'Review requests, schedule visits, and open patient records.', to: '/staff/dashboard' },
  { title: 'Lab Results', label: 'Care', description: 'Manage lab orders and review patient results.', to: '/staff/lab-results' },
  { title: 'Doctors', label: 'Care', description: 'Browse the doctor directory and view provider details.', to: '/doctors' },
  { title: 'Demo EMR', label: 'Care', description: 'Open the demonstration workspace for charts and care workflows.', to: '/staff/demo-emr' },
  { title: 'Email', label: 'Office', description: 'Send patient emails and review email logs.', to: '/staff/emails' },
  { title: 'Career Applications', label: 'Office', description: 'Review applications submitted through the Careers page.', to: '/admin/applications' },
  { title: 'Contact Messages', label: 'Office', description: 'Review questions submitted through the Contact page.', to: '/admin/contact-messages' },
]
const adminTasks = [
  { title: 'User Management', description: 'Review accounts and manage patient and staff roles.', to: '/admin/users' },
  { title: 'Career Applications', description: 'Review applications submitted through the Careers page.', to: '/admin/applications' },
  { title: 'Contact Messages', description: 'Review questions submitted through the Contact page.', to: '/admin/contact-messages' },
]

export default function StaffPortal() {
  const { user } = useAuth()
  const isOwner = user?.role === 'OWNER'
  const tasks = isOwner ? ownerTasks : staffTasks
  return (
    <div className="portal-overview">
      <header className="portal-overview__header">
        <p className="page-eyebrow">Your workspace</p>
        <h1>{isOwner ? 'Welcome to your Owners portal' : 'Welcome to your Staff Portal'}</h1>
        <p>{isOwner ? 'Open appointments, care tools, and office messages from your owner workspace.' : 'Choose a task to get started. Your care and office tools are always in the workspace menu.'}</p>
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
