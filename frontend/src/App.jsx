import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import Contact from './pages/Contact'
import DoctorDetail from './pages/DoctorDetail'
import DoctorsList from './pages/DoctorsList'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Services from './pages/Services'
import Profile from './pages/Profile'
import Appointments from './pages/Appointments'
import RequestAppointment from './pages/RequestAppointment'
import MedicalRecords from './pages/MedicalRecords'
import Payments from './pages/Payments'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import StaffDashboard from './pages/StaffDashboard'
import StaffEmails from './pages/StaffEmails'
import StaffPatientRecord from './pages/StaffPatientRecord'
import Prescriptions from './pages/Prescriptions'
import Messages from './pages/Messages'
import LabResults from './pages/LabResults'
import Billing from './pages/Billing'
import FamilyMembers from './pages/FamilyMembers'
import ProtectedRoute from './components/ProtectedRoute'
import StaffProtectedRoute from './components/StaffProtectedRoute'
import ThemeToggle from './components/ThemeToggle'
import { useAuth } from './context/AuthContext'
import { clearTokens } from './api/client'

function App() {
  const { isAuthenticated, isStaff, logout } = useAuth()
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
            Hospital Demo
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
                <NavLink className="nav-link" to="/services">
                  Services
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/doctors">
                  Doctors
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/contact">
                  Contact
                </NavLink>
              </li>
              {!isAuthenticated ? (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/login">
                      Login
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/register">
                      Register
                    </NavLink>
                  </li>
                </>
              ) : (
                <>
                  {isStaff ? (
                    <>
                      <li className="nav-item">
                        <NavLink className="nav-link" to="/staff/dashboard">
                          Staff Dashboard
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink className="nav-link" to="/staff/emails">
                          Email Logs
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink className="nav-link" to="/portal/profile">
                          My Profile
                        </NavLink>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="nav-item dropdown">
                        <a
                          className="nav-link dropdown-toggle"
                          href="#"
                          id="patientPortalDropdown"
                          role="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          My Health
                        </a>
                        <ul className="dropdown-menu" aria-labelledby="patientPortalDropdown">
                          <li>
                            <NavLink className="dropdown-item" to="/portal/appointments">
                              📅 Appointments
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/portal/messages">
                              💬 Messages
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/portal/prescriptions">
                              💊 Prescriptions
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/portal/lab-results">
                              🔬 Lab Results
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/portal/records">
                              📋 Medical Records
                            </NavLink>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <NavLink className="dropdown-item" to="/portal/billing">
                              💰 Bills & Payments
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/portal/family">
                              👨‍👩‍👧‍👦 Family Members
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/portal/profile">
                              👤 My Profile
                            </NavLink>
                          </li>
                        </ul>
                      </li>
                    </>
                  )}
                  <li className="nav-item">
                    <button 
                      className="nav-link btn btn-link" 
                      onClick={handleLogout}
                      style={{ cursor: 'pointer' }}
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
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
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/messages/:threadId"
            element={
              <ProtectedRoute>
                <Messages />
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
        </Routes>
      </main>
      <ThemeToggle />
    </div>
  )
}

export default App
