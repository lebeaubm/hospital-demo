import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import './theme.css'
import { ThemeProvider } from './context/ThemeContext.jsx'

const isPortalSite = import.meta.env.VITE_SITE_ROLE === 'portal'
const Site = lazy(() => (isPortalSite ? import('./PortalSite.jsx') : import('./MarketingApp.jsx')))
const loadingPage = <div className="py-5 text-center" role="status"><div className="spinner-border text-primary" aria-hidden="true" /><p className="mt-2 mb-0">Loading site…</p></div>

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Suspense fallback={loadingPage}><Site /></Suspense>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
