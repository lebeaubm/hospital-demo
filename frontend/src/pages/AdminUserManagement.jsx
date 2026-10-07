import ScrollableTable from '../components/ScrollableTable'
import PageHeader from '../components/PageHeader'
import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export default function AdminUserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(null) // user id being updated
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/admin/users/')
      setUsers(data)
      setError(null)
    } catch (err) {
      const status = err.response?.status
      if (status === 403) {
        setError('Access denied (403). Your account does not have admin privileges.')
      } else if (status === 401) {
        setError('Not authenticated (401). Please log out and log back in.')
      } else if (!err.response) {
        setError('Cannot reach the backend server. Make sure it is running on http://127.0.0.1:8000.')
      } else {
        setError(`Error ${status}: ${err.response?.data?.detail || err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId)
    try {
      const { data } = await api.patch(`/api/admin/users/${userId}/role/`, { role: newRole })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.role } : u)))
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update role.'
      alert(msg)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  const roleBadge = (role) => {
    if (role === 'STAFF') return <span className="badge bg-success">Staff</span>
    if (role === 'OWNER') return <span className="badge bg-info text-dark">Owner</span>
    if (role === 'PATIENT') return <span className="badge bg-primary">Patient</span>
    return <span className="badge bg-secondary">{role}</span>
  }

  const roleButton = (user, role, label, variant) => (
    <button
      className={`btn btn-sm btn-outline-${variant}`}
      onClick={() => handleRoleChange(user.id, role)}
      disabled={updating === user.id}
    >
      {updating === user.id ? <span className="spinner-border spinner-border-sm me-1" /> : null}
      {label}
    </button>
  )

  if (loading) {
    return (
      <div className="py-4">
        <PageHeader title="User Management" description="Review accounts and manage patient, staff, and owner access." eyebrow="Administration" />
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading users…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <PageHeader title="User Management" description="Review accounts and manage patient, staff, and owner access." eyebrow="Administration" />
        <div className="alert alert-danger">{error}</div>
      </div>
    )
  }

  const staffCount = users.filter((u) => u.role === 'STAFF').length
  const ownerCount = users.filter((u) => u.role === 'OWNER').length
  const patientCount = users.filter((u) => u.role === 'PATIENT').length

  return (
    <div className="py-4">
      <PageHeader title="User Management" description="Review accounts and manage patient, staff, and owner access." eyebrow="Administration" />
      <p className="text-muted mb-3">
        Assign patient, staff, or owner access.
        Admin accounts are not shown here.
      </p>

      {/* Summary badges */}
      <div className="d-flex gap-3 mb-4">
        <span className="badge bg-primary fs-6 px-3 py-2">
          {patientCount} Patient{patientCount !== 1 ? 's' : ''}
        </span>
        <span className="badge bg-success fs-6 px-3 py-2">
          {staffCount} Staff member{staffCount !== 1 ? 's' : ''}
        </span>
        <span className="badge bg-info text-dark fs-6 px-3 py-2">
          {ownerCount} Owner{ownerCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search */}
      <div className="mb-3" style={{ maxWidth: '400px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by name, email, or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">No users match your search.</p>
      ) : (
        <ScrollableTable className="table-responsive" label="Admin User Management table">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Current Role</th>
                <th className="text-end" scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || '—'
                return (
                  <tr key={user.id}>
                    <td>{name}</td>
                    <td className="text-muted small">{user.email}</td>
                    <td>{roleBadge(user.role)}</td>
                    <td className="text-end">
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        {user.role === 'PATIENT' && (
                          <>
                            {roleButton(user, 'STAFF', 'Promote to Staff', 'success')}
                            {roleButton(user, 'OWNER', 'Promote to Owner', 'info')}
                          </>
                        )}
                        {user.role === 'STAFF' && (
                          <>
                            {roleButton(user, 'OWNER', 'Promote to Owner', 'info')}
                            {roleButton(user, 'PATIENT', 'Demote to Patient', 'warning')}
                          </>
                        )}
                        {user.role === 'OWNER' && (
                          <>
                            {roleButton(user, 'STAFF', 'Demote to Staff', 'success')}
                            {roleButton(user, 'PATIENT', 'Demote to Patient', 'warning')}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollableTable>
      )}
    </div>
  )
}
