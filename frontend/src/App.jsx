import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import ProtectedRoute from './components/ProtectedRoute'
import StaffProtectedRoute from './components/StaffProtectedRoute'
import Loading from './components/Loading'
import ThemeToggle from './components/ThemeToggle'
import { useAuth } from './context/AuthContext'
import { clearTokens } from './api/client'
import { PUBLIC_SITE_URL } from './config/site'

const Profile = lazy(() => import('./pages/Profile'))
const Appointments = lazy(() => import('./pages/Appointments'))
const RequestAppointment = lazy(() => import('./pages/RequestAppointment'))
const MedicalRecords = lazy(() => import('./pages/MedicalRecords'))
const Payments = lazy(() => import('./pages/Payments'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'))
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'))
const StaffBilling = lazy(() => import('./pages/StaffBilling'))
const StaffEmails = lazy(() => import('./pages/StaffEmails'))
const StaffLabResults = lazy(() => import('./pages/StaffLabResults'))
const StaffPatientRecord = lazy(() => import('./pages/StaffPatientRecord'))
const DemoEMR = lazy(() => import('./pages/DemoEMR'))
const Prescriptions = lazy(() => import('./pages/Prescriptions'))
const LabResults = lazy(() => import('./pages/LabResults'))
const Billing = lazy(() => import('./pages/Billing'))
const FamilyMembers = lazy(() => import('./pages/FamilyMembers'))
const AdminApplications = lazy(() => import('./pages/AdminApplications'))
const AdminContactMessages = lazy(() => import('./pages/AdminContactMessages'))
const AdminUserManagement = lazy(() => import('./pages/AdminUserManagement'))

const pageTitles = {
  '/login': 'Sign In',
  '/register': 'Create an Account',
  '/portal/profile': 'My Profile',
  '/portal/appointments': 'My Appointments',
  '/portal/appointments/request': 'Request Appointment',
  '/portal/records': 'Medical Records',
  '/portal/prescriptions': 'Prescriptions',
  '/portal/messages': 'My Profile',
  '/portal/lab-results': 'Lab Results',
  '/portal/billing': 'Billing',
  '/portal/family': 'Family Members',
  '/portal/payments': 'Payments',
  '/payment/success': 'Payment Confirmation',
  '/payment/cancel': 'Payment Cancelled',
  '/staff/dashboard': 'Staff Dashboard',
  '/staff/billing': 'Staff Billing',
  '/staff/demo-emr': 'Demo EMR',
  '/staff/lab-results': 'Staff Lab Results',
  '/staff/messages': 'Staff Dashboard',
  '/staff/emails': 'Email Logs',
  '/admin/users': 'User Management',
  '/admin/applications': 'Career Applications',
  '/admin/contact-messages': 'Contact Messages',
}

function pageTitle(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (pageTitles[path]) return pageTitles[path]
  if (/^\/staff\/patients\/[^/]+\/record$/.test(path)) return 'Patient Record'
  if (/^\/portal\/messages\/[^/]+$/.test(path)) return 'My Profile'
  return 'Page Not Found'
}

function PortalNotFound() {
  return (
    <section className="card marketing-card my-4">
      <div className="card-body p-4">
        <p className="section-kicker">404</p>
        <h1 className="mb-3">Portal page not found</h1>
        <p className="lead mb-4">That portal link may have changed, or the address may be incomplete.</p>
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-primary" to="/">Portal Home</Link>
          <a className="btn btn-outline-primary" href={PUBLIC_SITE_URL}>Public Website</a>
        </div>
      </div>
    </section>
  )
}

function App() {
  const { isAuthenticated, isStaff, user, authLoading, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const navigation = useRef(null)
  const mainContent = useRef(null)
  const menuToggle = useRef(null)
  const moreToggle = useRef(null)
  const previousRoute = useRef(null)
  const homePath = isAuthenticated ? (isStaff ? '/staff/dashboard' : '/portal/profile') : '/login'

  const closeNavigation = () => {
    setMenuOpen(false)
    setMoreOpen(false)
  }

  const handleMoreKeys = (event) => {
    if (event.key === 'Escape' && moreOpen) {
      event.preventDefault()
      event.stopPropagation()
      setMoreOpen(false)
      moreToggle.current?.focus()
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    if (!moreOpen && (event.key === 'Home' || event.key === 'End')) return
    event.preventDefault()
    event.stopPropagation()
    const focusLink = () => {
      const links = Array.from(navigation.current?.querySelectorAll('#moreNav a') || [])
      if (!links.length) return
      const index = links.indexOf(document.activeElement)
      let nextIndex = event.key === 'ArrowUp' ? links.length - 1 : 0
      if (event.key === 'End') nextIndex = links.length - 1
      if (index >= 0 && event.key === 'ArrowDown') nextIndex = (index + 1) % links.length
      if (index >= 0 && event.key === 'ArrowUp') nextIndex = (index - 1 + links.length) % links.length
      links[nextIndex].focus()
    }
    if (moreOpen) focusLink()
    else {
      setMoreOpen(true)
      window.requestAnimationFrame(focusLink)
    }
  }

  useEffect(() => {
    const route = pathname + hash
    const moved = previousRoute.current !== null && previousRoute.current !== route
    previousRoute.current = route
    const title = pageTitle(pathname)
    document.title = title === 'Sign In'
      ? 'Patient & Staff Portal | Peaceloving Home Health Inc.'
      : `${title} | Patient & Staff Portal`

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
      closeNavigation()
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
  }, [pathname, hash])

  useEffect(() => {
    if (!menuOpen && !moreOpen) return
    const dismissOutside = (event) => {
      if (!navigation.current?.contains(event.target)) closeNavigation()
    }
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      if (moreOpen) {
        setMoreOpen(false)
        moreToggle.current?.focus()
      } else {
        setMenuOpen(false)
        menuToggle.current?.focus()
      }
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('focusin', dismissOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('focusin', dismissOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen, moreOpen])

  const handleLogout = () => {
    closeNavigation()
    clearTokens()
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); closeNavigation(); mainContent.current?.focus(); mainContent.current?.scrollIntoView({ block: 'start' }) }}>Skip to main content</a>
      <nav ref={navigation} className="navbar navbar-expand-lg navbar-dark bg-primary" aria-label="Portal navigation" onClick={(event) => { if (event.target.closest('a')) closeNavigation() }}>
        <div className="container">
          <NavLink className="navbar-brand" to={homePath}>
            <img src="/favicon.svg" className="navbar-brand-icon" width="36" height="36" alt="" />
            <span>Patient &amp; Staff <span className="navbar-brand-subtitle">Portal</span></span>
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            ref={menuToggle}
            aria-controls="mainNav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => { setMenuOpen((current) => !current); setMoreOpen(false) }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse${menuOpen ? ' show' : ''}`} id="mainNav">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              {isAuthenticated ? (
                isStaff ? (
                  <>
                    <li className="nav-item"><NavLink className="nav-link" to="/staff/dashboard">Staff Dashboard</NavLink></li>
                    <li className="nav-item"><NavLink className="nav-link" to="/staff/demo-emr">Demo EMR</NavLink></li>
                    <li className="nav-item dropdown" onKeyDown={handleMoreKeys}>
                      <button
                        type="button"
                        ref={moreToggle}
                        className="nav-link dropdown-toggle"
                        id="moreDropdown"
                        aria-controls="moreNav"
                        aria-expanded={moreOpen}
                        onClick={() => setMoreOpen((current) => !current)}
                      >More</button>
                      <ul id="moreNav" className={`site-more-menu${moreOpen ? ' show' : ''}`} aria-labelledby="moreDropdown">
                        <li><NavLink className="dropdown-item" to="/staff/lab-results">Lab Results</NavLink></li>
                        <li><NavLink className="dropdown-item" to="/staff/billing">Billing</NavLink></li>
                        <li><NavLink className="dropdown-item" to="/staff/emails">Email Logs</NavLink></li>
                        {user?.role === 'ADMIN' && (
                          <>
                            <li><NavLink className="dropdown-item" to="/admin/users">User Management</NavLink></li>
                            <li><NavLink className="dropdown-item" to="/admin/applications">Career Applications</NavLink></li>
                            <li><NavLink className="dropdown-item" to="/admin/contact-messages">Contact Messages</NavLink></li>
                          </>
                        )}
                        <li><NavLink className="dropdown-item" to="/portal/profile">My Profile</NavLink></li>
                      </ul>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item"><NavLink className="nav-link" to="/portal/profile">My Profile</NavLink></li>
                    <li className="nav-item"><NavLink className="nav-link" to="/portal/appointments">Appointments</NavLink></li>
                    <li className="nav-item"><NavLink className="nav-link" to="/portal/records">Medical Records</NavLink></li>
                  </>
                )
              ) : (
                <>
                  <li className="nav-item"><NavLink className="nav-link" to="/login">Sign In</NavLink></li>
                  <li className="nav-item"><NavLink className="nav-link" to="/register">Create Account</NavLink></li>
                </>
              )}
              {isAuthenticated && <li className="nav-item"><button className="nav-link btn btn-link" onClick={handleLogout} style={{ cursor: 'pointer' }}>Log Out</button></li>}
              <li className="nav-item"><a className="nav-link" href={PUBLIC_SITE_URL}>Public Website</a></li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container" id="main-content" ref={mainContent} tabIndex="-1">
        <Suspense fallback={<div className="py-5 text-center" role="status"><div className="spinner-border text-primary" aria-hidden="true" /><p className="mt-2 mb-0">Loading page…</p></div>}>
          <Routes>
            <Route path="/" element={authLoading ? <Loading message="Checking your sign-in session…" /> : <Navigate to={homePath} replace />} />
            <Route path="/login" element={authLoading ? <Loading message="Checking your sign-in session…" /> : isAuthenticated ? <Navigate to={homePath} replace /> : <Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/portal/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/portal/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
            <Route path="/portal/appointments/request" element={<ProtectedRoute><RequestAppointment /></ProtectedRoute>} />
            <Route path="/portal/records" element={<ProtectedRoute><MedicalRecords /></ProtectedRoute>} />
            <Route path="/portal/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
            <Route path="/portal/messages" element={<ProtectedRoute><Navigate to="/portal/profile" replace /></ProtectedRoute>} />
            <Route path="/portal/messages/:threadId" element={<ProtectedRoute><Navigate to="/portal/profile" replace /></ProtectedRoute>} />
            <Route path="/portal/lab-results" element={<ProtectedRoute><LabResults /></ProtectedRoute>} />
            <Route path="/portal/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/portal/family" element={<ProtectedRoute><FamilyMembers /></ProtectedRoute>} />
            <Route path="/portal/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/staff/demo-emr" element={<StaffProtectedRoute><DemoEMR /></StaffProtectedRoute>} />
            <Route path="/staff/dashboard" element={<StaffProtectedRoute><StaffDashboard /></StaffProtectedRoute>} />
            <Route path="/staff/billing" element={<StaffProtectedRoute><StaffBilling /></StaffProtectedRoute>} />
            <Route path="/staff/lab-results" element={<StaffProtectedRoute><StaffLabResults /></StaffProtectedRoute>} />
            <Route path="/staff/messages" element={<StaffProtectedRoute><Navigate to="/staff/dashboard" replace /></StaffProtectedRoute>} />
            <Route path="/staff/emails" element={<StaffProtectedRoute><StaffEmails /></StaffProtectedRoute>} />
            <Route path="/staff/patients/:patientId/record" element={<StaffProtectedRoute><StaffPatientRecord /></StaffProtectedRoute>} />
            <Route path="/admin/users" element={<AdminProtectedRoute><AdminUserManagement /></AdminProtectedRoute>} />
            <Route path="/admin/applications" element={<AdminProtectedRoute><AdminApplications /></AdminProtectedRoute>} />
            <Route path="/admin/contact-messages" element={<AdminProtectedRoute><AdminContactMessages /></AdminProtectedRoute>} />
            <Route path="*" element={<PortalNotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="app-footer border-top bg-light mt-auto py-4">
        <div className="container d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
          <div>
            <p className="mb-1 fw-semibold">Peaceloving Home Health Inc. Portal</p>
            <p className="small text-muted mb-0">For questions, contact the office at <a href="tel:9516213600">(951) 621-3600</a>.</p>
          </div>
          <a href={PUBLIC_SITE_URL}>Visit the public website</a>
        </div>
      </footer>

      <ThemeToggle />
    </div>
  )
}

export default App
