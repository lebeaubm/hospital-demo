import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function Prescriptions() {
  const [prescriptions, setprescriptions] = useState([]);
  const [refills, setRefills] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active, refills
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [refillLoading, setRefillLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrescriptions();
    fetchRefills();
    fetchPharmacies();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get('/prescriptions/me/');
      setPrescriptions(response.data);
    } catch (err) {
      setError('Failed to load prescriptions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefills = async () => {
    try {
      const response = await api.get('/prescriptions/refills/me/');
      setRefills(response.data);
    } catch (err) {
      console.error('Failed to load refills:', err);
    }
  };

  const fetchPharmacies = async () => {
    try {
      const response = await api.get('/pharmacies/');
      setPharmacies(response.data);
      if (response.data.length > 0) {
        setSelectedPharmacy(response.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load pharmacies:', err);
    }
  };

  const requestRefill = async (prescriptionId) => {
    if (!selectedPharmacy) {
      alert('Please select a pharmacy');
      return;
    }

    setRefillLoading({ ...refillLoading, [prescriptionId]: true });

    try {
      await api.post(`/prescriptions/${prescriptionId}/refill/`, {
        pharmacy: selectedPharmacy,
      });
      alert('Refill request submitted successfully!');
      fetchPrescriptions();
      fetchRefills();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request refill');
    } finally {
      setRefillLoading({ ...refillLoading, [prescriptionId]: false });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'success',
      PENDING: 'warning',
      EXPIRED: 'danger',
      DISCONTINUED: 'secondary',
      REFILL_REQUESTED: 'info',
    };
    return badges[status] || 'secondary';
  };

  const getRefillStatusBadge = (status) => {
    const badges = {
      REQUESTED: 'warning',
      APPROVED: 'info',
      FILLED: 'success',
      DENIED: 'danger',
      CANCELED: 'secondary',
    };
    return badges[status] || 'secondary';
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

  const activePrescriptions = prescriptions.filter((rx) => rx.status === 'ACTIVE');

  return (
    <div className="container mt-4">
      <h1 className="mb-4">💊 My Prescriptions</h1>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Prescriptions ({activePrescriptions.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'refills' ? 'active' : ''}`}
            onClick={() => setActiveTab('refills')}
          >
            Refill Requests ({refills.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Prescriptions ({prescriptions.length})
          </button>
        </li>
      </ul>

      {/* Active Prescriptions Tab */}
      {activeTab === 'active' && (
        <div>
          {activePrescriptions.length === 0 ? (
            <div className="alert alert-info">No active prescriptions</div>
          ) : (
            <div className="row">
              {activePrescriptions.map((rx) => (
                <div key={rx.id} className="col-md-6 mb-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">{rx.medication_name}</h5>
                        <span className={`badge bg-${getStatusBadge(rx.status)}`}>
                          {rx.status}
                        </span>
                      </div>
                      
                      <p className="card-text">
                        <strong>Dosage:</strong> {rx.dosage}<br />
                        <strong>Quantity:</strong> {rx.quantity}<br />
                        <strong>Instructions:</strong> {rx.instructions}
                      </p>

                      <div className="border-top pt-3 mt-3">
                        <div className="mb-2">
                          <strong>Refills Remaining:</strong>{' '}
                          <span className="badge bg-primary">{rx.refills_remaining}</span> of {rx.refills_allowed}
                        </div>
                        
                        {rx.pharmacy_name && (
                          <p className="mb-2 text-muted">
                            <small>📍 {rx.pharmacy_name}</small>
                          </p>
                        )}

                        {rx.prescribed_by_name && (
                          <p className="mb-2 text-muted">
                            <small>👨‍⚕️ Prescribed by: {rx.prescribed_by_name}</small>
                          </p>
                        )}

                        {rx.expiration_date && (
                          <p className="mb-2 text-muted">
                            <small>📅 Expires: {new Date(rx.expiration_date).toLocaleDateString()}</small>
                          </p>
                        )}
                      </div>

                      {rx.can_refill && (
                        <div className="border-top pt-3 mt-3">
                          <div className="mb-2">
                            <label className="form-label">Select Pharmacy:</label>
                            <select
                              className="form-select form-select-sm"
                              value={selectedPharmacy}
                              onChange={(e) => setSelectedPharmacy(e.target.value)}
                            >
                              {pharmacies.map((pharmacy) => (
                                <option key={pharmacy.id} value={pharmacy.id}>
                                  {pharmacy.name} - {pharmacy.city}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <button
                            className="btn btn-primary btn-sm w-100"
                            onClick={() => requestRefill(rx.id)}
                            disabled={refillLoading[rx.id]}
                          >
                            {refillLoading[rx.id] ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Requesting...
                              </>
                            ) : (
                              '🔄 Request Refill'
                            )}
                          </button>
                        </div>
                      )}

                      {!rx.can_refill && rx.refills_remaining === 0 && (
                        <div className="alert alert-warning mt-3 mb-0">
                          No refills remaining. Contact your doctor.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Refill Requests Tab */}
      {activeTab === 'refills' && (
        <div>
          {refills.length === 0 ? (
            <div className="alert alert-info">No refill requests</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Pharmacy</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th>Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {refills.map((refill) => (
                    <tr key={refill.id}>
                      <td>{refill.medication_name}</td>
                      <td>{refill.dosage}</td>
                      <td>{refill.pharmacy_name}</td>
                      <td>{new Date(refill.requested_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge bg-${getRefillStatusBadge(refill.status)}`}>
                          {refill.status}
                        </span>
                      </td>
                      <td>
                        {refill.processed_at ? (
                          <>
                            {new Date(refill.processed_at).toLocaleDateString()}
                            {refill.processed_by_name && (
                              <><br /><small>by {refill.processed_by_name}</small></>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Prescriptions Tab */}
      {activeTab === 'all' && (
        <div>
          {prescriptions.length === 0 ? (
            <div className="alert alert-info">No prescriptions</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Quantity</th>
                    <th>Refills</th>
                    <th>Status</th>
                    <th>Prescribed</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx) => (
                    <tr key={rx.id}>
                      <td>
                        <strong>{rx.medication_name}</strong>
                      </td>
                      <td>{rx.dosage}</td>
                      <td>{rx.quantity}</td>
                      <td>{rx.refills_remaining} / {rx.refills_allowed}</td>
                      <td>
                        <span className={`badge bg-${getStatusBadge(rx.status)}`}>
                          {rx.status}
                        </span>
                      </td>
                      <td>{new Date(rx.prescribed_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Prescriptions;
