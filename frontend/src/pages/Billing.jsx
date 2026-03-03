import { useEffect, useState } from 'react';
import { api } from '../api/client';

function Billing() {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await api.get('/api/bills/me/');
      setBills(response.data);
    } catch (err) {
      setError('Failed to load bills');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: 'secondary',
      SENT: 'info',
      PARTIALLY_PAID: 'warning',
      PAID: 'success',
      OVERDUE: 'danger',
      CANCELED: 'secondary',
    };
    return badges[status] || 'secondary';
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill || !paymentAmount) return;

    setSubmitting(true);
    try {
      await api.post(`/bills/${selectedBill.id}/payments/`, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
      });
      alert('Payment recorded successfully!');
      setShowPaymentModal(false);
      setPaymentAmount('');
      fetchBills();
      // Refresh selected bill
      const response = await api.get(`/bills/${selectedBill.id}/`);
      setSelectedBill(response.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  const unpaidBills = bills.filter((bill) => bill.balance_due > 0);
  const totalBalance = unpaidBills.reduce((sum, bill) => sum + parseFloat(bill.balance_due), 0);

  return (
    <div className="container mt-4">
      <h1 className="mb-4"> Billing & Payments</h1>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">Total Balance Due</h6>
              <h2 className="mb-0">${totalBalance.toFixed(2)}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">Paid Bills</h6>
              <h2 className="mb-0">{bills.filter((b) => b.status === 'PAID').length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h6 className="card-title">Unpaid Bills</h6>
              <h2 className="mb-0">{unpaidBills.length}</h2>
            </div>
          </div>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="alert alert-info">No bills found</div>
      ) : (
        <div className="row">
          {/* Bills List */}
          <div className="col-md-5">
            <h5 className="mb-3">Your Bills</h5>
            <div className="list-group">
              {bills.map((bill) => (
                <button
                  key={bill.id}
                  className={`list-group-item list-group-item-action ${
                    selectedBill?.id === bill.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedBill(bill)}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">{bill.bill_number}</h6>
                    <span className={`badge bg-${getStatusBadge(bill.status)}`}>
                      {bill.status}
                    </span>
                  </div>
                  
                  {bill.appointment_reason && (
                    <p className="mb-1 small">{bill.appointment_reason}</p>
                  )}
                  
                  <div className="mb-1">
                    <strong>Balance Due:</strong> ${parseFloat(bill.balance_due).toFixed(2)}
                  </div>
                  
                  <small className="text-muted">
                    Bill Date: {new Date(bill.bill_date).toLocaleDateString()}
                    {bill.due_date && (
                      <><br />Due: {new Date(bill.due_date).toLocaleDateString()}</>
                    )}
                  </small>
                </button>
              ))}
            </div>
          </div>

          {/* Bill Details */}
          <div className="col-md-7">
            {selectedBill ? (
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">{selectedBill.bill_number}</h5>
                      <small>Bill Date: {new Date(selectedBill.bill_date).toLocaleDateString()}</small>
                    </div>
                    <span className={`badge bg-${getStatusBadge(selectedBill.status)}`}>
                      {selectedBill.status}
                    </span>
                  </div>
                </div>
                
                <div className="card-body">
                  {/* Patient Info */}
                  <div className="mb-3">
                    <h6>Patient Information</h6>
                    <p className="mb-1">{selectedBill.patient_name}</p>
                    <small className="text-muted">{selectedBill.patient_email}</small>
                  </div>

                  {/* Line Items */}
                  <div className="mb-3">
                    <h6>Services & Charges</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBill.line_items && selectedBill.line_items.length > 0 ? (
                            selectedBill.line_items.map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <div>
                                    <strong>{item.service_name}</strong>
                                  </div>
                                  <small className="text-muted">{item.service_code}</small>
                                  {item.description && (
                                    <div><small>{item.description}</small></div>
                                  )}
                                </td>
                                <td>{new Date(item.service_date).toLocaleDateString()}</td>
                                <td>{item.quantity}</td>
                                <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                                <td>${parseFloat(item.total).toFixed(2)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center text-muted">
                                No line items
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bill Totals */}
                  <div className="border-top pt-3">
                    <table className="table table-sm mb-0">
                      <tbody>
                        <tr>
                          <th style={{ width: '70%' }}>Subtotal:</th>
                          <td className="text-end">${parseFloat(selectedBill.subtotal).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th>Tax:</th>
                          <td className="text-end">${parseFloat(selectedBill.tax).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th>Insurance Coverage:</th>
                          <td className="text-end">-${parseFloat(selectedBill.insurance_covered).toFixed(2)}</td>
                        </tr>
                        <tr className="table-primary">
                          <th>Patient Responsibility:</th>
                          <td className="text-end">
                            <strong>${parseFloat(selectedBill.patient_responsibility).toFixed(2)}</strong>
                          </td>
                        </tr>
                        <tr>
                          <th>Amount Paid:</th>
                          <td className="text-end">-${parseFloat(selectedBill.amount_paid).toFixed(2)}</td>
                        </tr>
                        <tr className="table-warning">
                          <th>Balance Due:</th>
                          <td className="text-end">
                            <strong className="text-danger">
                              ${parseFloat(selectedBill.balance_due).toFixed(2)}
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Payment History */}
                  {selectedBill.payments && selectedBill.payments.length > 0 && (
                    <div className="border-top pt-3 mt-3">
                      <h6>Payment History</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Method</th>
                              <th>Transaction ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedBill.payments.map((payment) => (
                              <tr key={payment.id}>
                                <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                <td>${parseFloat(payment.amount).toFixed(2)}</td>
                                <td>{payment.payment_method.replace('_', ' ')}</td>
                                <td><small>{payment.transaction_id || '-'}</small></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedBill.notes && (
                    <div className="border-top pt-3 mt-3">
                      <h6>Notes</h6>
                      <p className="text-muted">{selectedBill.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {parseFloat(selectedBill.balance_due) > 0 && (
                  <div className="card-footer">
                    <button
                      className="btn btn-primary w-100"
                      onClick={() => {
                        setPaymentAmount(selectedBill.balance_due);
                        setShowPaymentModal(true);
                      }}
                    >
                       Make Payment
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="alert alert-info">
                Select a bill to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Make Payment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPaymentModal(false)}
                />
              </div>
              <form onSubmit={submitPayment}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <strong>Bill:</strong> {selectedBill.bill_number}<br />
                    <strong>Balance Due:</strong> ${parseFloat(selectedBill.balance_due).toFixed(2)}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Payment Amount</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        max={selectedBill.balance_due}
                        required
                      />
                    </div>
                    <small className="text-muted">
                      Maximum: ${parseFloat(selectedBill.balance_due).toFixed(2)}
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                    >
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="DEBIT_CARD">Debit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHECK">Check</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;
