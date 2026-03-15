import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import Contact from './pages/Contact'
import About from './pages/About'
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
import Profile from './pages/Profile'
import Appointments from './pages/Appointments'
import RequestAppointment from './pages/RequestAppointment'
import MedicalRecords from './pages/MedicalRecords'
import Payments from './pages/Payments'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import StaffDashboard from './pages/StaffDashboard'
import StaffBilling from './pages/StaffBilling'
import StaffEmails from './pages/StaffEmails'
import StaffLabResults from './pages/StaffLabResults'
import StaffPatientRecord from './pages/StaffPatientRecord'
import Prescriptions from './pages/Prescriptions'
import LabResults from './pages/LabResults'
import Billing from './pages/Billing'
import FamilyMembers from './pages/FamilyMembers'
import AdminApplications from './pages/AdminApplications'
import AdminUserManagement from './pages/AdminUserManagement'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import ProtectedRoute from './components/ProtectedRoute'
import StaffProtectedRoute from './components/StaffProtectedRoute'
import ThemeToggle from './components/ThemeToggle'
import { useAuth } from './context/AuthContext'
import { clearTokens } from './api/client'

function App() {
  const { isAuthenticated, isStaff, isGuest, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearTokens()
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <NavLink className="navbar-brand" to="/">
            Peaceloving Home Health Inc.
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <NavLink className="nav-link" to="/">
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/about">
                  About Us
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/services">
                  Services
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/careers">
                  Career
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/contact">
                  Contact Us
                </NavLink>
              </li>
              {isGuest ? (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/login">
                      Login
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/register">
                      Sign Up
                    </NavLink>
                  </li>
                </>
              ) : isStaff ? (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="moreDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                      More
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="moreDropdown">
                    <li>
                      <NavLink className="dropdown-item" to="/doctors">
                        Doctors
                      </NavLink>
                    </li>

                    <>
                      <li>
                        <NavLink className="dropdown-item" to="/staff/dashboard">
                          Staff Dashboard
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className="dropdown-item" to="/staff/lab-results">
                          Lab Results
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className="dropdown-item" to="/staff/billing">
                          Billing
                        </NavLink>
                      </li>
                      <li>
                        <NavLink className="dropdown-item" to="/staff/emails">
                          Email Logs
                        </NavLink>
                      </li>
                      {user?.role === 'ADMIN' && (
                        <>
                          <li>
                            <NavLink className="dropdown-item" to="/admin/users">
                              User Management
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/admin/applications">
                              Career Applications
                            </NavLink>
                          </li>
                        </>
                      )}
                      <li>
                        <NavLink className="dropdown-item" to="/portal/profile">
                          My Profile
                        </NavLink>
                      </li>
                    </>
                  </ul>
                </li>
              ) : (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/portal/profile">
                    My Profile
                  </NavLink>
                </li>
              )}
              {isAuthenticated && (
                <li className="nav-item">
                  <button
                    className="nav-link btn btn-link"
                    onClick={handleLogout}
                    style={{ cursor: 'pointer' }}
                  >
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
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
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
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
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
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
            element={
              <StaffProtectedRoute>
                <StaffBilling />
              </StaffProtectedRoute>
            }
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
              <AdminProtectedRoute>
                <AdminApplications />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="app-footer border-top bg-light mt-auto py-4">
        <div className="container">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <h2 className="h6 mb-2">Site Navigation</h2>
              <div className="d-flex flex-wrap gap-3">
                <NavLink to="/">Home</NavLink>
                <NavLink to="/about">About Us</NavLink>
                <NavLink to="/services">Services</NavLink>
                <NavLink to="/careers">Careers</NavLink>
                <NavLink to="/doctors">Doctors</NavLink>
                <NavLink to="/contact">Contact</NavLink>
              </div>
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

export default App
