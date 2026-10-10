import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const staffNavigationGroups = [
  { title: 'Care', links: [
    { label: 'Appointments', to: '/staff/dashboard' },
    { label: 'Lab results', to: '/staff/lab-results' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'Demo EMR', to: '/staff/demo-emr' },
  ] },
  { title: 'Office', links: [
    { label: 'Email', to: '/staff/emails' },
  ] },
  { title: 'Administration', adminOnly: true, links: [
    { label: 'User management', to: '/admin/users' },
    { label: 'Career applications', to: '/admin/applications' },
    { label: 'Contact messages', to: '/admin/contact-messages' },
  ] },
]

const patientNavigationGroups = [
  { title: 'Your care', links: [
    { label: 'Appointments', to: '/portal/appointments' },
    { label: 'Medical records', to: '/portal/records' },
    { label: 'Prescriptions', to: '/portal/prescriptions' },
    { label: 'Lab results', to: '/portal/lab-results' },
  ] },
  { title: 'Support', links: [
    { label: 'Family members', to: '/portal/family' },
  ] },
]

const ownerNavigationGroups = [
  { title: 'Care', links: [
    { label: 'Appointments', to: '/staff/dashboard' },
    { label: 'Lab results', to: '/staff/lab-results' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'Demo EMR', to: '/staff/demo-emr' },
  ] },
  { title: 'Office', links: [
    { label: 'Email', to: '/staff/emails' },
    { label: 'Career applications', to: '/admin/applications' },
    { label: 'Contact messages', to: '/admin/contact-messages' },
  ] },
]

export default function PortalLayout({ enabled, onLogout, children }) {
  const { user, isStaff } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const isOwner = user?.role === 'OWNER'
  const navigationGroups = isOwner ? ownerNavigationGroups : isStaff ? staffNavigationGroups : patientNavigationGroups
  const portalName = isOwner ? 'Owner portal' : isStaff ? 'Staff portal' : 'Patient portal'

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
        <nav id="workspace-navigation" className={`workspace-navigation${menuOpen ? ' is-open' : ''}`} aria-label={isOwner ? 'Owner workspace' : isStaff ? 'Staff workspace' : 'Patient workspace'} onClick={(event) => { if (event.target.closest('a')) setMenuOpen(false) }}>
          <NavLink end className="workspace-link workspace-overview-link" to={isStaff ? '/staff' : '/portal'}>Overview</NavLink>
          {navigationGroups.filter((group) => !group.adminOnly || user?.role === 'ADMIN').map((group) => (
            <div className="workspace-nav-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map((link) => <NavLink className="workspace-link" key={link.to} to={link.to}>{link.label}</NavLink>)}
            </div>
          ))}
          <div className="workspace-nav-group workspace-account">
            <h3>Account</h3>
            <NavLink className="workspace-link" to="/portal/profile">My profile</NavLink>
            <button className="workspace-link workspace-signout" type="button" onClick={() => { setMenuOpen(false); onLogout() }}>Sign out</button>
          </div>
        </nav>
      </aside>
      <div className="workspace-content">{children}</div>
    </div>
  )
}
