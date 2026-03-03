import { useEffect, useState } from 'react';
import { api } from '../api/client';

function LabResults() {
  const [labOrders, setLabOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLabOrders();
  }, []);

  const fetchLabOrders = async () => {
    try {
      const response = await api.get('/lab-orders/me/');
      setLabOrders(response.data);
    } catch (err) {
      setError('Failed to load lab results');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ORDERED: 'secondary',
      COLLECTED: 'info',
      IN_PROGRESS: 'warning',
      COMPLETED: 'success',
      CANCELED: 'danger',
    };
    return badges[status] || 'secondary';
  };

  const getResultStatusBadge = (status) => {
    const badges = {
      PRELIMINARY: 'warning',
      FINAL: 'success',
      AMENDED: 'info',
    };
    return badges[status] || 'secondary';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      ROUTINE: 'secondary',
      URGENT: 'warning',
      STAT: 'danger',
    };
    return badges[priority] || 'secondary';
  };

  const renderResultValue = (value) => {
    return (
      <tr key={value.id} className={value.is_abnormal ? 'table-warning' : ''}>
        <td>
          {value.parameter_name}
          {value.is_abnormal && (
            <span className="badge bg-warning ms-2">Abnormal</span>
          )}
        </td>
        <td>
          <strong>{value.value}</strong>
        </td>
        <td>{value.unit}</td>
        <td>{value.reference_range}</td>
        <td>
          {value.flag && (
            <span className={`badge bg-${value.flag === 'HIGH' || value.flag === 'LOW' ? 'warning' : 'danger'}`}>
              {value.flag}
            </span>
          )}
        </td>
      </tr>
    );
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

  return (
    <div className="container mt-4">
      <h1 className="mb-4">🔬 Lab Results</h1>

      {labOrders.length === 0 ? (
        <div className="alert alert-info">No lab orders found</div>
      ) : (
        <div className="row">
          {/* Lab Orders List */}
          <div className="col-md-4">
            <div className="list-group">
              {labOrders.map((order) => (
                <button
                  key={order.id}
                  className={`list-group-item list-group-item-action ${
                    selectedOrder?.id === order.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">{order.test_name}</h6>
                    <span className={`badge bg-${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <p className="mb-1 small">
                    <span className={`badge bg-${getPriorityBadge(order.priority)}`}>
                      {order.priority}
                    </span>
                    {' '}
                    <span className="badge bg-secondary">
                      {order.test_category}
                    </span>
                  </p>
                  
                  <small className="text-muted">
                    Ordered: {new Date(order.ordered_date).toLocaleDateString()}
                    {order.collection_date && (
                      <><br />Collected: {new Date(order.collection_date).toLocaleDateString()}</>
                    )}
                  </small>
                  
                  {order.has_result && (
                    <div className="mt-2">
                      <span className="badge bg-success">✓ Results Available</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Lab Order Details */}
          <div className="col-md-8">
            {selectedOrder ? (
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">{selectedOrder.test_name}</h5>
                </div>
                
                <div className="card-body">
                  {/* Order Information */}
                  <div className="mb-4">
                    <h6>Order Information</h6>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th style={{ width: '35%' }}>Status:</th>
                          <td>
                            <span className={`badge bg-${getStatusBadge(selectedOrder.status)}`}>
                              {selectedOrder.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Priority:</th>
                          <td>
                            <span className={`badge bg-${getPriorityBadge(selectedOrder.priority)}`}>
                              {selectedOrder.priority}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Category:</th>
                          <td>{selectedOrder.test_category}</td>
                        </tr>
                        <tr>
                          <th>Ordered Date:</th>
                          <td>{new Date(selectedOrder.ordered_date).toLocaleDateString()}</td>
                        </tr>
                        {selectedOrder.collection_date && (
                          <tr>
                            <th>Collection Date:</th>
                            <td>{new Date(selectedOrder.collection_date).toLocaleDateString()}</td>
                          </tr>
                        )}
                        {selectedOrder.ordered_by_name && (
                          <tr>
                            <th>Ordered By:</th>
                            <td>{selectedOrder.ordered_by_name}</td>
                          </tr>
                        )}
                        {selectedOrder.notes && (
                          <tr>
                            <th>Notes:</th>
                            <td>{selectedOrder.notes}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Results */}
                  {selectedOrder.result ? (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6>Test Results</h6>
                        <span className={`badge bg-${getResultStatusBadge(selectedOrder.result.status)}`}>
                          {selectedOrder.result.status}
                        </span>
                      </div>

                      {selectedOrder.result.is_critical && (
                        <div className="alert alert-danger">
                          <strong>⚠️ Critical Result</strong><br />
                          This result requires immediate attention. Contact your healthcare provider.
                        </div>
                      )}

                      <p className="text-muted">
                        <small>
                          Result Date: {new Date(selectedOrder.result.result_date).toLocaleDateString()}
                          {selectedOrder.result.reviewed_by_name && (
                            <><br />Reviewed by: {selectedOrder.result.reviewed_by_name}</>
                          )}
                        </small>
                      </p>

                      {selectedOrder.result.interpretation && (
                        <div className="alert alert-info">
                          <strong>Doctor's Interpretation:</strong>
                          <p className="mb-0 mt-2">{selectedOrder.result.interpretation}</p>
                        </div>
                      )}

                      {selectedOrder.result.values && selectedOrder.result.values.length > 0 && (
                        <div className="table-responsive mt-3">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Parameter</th>
                                <th>Value</th>
                                <th>Unit</th>
                                <th>Reference Range</th>
                                <th>Flag</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrder.result.values.map((value) => renderResultValue(value))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {selectedOrder.result.pdf_report && (
                        <div className="mt-3">
                          <a
                            href={selectedOrder.result.pdf_report}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                          >
                            📄 Download PDF Report
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      {selectedOrder.status === 'COMPLETED' 
                        ? 'Results are being processed'
                        : 'Results not yet available'
                      }
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                Select a lab order to view details and results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LabResults;
