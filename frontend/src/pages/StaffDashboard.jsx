import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter])

  const fetchAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter) {
        params.status = statusFilter
      }
      const { data } = await api.get('/api/staff/appointments/', { params })
      setAppointments(data)
    } catch (err) {
      setError('Failed to load appointments.')
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
    })
    setSuccessMessage('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({})
    setSuccessMessage('')
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

      await api.patch(`/api/staff/appointments/${id}/`, updateData)
      setSuccessMessage(`Appointment #${id} updated successfully!`)
      setEditingId(null)
      setEditData({})
      // Refresh the list
      fetchAppointments()
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data
        const errorMessages = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('. ')
        setError(errorMessages || 'Failed to update appointment.')
      } else {
        setError('Failed to update appointment.')
      }
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
          <div className="row">
            <div className="col-md-4">
              <label className="form-label" htmlFor="statusFilter">
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Loading State */}
      {loading && <p>Loading appointments...</p>}

      {/* Appointments Table */}
      {!loading && !error && appointments.length === 0 && (
        <div className="alert alert-info">
          No appointments found{statusFilter ? ' with the selected filter' : ''}.
        </div>
      )}

      {!loading && appointments.length > 0 && (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
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
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEdit(appointment)}
                          >
                            Edit
                          </button>
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
    </div>
  )
}
