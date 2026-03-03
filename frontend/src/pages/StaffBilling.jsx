import { useEffect, useState } from 'react'
import { api } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'

const STATUS_COLORS = {
  DRAFT: 'secondary',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELED: 'dark',
}

export default function StaffBilling() {
  // Bills list
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  // Patients + services (for forms)
  const [patients, setPatients] = useState([])
  const [services, setServices] = useState([])

  // Create bill modal
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    patient: '',
    patient_responsibility: '0',
    insurance_covered: '0',
    due_date: '',
    notes: '',
  })

  // Detail modal
  const [selectedBill, setSelectedBill] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Add line item
  const [lineItemForm, setLineItemForm] = useState({ service: '', quantity: '1', unit_price: '', description: '', service_date: new Date().toISOString().slice(0, 10) })
  const [addingLine, setAddingLine] = useState(false)

  // Status change
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchBills()
    fetchPatients()
    fetchServices()
  }, [statusFilter])

  const fetchBills = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/api/staff/bills/', { params })
      setBills(data.results || data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/api/staff/patients/')
      setPatients(data)
    } catch { /* non-critical */ }
  }

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/api/billable-services/')
      setServices(data.results || data)
    } catch { /* non-critical */ }
  }

  const openDetail = async (bill) => {
    setDetailLoading(true)
    setSelectedBill(bill)
    setLineItemForm({ service: '', quantity: '1', unit_price: '', description: '' })
    try {
      const { data } = await api.get(`/api/bills/${bill.id}/`)
      setSelectedBill(data)
    } catch { /* use existing data */ }
    setDetailLoading(false)
  }

  const handleCreateBill = async (e) => {
    e.preventDefault()
    setCreating(true)
    setSuccessMsg('')
    try {
      const payload = {
        patient: parseInt(createForm.patient),
        patient_responsibility: parseFloat(createForm.patient_responsibility) || 0,
        insurance_covered: parseFloat(createForm.insurance_covered) || 0,
        notes: createForm.notes,
      }
      if (createForm.due_date) payload.due_date = createForm.due_date
      const { data } = await api.post('/api/staff/bills/create/', payload)
      setSuccessMsg(`Bill ${data.bill_number} created.`)
      setShowCreate(false)
      setCreateForm({ patient: '', patient_responsibility: '0', insurance_covered: '0', due_date: '', notes: '' })
      fetchBills()
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create bill')
    } finally {
      setCreating(false)
    }
  }

  const handleAddLineItem = async (e) => {
    e.preventDefault()
    setAddingLine(true)
    try {
      const payload = {
        service: parseInt(lineItemForm.service),
        quantity: parseInt(lineItemForm.quantity),
        unit_price: parseFloat(lineItemForm.unit_price),
        description: lineItemForm.description,
        service_date: lineItemForm.service_date,
      }
      await api.post(`/api/staff/bills/${selectedBill.id}/line-items/`, payload)
      // Refresh bill detail
      const { data } = await api.get(`/api/bills/${selectedBill.id}/`)
      setSelectedBill(data)
      setLineItemForm({ service: '', quantity: '1', unit_price: '', description: '', service_date: new Date().toISOString().slice(0, 10) })
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to add line item')
    } finally {
      setAddingLine(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true)
    try {
      const { data } = await api.patch(`/api/staff/bills/${selectedBill.id}/`, { status: newStatus })
      setSelectedBill(data)
      setSuccessMsg(`Bill status updated to ${newStatus}.`)
      fetchBills()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Pre-fill unit_price when service is selected
  const handleServiceSelect = (serviceId) => {
    const svc = services.find(s => String(s.id) === String(serviceId))
    setLineItemForm(f => ({
      ...f,
      service: serviceId,
      unit_price: svc ? String(svc.default_price ?? '') : '',
      description: svc ? svc.name : '',
    }))
  }

  const fmt = (v) => parseFloat(v || 0).toFixed(2)

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Staff — Billing</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create New Bill
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible">
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')} />
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <label className="form-label mb-0 me-2">Status:</label>
            </div>
            <div className="col-auto">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchBills} />}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : bills.length === 0 ? (
        <div className="alert alert-info">No bills found.</div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Bill #</th>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td><code>{bill.bill_number}</code></td>
                    <td>
                      <div><strong>{bill.patient_name}</strong></div>
                      <small className="text-muted">{bill.patient_email}</small>
                    </td>
                    <td>
                      <span className={`badge bg-${STATUS_COLORS[bill.status] || 'secondary'}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>${fmt(bill.patient_responsibility)}</td>
                    <td>${fmt(bill.amount_paid)}</td>
                    <td>
                      <strong className={bill.balance_due > 0 ? 'text-danger' : 'text-success'}>
                        ${fmt(bill.balance_due)}
                      </strong>
                    </td>
                    <td>{bill.due_date || '—'}</td>
                    <td><small>{new Date(bill.created_at).toLocaleDateString()}</small></td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openDetail(bill)}
                      >
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== CREATE BILL MODAL ======================== */}
      {showCreate && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Bill</h5>
                <button className="btn-close" onClick={() => setShowCreate(false)} />
              </div>
              <form onSubmit={handleCreateBill}>
                <div className="modal-body">
                  <div className="alert alert-warning py-2">
                    <small>⚠ <strong>Demo Mode:</strong> No real charges occur. Payments are tracked for demonstration purposes only.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Patient *</label>
                    <select
                      className="form-select"
                      value={createForm.patient}
                      onChange={(e) => setCreateForm({ ...createForm, patient: e.target.value })}
                      required
                    >
                      <option value="">— Select patient —</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label">Total Cost ($)</label>
                      <input
                        type="number" step="0.01" min="0"
                        className="form-control"
                        value={createForm.patient_responsibility}
                        onChange={(e) => setCreateForm({ ...createForm, patient_responsibility: e.target.value })}
                      />
                    </div>
                    <div className="col">
                      <label className="form-label">Insurance Covered ($)</label>
                      <input
                        type="number" step="0.01" min="0"
                        className="form-control"
                        value={createForm.insurance_covered}
                        onChange={(e) => setCreateForm({ ...createForm, insurance_covered: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={createForm.due_date}
                      onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    />
                  </div>
                  <small className="text-muted">Add line items after creating the bill.</small>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Bill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================== BILL DETAIL MODAL ======================== */}
      {selectedBill && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Bill <code>{selectedBill.bill_number}</code> —{' '}
                  <span className={`badge bg-${STATUS_COLORS[selectedBill.status] || 'secondary'}`}>
                    {selectedBill.status}
                  </span>
                </h5>
                <button className="btn-close" onClick={() => setSelectedBill(null)} />
              </div>
              <div className="modal-body">
                {detailLoading ? (
                  <div className="text-center py-3"><div className="spinner-border spinner-border-sm" /></div>
                ) : (
                  <>
                    {/* Summary */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="card bg-light">
                          <div className="card-body py-2">
                            <strong>Patient:</strong> {selectedBill.patient_name} ({selectedBill.patient_email})<br />
                            <strong>Due Date:</strong> {selectedBill.due_date || '—'}<br />
                            {selectedBill.notes && <><strong>Notes:</strong> {selectedBill.notes}</>}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card bg-light">
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between"><span>Total Cost</span><strong>${fmt(selectedBill.patient_responsibility)}</strong></div>
                            <div className="d-flex justify-content-between"><span>Insurance Covered</span><strong>-${fmt(selectedBill.insurance_covered)}</strong></div>
                            <hr className="my-1" />
                            <div className="d-flex justify-content-between"><span>Paid</span><strong className="text-success">${fmt(selectedBill.amount_paid)}</strong></div>
                            <div className="d-flex justify-content-between"><span>Balance Due</span><strong className={selectedBill.balance_due > 0 ? 'text-danger' : 'text-success'}>${fmt(selectedBill.balance_due)}</strong></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="mb-4">
                      <strong>Change Status:</strong>{' '}
                      <div className="btn-group ms-2" role="group">
                        {selectedBill.status === 'DRAFT' && (
                          <button
                            className="btn btn-sm btn-info"
                            disabled={updatingStatus}
                            onClick={() => handleStatusChange('SENT')}
                          >
                            📤 Send to Patient
                          </button>
                        )}
                        {['DRAFT', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(selectedBill.status) && (
                          <button
                            className="btn btn-sm btn-success"
                            disabled={updatingStatus}
                            onClick={() => handleStatusChange('PAID')}
                          >
                            ✓ Mark as Paid
                          </button>
                        )}
                        {selectedBill.status !== 'CANCELED' && selectedBill.status !== 'PAID' && (
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={updatingStatus}
                            onClick={() => {
                              if (window.confirm('Cancel this bill?')) handleStatusChange('CANCELED')
                            }}
                          >
                            ✗ Cancel Bill
                          </button>
                        )}
                        {selectedBill.status !== 'DRAFT' && selectedBill.status !== 'PAID' && selectedBill.status !== 'CANCELED' && (
                          <button
                            className="btn btn-sm btn-warning"
                            disabled={updatingStatus}
                            onClick={() => handleStatusChange('OVERDUE')}
                          >
                            ⏰ Mark Overdue
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Line Items */}
                    <h6>Line Items</h6>
                    {selectedBill.line_items?.length === 0 ? (
                      <p className="text-muted">No line items yet.</p>
                    ) : (
                      <table className="table table-sm mb-3">
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBill.line_items?.map((item) => (
                            <tr key={item.id}>
                              <td><small>{item.service_code || item.service}</small></td>
                              <td>{item.description}</td>
                              <td>{item.quantity}</td>
                              <td>${fmt(item.unit_price)}</td>
                              <td>${fmt(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Add Line Item (only if not PAID or CANCELED) */}
                    {!['PAID', 'CANCELED'].includes(selectedBill.status) && (
                      <div className="card mb-4">
                        <div className="card-header py-2"><strong>Add Line Item</strong></div>
                        <div className="card-body">
                          <form onSubmit={handleAddLineItem}>
                            <div className="row g-2">
                              <div className="col-md-3">
                                <select
                                  className="form-select form-select-sm"
                                  value={lineItemForm.service}
                                  onChange={(e) => handleServiceSelect(e.target.value)}
                                  required
                                >
                                  <option value="">— Select service —</option>
                                  {services.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Description"
                                  value={lineItemForm.description}
                                  onChange={(e) => setLineItemForm({ ...lineItemForm, description: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="col-md-1">
                                <input
                                  type="number" min="1"
                                  className="form-control form-control-sm"
                                  placeholder="Qty"
                                  value={lineItemForm.quantity}
                                  onChange={(e) => setLineItemForm({ ...lineItemForm, quantity: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="col-md-2">
                                <div className="input-group input-group-sm">
                                  <span className="input-group-text">$</span>
                                  <input
                                    type="number" step="0.01" min="0"
                                    className="form-control"
                                    placeholder="Price"
                                    value={lineItemForm.unit_price}
                                    onChange={(e) => setLineItemForm({ ...lineItemForm, unit_price: e.target.value })}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="col-md-2">
                                <input
                                  type="date"
                                  className="form-control form-control-sm"
                                  value={lineItemForm.service_date}
                                  onChange={(e) => setLineItemForm({ ...lineItemForm, service_date: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="col-md-1">
                                <button type="submit" className="btn btn-sm btn-primary w-100" disabled={addingLine}>
                                  {addingLine ? '...' : '+ Add'}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Payment History */}
                    {selectedBill.payments?.length > 0 && (
                      <>
                        <h6>Payment History</h6>
                        <table className="table table-sm">
                          <thead>
                            <tr><th>Date</th><th>Method</th><th>Amount</th><th>Notes</th></tr>
                          </thead>
                          <tbody>
                            {selectedBill.payments.map((p) => (
                              <tr key={p.id}>
                                <td>{p.payment_date}</td>
                                <td>{p.payment_method}</td>
                                <td className="text-success">${fmt(p.amount)}</td>
                                <td><small>{p.notes || '—'}</small></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedBill(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
