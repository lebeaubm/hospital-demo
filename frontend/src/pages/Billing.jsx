import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// ── Payment modal as its own component so useStripe/useElements hooks work ──
function PaymentModal({ selectedBill, onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [paymentAmount, setPaymentAmount] = useState(selectedBill.balance_due);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [useStripeMode, setUseStripeMode] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cardError, setCardError] = useState('');

  const stripeAvailable = !!stripePromise;

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill || !paymentAmount) return;
    setSubmitting(true);
    setCardError('');

    try {
      let stripePaymentMethodId = null;

      if (useStripeMode) {
        if (!stripe || !elements) {
          setCardError('Stripe is not ready. Please wait and try again.');
          setSubmitting(false);
          return;
        }
        const cardElement = elements.getElement(CardElement);
        const { error, paymentMethod: pm } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });
        if (error) {
          setCardError(error.message);
          setSubmitting(false);
          return;
        }
        stripePaymentMethodId = pm.id;
      }

      const payload = {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
      };
      if (stripePaymentMethodId) {
        payload.stripe_payment_method_id = stripePaymentMethodId;
      }

      await api.post(`/api/bills/${selectedBill.id}/payments/`, payload);
      onSuccess(selectedBill.id);
    } catch (err) {
      const msg = err.response?.data?.error
        || (err.response?.data && JSON.stringify(err.response.data))
        || 'Failed to record payment';
      setCardError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">💳 Make Payment</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={submitPayment}>
            <div className="modal-body">

              {/* Mode banner */}
              {useStripeMode ? (
                <div className="alert alert-success py-2">
                  <strong>🔒 Stripe Active</strong> — your card will be charged in real time.
                </div>
              ) : (
                <div className="alert alert-warning py-2">
                  <small><strong>⚠ Demo Mode:</strong> No real charge will be made. Payment is recorded for tracking only.</small>
                </div>
              )}

              {/* Bill summary */}
              <div className="alert alert-info py-2">
                <strong>Bill:</strong> {selectedBill.bill_number}<br />
                <strong>Balance Due:</strong> ${parseFloat(selectedBill.balance_due).toFixed(2)}
              </div>

              {/* Amount */}
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
                <small className="text-muted">Max: ${parseFloat(selectedBill.balance_due).toFixed(2)}</small>
              </div>

              {/* Payment method selector buttons */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Payment Method</label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn flex-fill ${!useStripeMode ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => { setUseStripeMode(false); setCardError(''); }}
                  >
                    📋 Demo Payment
                  </button>
                  <button
                    type="button"
                    className={`btn flex-fill ${useStripeMode ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => {
                      if (!stripeAvailable) {
                        setCardError('Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to .env to enable.');
                        return;
                      }
                      setUseStripeMode(true);
                      setCardError('');
                    }}
                  >
                    🔒 Pay with Stripe
                  </button>
                </div>
              </div>

              {/* Stripe card entry */}
              {useStripeMode ? (
                <div className="mb-3">
                  <label className="form-label">Card Details</label>

                  {/* test card hint */}
                  <div className="alert alert-secondary py-2 mb-2">
                    <small>
                      <strong>Test card:</strong>{' '}
                      <code>4242 4242 4242 4242</code> &nbsp;|&nbsp;
                      Exp: <code>12/34</code> &nbsp;|&nbsp;
                      CVC: <code>123</code> &nbsp;|&nbsp;
                      ZIP: <code>00000</code>
                    </small>
                  </div>

                  <div
                    className="form-control"
                    style={{ padding: '10px 12px', minHeight: '42px' }}
                  >
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: 'var(--bs-body-color, #212529)',
                            '::placeholder': { color: '#aab7c4' },
                          },
                          invalid: { color: '#dc3545' },
                        },
                        hidePostalCode: false,
                      }}
                      onChange={(e) => {
                        setCardComplete(e.complete);
                        setCardError(e.error?.message || '');
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <label className="form-label">Demo Payment Method</label>
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
              )}

              {cardError && (
                <div className="alert alert-danger py-2">
                  <small>{cardError}</small>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || (useStripeMode && (!stripe || !cardComplete))}
              >
                {submitting
                  ? 'Processing...'
                  : useStripeMode
                    ? '🔒 Charge Card'
                    : 'Submit Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main Billing component, wrapped in Elements provider ──────────────────────
function BillingContent() {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const handlePaymentSuccess = async (billId) => {
    setShowPaymentModal(false);
    setSuccessMsg('Payment recorded successfully!');
    fetchBills();
    try {
      const response = await api.get(`/api/bills/${billId}/`);
      setSelectedBill(response.data);
    } catch { /* non-critical */ }
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
      <h1 className="mb-4">💰 Billing & Payments</h1>
      {successMsg && (
        <div className="alert alert-success alert-dismissible">
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')} />
        </div>
      )}

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
                      onClick={() => setShowPaymentModal(true)}
                    >
                      💳 Make Payment
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
        <PaymentModal
          selectedBill={selectedBill}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default function Billing() {
  return (
    <Elements stripe={stripePromise}>
      <BillingContent />
    </Elements>
  );
}
