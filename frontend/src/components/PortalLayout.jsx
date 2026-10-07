import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const staffNavigationGroups = [
  { title: 'Care', links: [
    { label: 'Appointments', to: '/staff/dashboard' },
    { label: 'Lab Results', to: '/staff/lab-results' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'Demo EMR', to: '/staff/demo-emr' },
  ] },
  { title: 'Office', links: [
    { label: 'Email', to: '/staff/emails' },
  ] },
  { title: 'Administration', adminOnly: true, links: [
    { label: 'User Management', to: '/admin/users' },
    { label: 'Career Applications', to: '/admin/applications' },
    { label: 'Contact Messages', to: '/admin/contact-messages' },
  ] },
]

const patientNavigationGroups = [
  { title: 'Your care', links: [
    { label: 'Appointments', to: '/portal/appointments' },
    { label: 'Medical Records', to: '/portal/records' },
    { label: 'Prescriptions', to: '/portal/prescriptions' },
    { label: 'Lab Results', to: '/portal/lab-results' },
  ] },
  { title: 'Support', links: [
    { label: 'Family Members', to: '/portal/family' },
  ] },
]

const ownerNavigationGroups = [
  { title: 'Care', links: [
    { label: 'Appointments', to: '/staff/dashboard' },
    { label: 'Lab Results', to: '/staff/lab-results' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'Demo EMR', to: '/staff/demo-emr' },
  ] },
  { title: 'Office', links: [
    { label: 'Email', to: '/staff/emails' },
    { label: 'Career Applications', to: '/admin/applications' },
    { label: 'Contact Messages', to: '/admin/contact-messages' },
  ] },
]

export default function PortalLayout({ enabled, onLogout, children }) {
  const { user, isStaff } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const isOwner = user?.role === 'OWNER'
  const navigationGroups = isOwner ? ownerNavigationGroups : isStaff ? staffNavigationGroups : patientNavigationGroups
  const portalName = isOwner ? 'Owners portal' : isStaff ? 'Staff Portal' : 'Patient Portal'

  if (!enabled) return children

  return (
    <div className="portal-workspace">
      <aside className="workspace-sidebar" aria-label={`${portalName} navigation`}>
        <div className="workspace-sidebar__heading">
          <div>
            <p className="page-eyebrow">{user?.role === 'ADMIN' ? 'Administrator' : isOwner ? 'Owner access' : isStaff ? 'Care team' : 'Your care'}</p>
            <h2>{portalName}</h2>
          </div>
          <button type="button" className="btn btn-outline-primary workspace-menu-toggle" aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? 'Close menu' : 'Open menu'}
          </button>
        </div>
        <nav id="workspace-navigation" className={`workspace-navigation${menuOpen ? ' is-open' : ''}`} aria-label={isOwner ? 'Owners workspace' : isStaff ? 'Staff workspace' : 'Patient workspace'} onClick={(event) => { if (event.target.closest('a')) setMenuOpen(false) }}>
          <NavLink end className="workspace-link workspace-overview-link" to={isStaff ? '/staff' : '/portal'}>Portal Overview</NavLink>
          {navigationGroups.filter((group) => !group.adminOnly || user?.role === 'ADMIN').map((group) => (
            <div className="workspace-nav-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map((link) => <NavLink className="workspace-link" key={link.to} to={link.to}>{link.label}</NavLink>)}
            </div>
          ))}
          <div className="workspace-nav-group workspace-account">
            <h3>Account</h3>
            <NavLink className="workspace-link" to="/portal/profile">My Profile</NavLink>
            <button className="workspace-link workspace-signout" type="button" onClick={() => { setMenuOpen(false); onLogout() }}>Sign Out</button>
          </div>
        </nav>
      </aside>
      <div className="workspace-content">{children}</div>
    </div>
  )
}
