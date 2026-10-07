import ScrollableTable from '../components/ScrollableTable'
import PageHeader from '../components/PageHeader'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Loading from '../components/Loading'
import ErrorAlert from '../components/ErrorAlert'

export default function StaffEmails() {
  const location = useLocation()
  const navigate = useNavigate()
  const logRequest = useRef(0)
  const [emailLogs, setEmailLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  
  // Compose form state
  const [composeForm, setComposeForm] = useState({
    to_email: '',
    subject: '',
    body: '',
    appointment_id: '',
    cc: ''
  })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [sendSuccess, setSendSuccess] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    event_type: '',
    status: '',
    to_email: ''
  })

  const prefill = location.state?.prefill

  useEffect(() => {
    if (prefill) {
      setComposeForm({
        to_email: prefill.to_email || '',
        subject: prefill.subject || '',
        body: prefill.body || '',
        appointment_id: prefill.appointment_id || '',
        cc: ''
      })
      setShowComposeModal(true)
      // Clear the state to avoid re-opening on refresh
      navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null })
    }
  }, [prefill, navigate, location.pathname, location.search, location.hash])

  const loadEmailLogs = useCallback(async (activeFilters = {}, signal) => {
    const request = ++logRequest.current
    try {
      setLoading(true)
      setError(null)
      
      // Build query params from filters
      const params = new URLSearchParams()
      if (activeFilters.event_type) params.append('event_type', activeFilters.event_type)
      if (activeFilters.status) params.append('status', activeFilters.status)
      if (activeFilters.to_email) params.append('to_email', activeFilters.to_email)
      
      const response = await api.get(`/api/staff/emails/?${params.toString()}`, { signal })
      if (signal?.aborted || request !== logRequest.current) return
      setEmailLogs(response.data.results || response.data)
    } catch (err) {
      if (!signal?.aborted && request === logRequest.current) setError(err.response?.data?.detail || 'Failed to load email logs')
    } finally {
      if (!signal?.aborted && request === logRequest.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadEmailLogs({}, controller.signal)
    return () => {
      logRequest.current += 1
      controller.abort()
    }
  }, [loadEmailLogs])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleApplyFilters = () => {
    loadEmailLogs(filters)
  }

  const handleComposeChange = (e) => {
    const { name, value } = e.target
    setComposeForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSendEmail = async (e) => {
    e.preventDefault()
    
    try {
      setSending(true)
      setSendError(null)
      setSendSuccess(false)
      
      // Parse CC emails (comma-separated)
      const ccArray = composeForm.cc
        ? composeForm.cc.split(',').map(e => e.trim()).filter(e => e)
        : []
      
      const payload = {
        to_email: composeForm.to_email,
        subject: composeForm.subject,
        body: composeForm.body,
        ...(composeForm.appointment_id && { appointment_id: parseInt(composeForm.appointment_id) }),
        ...(ccArray.length > 0 && { cc: ccArray })
      }
      
      await api.post('/api/staff/emails/send/', payload)
      
      setSendSuccess(true)
      setComposeForm({
        to_email: '',
        subject: '',
        body: '',
        appointment_id: '',
        cc: ''
      })
      
      // Reload logs to show the new email
      setTimeout(() => {
        loadEmailLogs(filters)
        setShowComposeModal(false)
        setSendSuccess(false)
      }, 2000)
      
    } catch (err) {
      setSendError(err.response?.data || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const getEventTypeBadge = (eventType) => {
    const badges = {
      'WELCOME': 'badge bg-success',
      'APPT_REQUESTED': 'badge bg-info',
      'APPT_CONFIRMED': 'badge bg-primary',
      'APPT_COMPLETED': 'badge bg-secondary',
      'APPT_CANCELED': 'badge bg-warning',
      'STAFF_CUSTOM': 'badge bg-dark'
    }
    return badges[eventType] || 'badge bg-secondary'
  }

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'badge bg-warning text-dark',
      'SENT': 'badge bg-success',
      'FAILED': 'badge bg-danger'
    }
    return badges[status] || 'badge bg-secondary'
  }

  if (loading && emailLogs.length === 0) {
    return <Loading />
  }

  return (
    <div className="staff-emails-page py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <PageHeader title="Email" description="Send patient emails and review email logs." eyebrow="Office" />
        <button 
          className="btn btn-primary"
          onClick={() => setShowComposeModal(true)}
        >
          <i className="bi bi-envelope-plus me-2"></i>
          Compose Email
        </button>
      </div>

      {error && <ErrorAlert error={error} />}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Filters</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Event Type</label>
              <select 
                className="form-select"
                name="event_type"
                value={filters.event_type}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="WELCOME">Welcome</option>
                <option value="APPT_REQUESTED">Appointment Requested</option>
                <option value="APPT_CONFIRMED">Appointment Confirmed</option>
                <option value="APPT_COMPLETED">Appointment Completed</option>
                <option value="APPT_CANCELED">Appointment Canceled</option>
                <option value="STAFF_CUSTOM">Staff Custom</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Recipient Email</label>
              <input 
                type="text"
                className="form-control"
                name="to_email"
                value={filters.to_email}
                onChange={handleFilterChange}
                placeholder="Search by email..."
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button 
                className="btn btn-secondary w-100"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="card">
        <div className="card-body">
          <ScrollableTable className="table-responsive" label="Staff Emails table">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Type</th>
                  <th scope="col">To</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Status</th>
                  <th scope="col">Sent By</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No email logs found
                    </td>
                  </tr>
                ) : (
                  emailLogs.map(log => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>
                        <span className={getEventTypeBadge(log.event_type)}>
                          {log.event_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <small>{log.to_email}</small>
                        {log.cc_emails && (
                          <div className="text-muted">
                            <small>CC: {log.cc_emails}</small>
                          </div>
                        )}
                      </td>
                      <td>
                        <small>{log.subject}</small>
                      </td>
                      <td>
                        <span className={getStatusBadge(log.status)}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <small>{log.sent_by_email || 'System'}</small>
                      </td>
                      <td>
                        <small>{new Date(log.created_at).toLocaleString()}</small>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedLog(log)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollableTable>
        </div>
      </div>

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Compose Email</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowComposeModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSendEmail}>
                <div className="modal-body">
                  {sendError && (
                    <ErrorAlert error={typeof sendError === 'string' ? sendError : JSON.stringify(sendError)} />
                  )}
                  {sendSuccess && (
                    <div className="alert alert-success">
                      Email sent successfully!
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label className="form-label">To Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="to_email"
                      value={composeForm.to_email}
                      onChange={handleComposeChange}
                      required
                      placeholder="recipient@example.com"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Subject *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="subject"
                      value={composeForm.subject}
                      onChange={handleComposeChange}
                      required
                      maxLength={255}
                      placeholder="Email subject"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Message Body *</label>
                    <textarea
                      className="form-control"
                      name="body"
                      value={composeForm.body}
                      onChange={handleComposeChange}
                      required
                      rows={8}
                      maxLength={5000}
                      placeholder="Your message here..."
                    />
                    <small className="text-muted">
                      {composeForm.body.length} / 5000 characters
                    </small>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Appointment ID (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="appointment_id"
                        value={composeForm.appointment_id}
                        onChange={handleComposeChange}
                        placeholder="Link to appointment..."
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">CC (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="cc"
                        value={composeForm.cc}
                        onChange={handleComposeChange}
                        placeholder="cc1@example.com, cc2@example.com"
                      />
                      <small className="text-muted">Comma-separated emails</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowComposeModal(false)}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Log Detail Modal */}
      {selectedLog && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Email Log Details</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setSelectedLog(null)}
                ></button>
              </div>
              <div className="modal-body">
                <dl className="row">
                  <dt className="col-sm-3">ID</dt>
                  <dd className="col-sm-9">{selectedLog.id}</dd>
                  
                  <dt className="col-sm-3">Event Type</dt>
                  <dd className="col-sm-9">
                    <span className={getEventTypeBadge(selectedLog.event_type)}>
                      {selectedLog.event_type.replace('_', ' ')}
                    </span>
                  </dd>
                  
                  <dt className="col-sm-3">Status</dt>
                  <dd className="col-sm-9">
                    <span className={getStatusBadge(selectedLog.status)}>
                      {selectedLog.status}
                    </span>
                  </dd>
                  
                  <dt className="col-sm-3">To</dt>
                  <dd className="col-sm-9">{selectedLog.to_email}</dd>
                  
                  {selectedLog.cc_emails && (
                    <>
                      <dt className="col-sm-3">CC</dt>
                      <dd className="col-sm-9">{selectedLog.cc_emails}</dd>
                    </>
                  )}
                  
                  <dt className="col-sm-3">Subject</dt>
                  <dd className="col-sm-9">{selectedLog.subject}</dd>
                  
                  <dt className="col-sm-3">Body</dt>
                  <dd className="col-sm-9">
                    <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedLog.body_text}
                    </pre>
                  </dd>
                  
                  {selectedLog.sent_by_email && (
                    <>
                      <dt className="col-sm-3">Sent By</dt>
                      <dd className="col-sm-9">{selectedLog.sent_by_email}</dd>
                    </>
                  )}
                  
                  {selectedLog.related_appointment_id && (
                    <>
                      <dt className="col-sm-3">Appointment</dt>
                      <dd className="col-sm-9">#{selectedLog.related_appointment_id}</dd>
                    </>
                  )}
                  
                  <dt className="col-sm-3">Created</dt>
                  <dd className="col-sm-9">{new Date(selectedLog.created_at).toLocaleString()}</dd>
                  
                  <dt className="col-sm-3">Updated</dt>
                  <dd className="col-sm-9">{new Date(selectedLog.updated_at).toLocaleString()}</dd>
                  
                  {selectedLog.error && (
                    <>
                      <dt className="col-sm-3">Error</dt>
                      <dd className="col-sm-9 text-danger">{selectedLog.error}</dd>
                    </>
                  )}
                </dl>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
