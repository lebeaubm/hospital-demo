import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { SkeletonTable } from '../components/SkeletonLoader'
import ErrorAlert from '../components/ErrorAlert'

export default function StaffDashboard() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [doctors, setDoctors] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleEmailPatient = (appointment) => {
    // Navigate to email page with pre-filled data
    navigate('/staff/emails', {
      state: {
        prefill: {
          to_email: appointment.patient_email,
          subject: `Regarding Your Appointment #${appointment.id}`,
          appointment_id: appointment.id,
          body: `Dear ${appointment.patient_name},\n\n`
        }
      }
    })
  }

  const handleViewRecord = (appointment) => {
    // Navigate to patient medical record
    navigate(`/staff/patients/${appointment.patient_id}/record`)
  }

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, doctorFilter, dateFrom, dateTo, currentPage])

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/api/doctors/')
      setDoctors(data.results || data)
    } catch (err) {
      console.error('Failed to load doctors:', err)
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page: currentPage }
      if (statusFilter) params.status = statusFilter
      if (doctorFilter) params.doctor = doctorFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const { data } = await api.get('/api/staff/appointments/', { params })
      
      // Handle paginated response
      if (data.results) {
        setAppointments(data.results)
        setTotalCount(data.count)
        setTotalPages(Math.ceil(data.count / 20))
      } else {
        setAppointments(data)
        setTotalCount(data.length)
        setTotalPages(1)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (appointment) => {
    setEditingId(appointment.id)
    setEditData({
      status: appointment.status,
      scheduled_start: appointment.scheduled_start
        ? new Date(appointment.scheduled_start).toISOString().slice(0, 16)
        : '',
      staff_notes: appointment.staff_notes || '',
      doctor: appointment.doctor_id || '',
    })
    setSuccessMessage('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({})
    setSuccessMessage('')
  }

  const handleQuickConfirm = async (appointment) => {
    setSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      await api.patch(`/api/staff/appointments/${appointment.id}/`, { status: 'CONFIRMED' })
      setSuccessMessage(`Appointment #${appointment.id} confirmed!`)
      fetchAppointments()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickCancel = async (appointment) => {
    if (!window.confirm(`Cancel appointment #${appointment.id} for ${appointment.patient_name}?`)) return
    setSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      await api.patch(`/api/staff/appointments/${appointment.id}/`, { status: 'CANCELED' })
      setSuccessMessage(`Appointment #${appointment.id} canceled.`)
      fetchAppointments()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (id) => {
    setSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      const updateData = {
        status: editData.status,
        staff_notes: editData.staff_notes,
      }
      
      // Only include scheduled_start if it has a value
      if (editData.scheduled_start) {
        updateData.scheduled_start = new Date(editData.scheduled_start).toISOString()
      }

      // Include doctor if it has a value
      if (editData.doctor) {
        updateData.doctor = editData.doctor
      }

      await api.patch(`/api/staff/appointments/${id}/`, updateData)
      setSuccessMessage(`Appointment #${id} updated successfully!`)
      setEditingId(null)
      setEditData({})
      // Refresh the list
      fetchAppointments()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-warning'
      case 'CONFIRMED':
        return 'bg-success'
      case 'COMPLETED':
        return 'bg-secondary'
      case 'CANCELED':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  return (
    <div className="py-4">
      <h1 className="mb-4">Staff Dashboard - Appointments</h1>

      {/* Filter Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Filters</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label" htmlFor="statusFilter">
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All Statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="doctorFilter">
                Doctor
              </label>
              <select
                id="doctorFilter"
                className="form-select"
                value={doctorFilter}
                onChange={(e) => {
                  setDoctorFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="dateFrom">
                Date From
              </label>
              <input
                id="dateFrom"
                type="date"
                className="form-control"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="dateTo">
                Date To
              </label>
              <input
                id="dateTo"
                type="date"
                className="form-control"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {/* Messages */}
      {error && <ErrorAlert error={error} onRetry={fetchAppointments} />}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Loading State */}
      {loading && <SkeletonTable />}

      {/* Appointments Table */}
      {!loading && !error && appointments.length === 0 && (
        <div className="alert alert-info">
          No appointments found{statusFilter ? ' with the selected filter' : ''}.
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Scheduled</th>
                    <th>Reason</th>
                    <th>Patient Notes</th>
                    <th>Staff Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>#{appointment.id}</td>
                      <td>
                        <div>
                          <strong>{appointment.patient_name}</strong>
                        </div>
                        <small className="text-muted">{appointment.patient_email}</small>
                      </td>
                      <td>
                        {editingId === appointment.id ? (
                          <select
                            className="form-select form-select-sm"
                            value={editData.doctor}
                            onChange={(e) =>
                              setEditData({ ...editData, doctor: e.target.value })
                            }
                          >
                            <option value="">Unassigned</option>
                            {doctors.map((doctor) => (
                              <option key={doctor.id} value={doctor.id}>
                                Dr. {doctor.first_name} {doctor.last_name}
                              </option>
                            ))}
                          </select>
                        ) : appointment.doctor_name ? (
                          <div>
                            <div><strong>{appointment.doctor_name}</strong></div>
                            <small className="text-muted">{appointment.doctor_specialty}</small>
                          </div>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {editingId === appointment.id ? (
                          <select
                            className="form-select form-select-sm"
                            value={editData.status}
                            onChange={(e) =>
                              setEditData({ ...editData, status: e.target.value })
                            }
                          >
                            <option value="REQUESTED">Requested</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELED">Canceled</option>
                          </select>
                        ) : (
                          <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        )}
                      </td>
                      <td>
                        <small>{formatDateTime(appointment.requested_start)}</small>
                      </td>
                      <td>
                        {editingId === appointment.id ? (
                          <input
                            type="datetime-local"
                            className="form-control form-control-sm"
                            value={editData.scheduled_start}
                            onChange={(e) =>
                              setEditData({ ...editData, scheduled_start: e.target.value })
                            }
                          />
                        ) : (
                          <small>{formatDateTime(appointment.scheduled_start)}</small>
                        )}
                      </td>
                      <td>{appointment.reason}</td>
                      <td>
                        <small>{appointment.patient_notes || '-'}</small>
                      </td>
                      <td>
                        {editingId === appointment.id ? (
                          <textarea
                            className="form-control form-control-sm"
                            rows="2"
                            value={editData.staff_notes}
                            onChange={(e) =>
                              setEditData({ ...editData, staff_notes: e.target.value })
                            }
                          />
                        ) : (
                          <small>{appointment.staff_notes || '-'}</small>
                        )}
                      </td>
                      <td>
                        {editingId === appointment.id ? (
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleSave(appointment.id)}
                              disabled={saving}
                            >
                              {saving ? '...' : 'Save'}
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={handleCancel}
                              disabled={saving}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex gap-1 flex-wrap">
                            {appointment.status === 'REQUESTED' && (
                              <>
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleQuickConfirm(appointment)}
                                  disabled={saving}
                                  title="Confirm appointment"
                                >
                                  ✓ Confirm
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleQuickCancel(appointment)}
                                  disabled={saving}
                                  title="Cancel appointment"
                                >
                                  ✗ Cancel
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEdit(appointment)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleViewRecord(appointment)}
                              title="View Medical Record"
                            >
                               Record
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleEmailPatient(appointment)}
                              title="Email Patient"
                            >
                              
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <small className="text-muted">
              Showing {appointments.length} of {totalCount} appointment{totalCount !== 1 ? 's' : ''}
            </small>
          </div>
          <div className="btn-group" role="group">
            <button
              className="btn btn-outline-primary"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              &laquo; Previous
            </button>
            <button className="btn btn-outline-secondary" disabled>
              Page {currentPage} of {totalPages}
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
