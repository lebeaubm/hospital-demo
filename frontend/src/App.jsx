import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import './styles/site-pages.css'
import './styles/readability.css'
import Contact from './pages/Contact'
import About from './pages/About'
import Team from './pages/Team'
import Careers from './pages/Careers'
import DoctorDetail from './pages/DoctorDetail'
import DoctorsList from './pages/DoctorsList'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Services from './pages/Services'
import ServiceCardiology from './pages/ServiceCardiology'
import ServiceOrthopedics from './pages/ServiceOrthopedics'
import ServicePediatrics from './pages/ServicePediatrics'
import ServicePrimaryCare from './pages/ServicePrimaryCare'
import NotFound from './pages/NotFound'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import ProtectedRoute from './components/ProtectedRoute'
import StaffProtectedRoute from './components/StaffProtectedRoute'
import ReadingTools from './components/ReadingTools'
import PortalLayout from './components/PortalLayout'
import { useAuth } from './context/AuthContext'
import { clearTokens } from './api/client'

const Profile = lazy(() => import('./pages/Profile'))
const PatientPortal = lazy(() => import('./pages/PatientPortal'))
const Appointments = lazy(() => import('./pages/Appointments'))
const RequestAppointment = lazy(() => import('./pages/RequestAppointment'))
const MedicalRecords = lazy(() => import('./pages/MedicalRecords'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'))
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'))
const StaffPortal = lazy(() => import('./pages/StaffPortal'))
const StaffEmails = lazy(() => import('./pages/StaffEmails'))
const StaffLabResults = lazy(() => import('./pages/StaffLabResults'))
const StaffPatientRecord = lazy(() => import('./pages/StaffPatientRecord'))
const DemoEMR = lazy(() => import('./pages/DemoEMR'))
const Prescriptions = lazy(() => import('./pages/Prescriptions'))
const LabResults = lazy(() => import('./pages/LabResults'))
const FamilyMembers = lazy(() => import('./pages/FamilyMembers'))
const AdminApplications = lazy(() => import('./pages/AdminApplications'))
const AdminContactMessages = lazy(() => import('./pages/AdminContactMessages'))
const AdminUserManagement = lazy(() => import('./pages/AdminUserManagement'))

const pageTitles = {
  '/': 'Home', '/about': 'About Us', '/team': 'Our Team', '/services': 'Services',
  '/services/primary-care': 'Primary Care', '/services/cardiology': 'Cardiology',
  '/services/orthopedics': 'Orthopedics', '/services/pediatrics': 'Pediatrics',
  '/careers': 'Careers', '/contact': 'Contact Us', '/doctors': 'Doctors',
  '/login': 'Sign In', '/register': 'Sign Up', '/portal': 'Patient Portal', '/portal/profile': 'My Profile',
  '/portal/appointments': 'My Appointments', '/portal/appointments/request': 'Request Appointment',
  '/portal/records': 'Medical Records', '/portal/prescriptions': 'Prescriptions',
  '/portal/messages': 'My Profile', '/portal/lab-results': 'Lab Results',
  '/portal/family': 'Family Members',
  '/payment/success': 'Payment Confirmation', '/payment/cancel': 'Payment Cancelled',
  '/staff': 'Staff Portal', '/staff/dashboard': 'Appointments',
  '/staff/demo-emr': 'Demo EMR',
  '/staff/lab-results': 'Staff Lab Results', '/staff/messages': 'Staff Dashboard',
  '/staff/emails': 'Email Logs', '/admin/users': 'User Management',
  '/admin/applications': 'Career Applications', '/admin/contact-messages': 'Contact Messages',
}

function pageTitle(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (pageTitles[path]) return pageTitles[path]
  if (/^\/doctors\/[^/]+$/.test(path)) return 'Doctor Details'
  if (/^\/staff\/patients\/[^/]+\/record$/.test(path)) return 'Patient Record'
  if (/^\/portal\/messages\/[^/]+$/.test(path)) return 'My Profile'
  return 'Page Not Found'
}

function App() {
  const { isAuthenticated, isStaff, user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigation = useRef(null)
  const mainContent = useRef(null)
  const menuToggle = useRef(null)
  const previousRoute = useRef(null)
  const isStaffWorkspace = isStaff && (/^\/(staff|admin|doctors)(\/|$)/.test(pathname) || pathname === '/portal/profile')
  const isPatientWorkspace = isAuthenticated && !isStaff && /^\/(portal|payment)(\/|$)/.test(pathname)
  const isWorkspace = isStaffWorkspace || isPatientWorkspace

  const closeNavigation = () => {
    setMenuOpen(false)
  }

  useEffect(() => {
    const route = pathname + hash
    const moved = previousRoute.current !== null && previousRoute.current !== route
    previousRoute.current = route
    const title = pathname === '/staff' && user?.role === 'OWNER' ? 'Owner portal' : pageTitle(pathname)
    document.title = title === 'Home' ? 'Peaceloving Home Health Inc.' : `${title} | Peaceloving Home Health Inc.`
    const main = mainContent.current
    if (!main) return
    let observer
    const focusDestination = () => {
      let destination = null
      if (hash) {
        try { destination = document.getElementById(decodeURIComponent(hash.slice(1))) } catch { /* Ignore malformed anchors. */ }
      }
      if (destination) {
        destination.scrollIntoView({ block: 'start' })
        destination.setAttribute('tabindex', '-1')
        destination.focus({ preventScroll: true })
        return true
      }
      const heading = Array.from(main.querySelectorAll('h1')).find((element) => element.getClientRects().length)
      if (moved && heading) {
        heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
      }
      return Boolean(heading)
    }
    const frame = window.requestAnimationFrame(() => {
      setMenuOpen(false)
      if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      if (!focusDestination() && moved) {
        main.focus({ preventScroll: true })
        observer = new MutationObserver(() => {
          if (document.activeElement !== main && document.activeElement !== document.body) {
            observer.disconnect()
            return
          }
          if (focusDestination()) observer.disconnect()
        })
        observer.observe(main, { childList: true, subtree: true })
      }
    })
    return () => { window.cancelAnimationFrame(frame); observer?.disconnect() }
  }, [pathname, hash, user?.role])

  useEffect(() => {
    if (!menuOpen) return
    const dismissOutside = (event) => {
      if (!navigation.current?.contains(event.target)) closeNavigation()
    }
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuToggle.current?.focus()
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('focusin', dismissOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('focusin', dismissOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  const handleLogout = () => {
    closeNavigation()
    clearTokens()
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); closeNavigation(); mainContent.current?.focus(); mainContent.current?.scrollIntoView({ block: 'start' }) }}>Skip to main content</a>
      <nav ref={navigation} className="navbar navbar-expand-xl navbar-dark bg-primary site-header" aria-label="Main navigation" onClick={(event) => { if (event.target.closest('a')) closeNavigation() }}>
        <div className="container">
          <NavLink className="navbar-brand" to="/" aria-label="Peaceloving Home Health, home">
            <img src="/favicon.svg" className="navbar-brand-icon" width="36" height="36" alt="" />
            <span>Peaceloving{' '}<span className="navbar-brand-subtitle">Home Health Inc.</span></span>
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            ref={menuToggle}
            aria-controls="mainNav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse${menuOpen ? ' show' : ''}`} id="mainNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <NavLink className="nav-link" to="/about">
                  About
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/services">
                  Services
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/team">
                  Team
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/careers">
                  Careers
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link nav-contact-link" to="/contact">
                  Contact
                </NavLink>
              </li>
              {isStaff ? (
                <li className="nav-item">
                  <NavLink className="nav-link nav-portal-link" to="/staff">{user?.role === 'OWNER' ? 'Owner portal' : 'Staff portal'}</NavLink>
                </li>
              ) : isAuthenticated ? (
                <li className="nav-item">
                  <NavLink className="nav-link nav-portal-link" to="/portal">
                    Patient portal
                  </NavLink>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </nav>

      <ReadingTools />
      <main className={`container reader-main${isWorkspace ? ' container-workspace' : ''}`} id="main-content" ref={mainContent} tabIndex="-1">
        <PortalLayout enabled={isWorkspace} onLogout={handleLogout}>
        <Suspense fallback={<div className="py-5 text-center" role="status"><div className="spinner-border text-primary" aria-hidden="true" /><p className="mt-2 mb-0">Loading page…</p></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/primary-care" element={<ServicePrimaryCare />} />
          <Route path="/services/cardiology" element={<ServiceCardiology />} />
          <Route path="/services/orthopedics" element={<ServiceOrthopedics />} />
          <Route path="/services/pediatrics" element={<ServicePediatrics />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/doctors" element={<DoctorsList />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portal" element={<ProtectedRoute>{isStaff ? <Navigate to="/staff" replace /> : <PatientPortal />}</ProtectedRoute>} />
          <Route
            path="/portal/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/appointments/request"
            element={
              <ProtectedRoute>
                <RequestAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/records"
            element={
              <ProtectedRoute>
                <MedicalRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/prescriptions"
            element={
              <ProtectedRoute>
                <Prescriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/messages"
            element={
              <ProtectedRoute>
                <Navigate to="/portal/profile" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/messages/:threadId"
            element={
              <ProtectedRoute>
                <Navigate to="/portal/profile" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/lab-results"
            element={
              <ProtectedRoute>
                <LabResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/billing"
            element={<Navigate to="/portal" replace />}
          />
          <Route
            path="/portal/family"
            element={
              <ProtectedRoute>
                <FamilyMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/payments"
            element={<Navigate to="/portal" replace />}
          />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/staff" element={<StaffProtectedRoute><StaffPortal /></StaffProtectedRoute>} />
          <Route
            path="/staff/demo-emr"
            element={<StaffProtectedRoute><DemoEMR /></StaffProtectedRoute>}
          />
          <Route
            path="/staff/dashboard"
            element={
              <StaffProtectedRoute>
                <StaffDashboard />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/staff/billing"
            element={<Navigate to="/staff" replace />}
          />
          <Route
            path="/staff/lab-results"
            element={
              <StaffProtectedRoute>
                <StaffLabResults />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/staff/messages"
            element={
              <StaffProtectedRoute>
                <Navigate to="/staff/dashboard" replace />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/staff/emails"
            element={
              <StaffProtectedRoute>
                <StaffEmails />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/staff/patients/:patientId/record"
            element={
              <StaffProtectedRoute>
                <StaffPatientRecord />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <AdminUserManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <AdminProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                <AdminApplications />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/contact-messages"
            element={
              <AdminProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
                <AdminContactMessages />
              </AdminProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </PortalLayout>
      </main>

      <footer className="app-footer border-top bg-light mt-auto py-4">
        <div className="container">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <nav className="footer-navigation d-flex flex-wrap gap-3" aria-label="Footer navigation">
                <NavLink to="/">Home</NavLink>
                <NavLink to="/about">About</NavLink>
                <NavLink to="/services">Services</NavLink>
                <NavLink to="/team">Team</NavLink>
                <NavLink to="/careers">Careers</NavLink>
                <NavLink to="/contact">Contact</NavLink>
              </nav>
              <p className="small text-muted mt-3 mb-0">Peaceloving Home Health Inc. · Demo site</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-1"><strong>Call:</strong> <a href="tel:9516213600">(951) 621-3600</a></p>
              {pathname.replace(/\/+$/, '') !== '/contact' && <p className="mb-1"><strong>Fax:</strong> (951) 621-3606</p>}
              <p className="mb-0"><strong>Address:</strong> 1307 W 6th Street, Suite 220C, Corona, CA 92882</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default App
