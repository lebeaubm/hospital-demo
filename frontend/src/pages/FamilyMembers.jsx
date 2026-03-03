import { useEffect, useState } from 'react';
import { api } from '../api/client';

function FamilyMembers() {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    relationship: 'CHILD',
    can_view_appointments: true,
    can_manage_appointments: false,
    can_view_medical_records: false,
    can_view_messages: false,
  });

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      const response = await api.get('/family-members/');
      setFamilyMembers(response.data);
    } catch (err) {
      setError('Failed to load family members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      relationship: 'CHILD',
      can_view_appointments: true,
      can_manage_appointments: false,
      can_view_medical_records: false,
      can_view_messages: false,
    });
    setEditingMember(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingMember) {
        await api.patch(`/family-members/${editingMember.id}/`, formData);
        alert('Family member updated successfully!');
      } else {
        await api.post('/family-members/create/', formData);
        alert('Family member added successfully!');
      }
      fetchFamilyMembers();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save family member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      date_of_birth: member.date_of_birth || '',
      relationship: member.relationship,
      can_view_appointments: member.can_view_appointments,
      can_manage_appointments: member.can_manage_appointments,
      can_view_medical_records: member.can_view_medical_records,
      can_view_messages: member.can_view_messages,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this family member?')) return;

    try {
      await api.delete(`/family-members/${id}/`);
      alert('Family member removed successfully!');
      fetchFamilyMembers();
    } catch (err) {
      alert('Failed to remove family member');
    }
  };

  const getRelationshipBadge = (relationship) => {
    const badges = {
      SELF: 'primary',
      SPOUSE: 'info',
      CHILD: 'success',
      PARENT: 'warning',
      SIBLING: 'secondary',
      GUARDIAN: 'danger',
      OTHER: 'dark',
    };
    return badges[relationship] || 'secondary';
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>👨‍👩‍👧‍👦 Family Members</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          ➕ Add Family Member
        </button>
      </div>

      {familyMembers.length === 0 ? (
        <div className="alert alert-info">
          No family members added yet. Click "Add Family Member" to get started.
        </div>
      ) : (
        <div className="row">
          {familyMembers.map((member) => (
            <div key={member.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title mb-1">{member.full_name}</h5>
                      <span className={`badge bg-${getRelationshipBadge(member.relationship)}`}>
                        {member.relationship}
                      </span>
                      {member.member_email && (
                        <div className="mt-1">
                          <small className="text-muted">{member.member_email}</small>
                        </div>
                      )}
                    </div>
                    {!member.is_active && (
                      <span className="badge bg-secondary">Inactive</span>
                    )}
                  </div>

                  {member.date_of_birth && (
                    <p className="card-text">
                      <strong>Date of Birth:</strong>{' '}
                      {new Date(member.date_of_birth).toLocaleDateString()}
                      {member.age !== null && (
                        <span className="text-muted"> ({member.age} years old)</span>
                      )}
                    </p>
                  )}

                  <div className="border-top pt-3 mt-3">
                    <h6 className="mb-2">Access Permissions</h6>
                    <div className="small">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={member.can_view_appointments}
                          disabled
                          readOnly
                        />
                        <label className="form-check-label">View Appointments</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={member.can_manage_appointments}
                          disabled
                          readOnly
                        />
                        <label className="form-check-label">Manage Appointments</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={member.can_view_medical_records}
                          disabled
                          readOnly
                        />
                        <label className="form-check-label">View Medical Records</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={member.can_view_messages}
                          disabled
                          readOnly
                        />
                        <label className="form-check-label">View Messages</label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => handleEdit(member)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(member.id)}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingMember ? 'Edit Family Member' : 'Add Family Member'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Relationship *</label>
                      <select
                        className="form-select"
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="SPOUSE">Spouse/Partner</option>
                        <option value="CHILD">Child</option>
                        <option value="PARENT">Parent</option>
                        <option value="SIBLING">Sibling</option>
                        <option value="GUARDIAN">Legal Guardian</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-top pt-3 mt-3">
                    <h6 className="mb-3">Access Permissions</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="can_view_appointments"
                            name="can_view_appointments"
                            checked={formData.can_view_appointments}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label" htmlFor="can_view_appointments">
                            View Appointments
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="can_manage_appointments"
                            name="can_manage_appointments"
                            checked={formData.can_manage_appointments}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label" htmlFor="can_manage_appointments">
                            Manage Appointments
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="can_view_medical_records"
                            name="can_view_medical_records"
                            checked={formData.can_view_medical_records}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label" htmlFor="can_view_medical_records">
                            View Medical Records
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="can_view_messages"
                            name="can_view_messages"
                            checked={formData.can_view_messages}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label" htmlFor="can_view_messages">
                            View Messages
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editingMember ? 'Update' : 'Add Member'}
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

export default FamilyMembers;
