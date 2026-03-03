import { useEffect, useState } from 'react';
import { api } from '../api/client';

const ORDER_STATUSES = ['ORDERED', 'COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];
const RESULT_STATUSES = ['PRELIMINARY', 'FINAL', 'AMENDED'];
const PRIORITIES = ['ROUTINE', 'URGENT', 'STAT'];
const FLAGS = ['', 'HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW'];

const statusBadge = { ORDERED: 'secondary', COLLECTED: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELED: 'danger' };
const priorityBadge = { ROUTINE: 'secondary', URGENT: 'warning', STAT: 'danger' };
const resultStatusBadge = { PRELIMINARY: 'warning', FINAL: 'success', AMENDED: 'info' };

const emptyRow = () => ({ parameter_name: '', value: '', unit: '', reference_range: '', flag: '', is_abnormal: false, _key: Math.random() });

export default function StaffLabResults() {
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // New order form
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ patient: '', test_name_input: '', priority: 'ROUTINE', notes: '' });

  // Status update
  const [editStatus, setEditStatus] = useState('');
  const [editCollectionDate, setEditCollectionDate] = useState('');

  // Result editor (unified)
  const [showResultEditor, setShowResultEditor] = useState(false);
  const [resultMeta, setResultMeta] = useState({ result_date: new Date().toISOString().slice(0, 10), status: 'FINAL', is_critical: false });
  const [interpretation, setInterpretation] = useState('');
  const [valueRows, setValueRows] = useState([emptyRow()]);

  useEffect(() => {
    Promise.all([
      api.get('/api/staff/lab-orders/'),
      api.get('/api/staff/patients/'),
    ]).then(([ordersRes, patientsRes]) => {
      setOrders(ordersRes.data.results || ordersRes.data);
      setPatients(patientsRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const refreshOrders = async () => {
    const res = await api.get('/api/staff/lab-orders/');
    const data = res.data.results || res.data;
    setOrders(data);
    if (selectedOrder) {
      const updated = data.find(o => o.id === selectedOrder.id);
      if (updated) {
        setSelectedOrder(updated);
        setEditStatus(updated.status);
        setEditCollectionDate(updated.collection_date || '');
      }
    }
  };

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditCollectionDate(order.collection_date || '');
    setShowResultEditor(false);
    setValueRows([emptyRow()]);
    setInterpretation('');
    setResultMeta({ result_date: new Date().toISOString().slice(0, 10), status: 'FINAL', is_critical: false });
  };

  // ── Create lab order ─────────────────────────────────────────────────────
  const createOrder = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/staff/lab-orders/create/', newOrder);
      setShowNewOrder(false);
      setNewOrder({ patient: '', test_name_input: '', priority: 'ROUTINE', notes: '' });
      await refreshOrders();
      flash('Lab order created.');
    } catch (err) {
      alert('Failed to create lab order: ' + JSON.stringify(err.response?.data));
    } finally { setSaving(false); }
  };

  // ── Update order status ──────────────────────────────────────────────────
  const updateOrderStatus = async () => {
    setSaving(true);
    try {
      const payload = { status: editStatus };
      if (editCollectionDate) payload.collection_date = editCollectionDate;
      await api.patch(`/api/staff/lab-orders/${selectedOrder.id}/`, payload);
      await refreshOrders();
      flash('Order status updated.');
    } catch (err) {
      alert('Failed to update order: ' + JSON.stringify(err.response?.data));
    } finally { setSaving(false); }
  };

  // ── Value row helpers ────────────────────────────────────────────────────
  const updateRow = (key, field, val) =>
    setValueRows(rows => rows.map(r => r._key === key ? { ...r, [field]: val } : r));

  const addRow = () => setValueRows(rows => [...rows, emptyRow()]);

  const removeRow = (key) => setValueRows(rows => rows.filter(r => r._key !== key));

  // ── Open editor (pre-fill if result already exists) ──────────────────────
  const openEditor = () => {
    if (selectedOrder.has_result && selectedOrder.result) {
      setResultMeta({
        result_date: selectedOrder.result.result_date || new Date().toISOString().slice(0, 10),
        status: selectedOrder.result.status || 'FINAL',
        is_critical: selectedOrder.result.is_critical || false,
      });
      setInterpretation(selectedOrder.result.interpretation || '');
    }
    setValueRows([emptyRow()]);
    setShowResultEditor(true);
  };

  // ── Save result + all value rows ─────────────────────────────────────────
  const saveResults = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let resultId;

      if (!selectedOrder.has_result) {
        // Create a new result record
        const res = await api.post('/api/staff/lab-results/create/', {
          order: selectedOrder.id,
          result_date: resultMeta.result_date,
          status: resultMeta.status,
          is_critical: resultMeta.is_critical,
          interpretation,
        });
        resultId = res.data.id;
      } else {
        // Update existing result's interpretation / status
        await api.patch(`/api/staff/lab-results/${selectedOrder.result.id}/`, {
          status: resultMeta.status,
          is_critical: resultMeta.is_critical,
          interpretation,
        });
        resultId = selectedOrder.result.id;
      }

      // Post each non-empty value row
      const filledRows = valueRows.filter(r => r.parameter_name.trim() && r.value.trim());
      await Promise.all(
        filledRows.map(({ _key, ...row }) =>
          api.post(`/api/staff/lab-results/${resultId}/values/`, row)
        )
      );

      setShowResultEditor(false);
      setValueRows([emptyRow()]);
      setInterpretation('');
      await refreshOrders();
      flash('Results saved successfully.');
    } catch (err) {
      alert('Failed to save results: ' + JSON.stringify(err.response?.data));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="container mt-4 text-center"><div className="spinner-border" /></div>;

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2> Staff Lab Results</h2>
        <button className="btn btn-primary" onClick={() => setShowNewOrder(true)}>+ New Lab Order</button>
      </div>

      {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

      {/* ── New Order Modal ──────────────────────────────────────────────── */}
      {showNewOrder && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">New Lab Order</h5>
                <button className="btn-close" onClick={() => setShowNewOrder(false)} />
              </div>
              <form onSubmit={createOrder}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Patient *</label>
                    <select className="form-select" value={newOrder.patient} onChange={e => setNewOrder({ ...newOrder, patient: e.target.value })} required>
                      <option value="">-- Select patient --</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Lab Test Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Complete Blood Count, HbA1c, Lipid Panel"
                      value={newOrder.test_name_input}
                      onChange={e => setNewOrder({ ...newOrder, test_name_input: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={newOrder.priority} onChange={e => setNewOrder({ ...newOrder, priority: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows="2" value={newOrder.notes} onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewOrder(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Order'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* ── Orders sidebar ───────────────────────────────────────────────── */}
        <div className="col-md-4 col-lg-3">
          <div className="card">
            <div className="card-header fw-bold">Lab Orders ({orders.length})</div>
            <div className="list-group list-group-flush" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {orders.length === 0 && <div className="list-group-item text-muted">No orders yet</div>}
              {orders.map(order => (
                <button
                  key={order.id}
                  className={`list-group-item list-group-item-action ${selectedOrder?.id === order.id ? 'active' : ''}`}
                  onClick={() => selectOrder(order)}
                >
                  <div className="d-flex justify-content-between">
                    <strong className="small">{order.test_name}</strong>
                    <span className={`badge bg-${statusBadge[order.status] || 'secondary'}`}>{order.status}</span>
                  </div>
                  <div className="text-muted small">{order.patient_name}</div>
                  <div className="small mt-1">
                    <span className={`badge bg-${priorityBadge[order.priority] || 'secondary'} me-1`}>{order.priority}</span>
                    {order.has_result && <span className="badge bg-success"> Results</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Detail panel ─────────────────────────────────────────────────── */}
        <div className="col-md-8 col-lg-9">
          {!selectedOrder ? (
            <div className="alert alert-info">Select a lab order to view or enter results</div>
          ) : (
            <div>
              {/* Order info / status card */}
              <div className="card mb-3">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{selectedOrder.test_name}</h5>
                  <span className="badge bg-light text-dark">{selectedOrder.test_category}</span>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-sm-6">
                      <table className="table table-sm mb-0">
                        <tbody>
                          <tr><th style={{ width: '40%' }}>Patient:</th><td>{selectedOrder.patient_name}</td></tr>
                          <tr><th>Ordered by:</th><td>{selectedOrder.ordered_by_name || '—'}</td></tr>
                          <tr><th>Ordered:</th><td>{new Date(selectedOrder.ordered_date).toLocaleDateString()}</td></tr>
                          <tr><th>Priority:</th><td><span className={`badge bg-${priorityBadge[selectedOrder.priority]}`}>{selectedOrder.priority}</span></td></tr>
                          {selectedOrder.notes && <tr><th>Notes:</th><td>{selectedOrder.notes}</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-semibold">Update Status</label>
                      <select className="form-select form-select-sm mb-2" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <label className="form-label fw-semibold">Collection Date</label>
                      <input type="date" className="form-control form-control-sm mb-2" value={editCollectionDate} onChange={e => setEditCollectionDate(e.target.value)} />
                      <button className="btn btn-sm btn-outline-primary" onClick={updateOrderStatus} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Results card ──────────────────────────────────────────────── */}
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Test Results</h6>
                  {!showResultEditor && (
                    <button className="btn btn-sm btn-success" onClick={openEditor}>
                      {selectedOrder.has_result ? '+ Add More Values' : '+ Enter Results'}
                    </button>
                  )}
                </div>
                <div className="card-body">

                  {/* ── Previously saved values ──────────────────────────────── */}
                  {selectedOrder.has_result && selectedOrder.result && (
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <span className={`badge bg-${resultStatusBadge[selectedOrder.result.status]} me-2`}>
                            {selectedOrder.result.status}
                          </span>
                          {selectedOrder.result.is_critical && (
                            <span className="badge bg-danger me-2"> Critical</span>
                          )}
                          <small className="text-muted">
                            {new Date(selectedOrder.result.result_date).toLocaleDateString()}
                            {selectedOrder.result.reviewed_by_name && ` · ${selectedOrder.result.reviewed_by_name}`}
                          </small>
                        </div>
                      </div>

                      {selectedOrder.result.interpretation && (
                        <div className="alert alert-info py-2 mb-3">
                          <strong>Interpretation:</strong><br />
                          <span style={{ whiteSpace: 'pre-wrap' }}>{selectedOrder.result.interpretation}</span>
                        </div>
                      )}

                      {selectedOrder.result.values?.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover table-sm align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Parameter</th>
                                <th>Value</th>
                                <th>Unit</th>
                                <th>Reference Range</th>
                                <th>Flag</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrder.result.values.map(v => (
                                <tr key={v.id} className={v.is_abnormal ? 'table-warning' : ''}>
                                  <td>
                                    {v.parameter_name}
                                    {v.is_abnormal && <span className="badge bg-warning text-dark ms-2">Abnormal</span>}
                                  </td>
                                  <td><strong>{v.value}</strong></td>
                                  <td>{v.unit}</td>
                                  <td>{v.reference_range}</td>
                                  <td>
                                    {v.flag && (
                                      <span className={`badge bg-${v.flag.includes('CRITICAL') ? 'danger' : 'warning'} text-${v.flag.includes('CRITICAL') ? 'white' : 'dark'}`}>
                                        {v.flag}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted small mb-0">No values recorded yet.</p>
                      )}
                    </div>
                  )}

                  {/* ── Result entry / editor ────────────────────────────────── */}
                  {showResultEditor && (
                    <form onSubmit={saveResults}>

                      {/* Meta row */}
                      <div className="row g-2 mb-3 align-items-end">
                        {!selectedOrder.has_result && (
                          <div className="col-sm-3">
                            <label className="form-label fw-semibold">Result Date *</label>
                            <input type="date" className="form-control form-control-sm"
                              value={resultMeta.result_date}
                              onChange={e => setResultMeta({ ...resultMeta, result_date: e.target.value })}
                              required />
                          </div>
                        )}
                        <div className="col-sm-3">
                          <label className="form-label fw-semibold">Status</label>
                          <select className="form-select form-select-sm"
                            value={resultMeta.status}
                            onChange={e => setResultMeta({ ...resultMeta, status: e.target.value })}>
                            {RESULT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="col-auto d-flex align-items-end pb-1">
                          <div className="form-check mb-0">
                            <input className="form-check-input" type="checkbox" id="critical"
                              checked={resultMeta.is_critical}
                              onChange={e => setResultMeta({ ...resultMeta, is_critical: e.target.checked })} />
                            <label className="form-check-label text-danger fw-semibold" htmlFor="critical">
                              Critical Result
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* ── Inline value table ───────────────────────────────── */}
                      <div className="table-responsive mb-2">
                        <table className="table table-bordered table-sm align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ minWidth: 140 }}>Parameter</th>
                              <th style={{ minWidth: 90 }}>Value</th>
                              <th style={{ minWidth: 80 }}>Unit</th>
                              <th style={{ minWidth: 140 }}>Reference Range</th>
                              <th style={{ minWidth: 150 }}>Flag</th>
                              <th style={{ minWidth: 90 }}>Abnormal</th>
                              <th style={{ width: 40 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {valueRows.map(row => (
                              <tr key={row._key}>
                                <td>
                                  <input className="form-control form-control-sm"
                                    placeholder="e.g. WBC"
                                    value={row.parameter_name}
                                    onChange={e => updateRow(row._key, 'parameter_name', e.target.value)} />
                                </td>
                                <td>
                                  <input className="form-control form-control-sm"
                                    placeholder="5.2"
                                    value={row.value}
                                    onChange={e => updateRow(row._key, 'value', e.target.value)} />
                                </td>
                                <td>
                                  <input className="form-control form-control-sm"
                                    placeholder="mg/dL"
                                    value={row.unit}
                                    onChange={e => updateRow(row._key, 'unit', e.target.value)} />
                                </td>
                                <td>
                                  <input className="form-control form-control-sm"
                                    placeholder="4.5–11.0"
                                    value={row.reference_range}
                                    onChange={e => updateRow(row._key, 'reference_range', e.target.value)} />
                                </td>
                                <td>
                                  <select className="form-select form-select-sm"
                                    value={row.flag}
                                    onChange={e => updateRow(row._key, 'flag', e.target.value)}>
                                    {FLAGS.map(f => <option key={f} value={f}>{f || '(none)'}</option>)}
                                  </select>
                                </td>
                                <td className="text-center">
                                  <div className="form-check d-flex justify-content-center mb-0">
                                    <input className="form-check-input" type="checkbox"
                                      checked={row.is_abnormal}
                                      onChange={e => updateRow(row._key, 'is_abnormal', e.target.checked)} />
                                  </div>
                                </td>
                                <td className="text-center">
                                  {valueRows.length > 1 && (
                                    <button type="button" className="btn btn-sm btn-outline-danger px-2 py-0"
                                      onClick={() => removeRow(row._key)}>×</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-secondary mb-4" onClick={addRow}>
                        + Add Row
                      </button>

                      {/* ── Interpretation / notes text box ──────────────────── */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Clinical Interpretation / Notes</label>
                        <textarea className="form-control" rows="5"
                          placeholder="Write your clinical interpretation, findings, or any notes for the patient here…"
                          value={interpretation}
                          onChange={e => setInterpretation(e.target.value)} />
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-success" disabled={saving}>
                          {saving ? 'Saving…' : 'Save Results'}
                        </button>
                        <button type="button" className="btn btn-secondary"
                          onClick={() => setShowResultEditor(false)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {!selectedOrder.has_result && !showResultEditor && (
                    <p className="text-muted">No results entered yet. Click "+ Enter Results" to begin.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

