import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import ThemeToggle from './components/ThemeToggle'
import { PORTAL_SITE_URL } from './config/site'

const About = lazy(() => import('./pages/About'))
const Team = lazy(() => import('./pages/Team'))
const Careers = lazy(() => import('./pages/Careers'))
const Contact = lazy(() => import('./pages/Contact'))
const Services = lazy(() => import('./pages/Services'))
const ServiceCardiology = lazy(() => import('./pages/ServiceCardiology'))
const ServiceOrthopedics = lazy(() => import('./pages/ServiceOrthopedics'))
const ServicePediatrics = lazy(() => import('./pages/ServicePediatrics'))
const ServicePrimaryCare = lazy(() => import('./pages/ServicePrimaryCare'))
const DoctorsList = lazy(() => import('./pages/DoctorsList'))
const DoctorDetail = lazy(() => import('./pages/DoctorDetail'))

const pageTitles = {
  '/': 'Home',
  '/about': 'About Us',
  '/team': 'Our Team',
  '/services': 'Services',
  '/services/primary-care': 'Primary Care',
  '/services/cardiology': 'Cardiology',
  '/services/orthopedics': 'Orthopedics',
  '/services/pediatrics': 'Pediatrics',
  '/careers': 'Careers',
  '/contact': 'Contact Us',
  '/doctors': 'Doctors',
}

function pageTitle(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (pageTitles[path]) return pageTitles[path]
  if (/^\/doctors\/[^/]+$/.test(path)) return 'Doctor Details'
  return 'Page Not Found'
}

function MarketingApp() {
  const { pathname, hash } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigation = useRef(null)
  const mainContent = useRef(null)
  const menuToggle = useRef(null)
  const previousRoute = useRef(null)

  const closeNavigation = () => setMenuOpen(false)

  useEffect(() => {
    const route = pathname + hash
    const moved = previousRoute.current !== null && previousRoute.current !== route
    previousRoute.current = route
    const title = pageTitle(pathname)
    document.title = title === 'Home'
      ? 'Peaceloving Home Health Inc. | In-Home Care'
      : `${title} | Peaceloving Home Health Inc.`

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

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); closeNavigation(); mainContent.current?.focus(); mainContent.current?.scrollIntoView({ block: 'start' }) }}>Skip to main content</a>
      <nav ref={navigation} className="navbar navbar-expand-lg navbar-dark bg-primary" aria-label="Main navigation" onClick={(event) => { if (event.target.closest('a')) closeNavigation() }}>
        <div className="container">
          <NavLink className="navbar-brand" to="/">
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
            <ul className="navbar-nav ms-auto align-items-lg-center">
              <li className="nav-item"><NavLink className="nav-link" to="/about">About Us</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/services">Services</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/team">Our Team</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/careers">Careers</NavLink></li>
              <li className="nav-item"><NavLink className="nav-link" to="/contact">Contact</NavLink></li>
              <li className="nav-item"><a className="nav-link nav-login-link" href={PORTAL_SITE_URL}>Patient &amp; Staff Portal</a></li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container" id="main-content" ref={mainContent} tabIndex="-1">
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="app-footer border-top bg-light mt-auto py-4">
        <div className="container">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <h2 className="h6 mb-2">Explore</h2>
              <nav className="footer-navigation d-flex flex-wrap gap-3" aria-label="Footer navigation">
                <NavLink to="/about">About Us</NavLink>
                <NavLink to="/services">Services</NavLink>
                <NavLink to="/team">Our Team</NavLink>
                <NavLink to="/careers">Careers</NavLink>
                <NavLink to="/contact">Contact</NavLink>
                <a href={PORTAL_SITE_URL}>Patient &amp; Staff Portal</a>
              </nav>
              <p className="small text-muted mt-3 mb-0">Peaceloving Home Health Inc.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-1"><strong>Call:</strong> <a href="tel:9516213600">(951) 621-3600</a></p>
              <p className="mb-1"><strong>Fax:</strong> (951) 621-3606</p>
              <p className="mb-0"><strong>Address:</strong> 1307 W 6th Street, Suite 220C, Corona, CA 92882</p>
            </div>
          </div>
        </div>
      </footer>

      <ThemeToggle />
    </div>
  )
}

export default MarketingApp
