import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

export default function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/admin/applications/')
      setApplications(data)
      setError(null)
    } catch (err) {
      const status = err.response?.status
      if (status === 403) {
        setError('Access denied (403). Admin access is required.')
      } else if (status === 401) {
        setError('Not authenticated (401). Please log in again.')
      } else if (!err.response) {
        setError('Cannot reach backend server. Make sure it is running on http://127.0.0.1:8000.')
      } else {
        setError(`Error ${status}: ${err.response?.data?.detail || err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleDelete = async (applicationId) => {
    if (!window.confirm('Delete this application? This action cannot be undone.')) {
      return
    }

    setDeletingId(applicationId)
    try {
      await api.delete(`/api/admin/applications/${applicationId}/`)
      setApplications((prev) => prev.filter((item) => item.id !== applicationId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete application.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="py-4">
        <h1 className="mb-3">Career Applications</h1>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading applications…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <h1 className="mb-3">Career Applications</h1>
        <div className="alert alert-danger">{error}</div>
      </div>
    )
  }

  const filteredApplications = applications.filter((application) => {
    const query = search.toLowerCase().trim()
    if (!query) return true

    return (
      application.full_name.toLowerCase().includes(query) ||
      application.email.toLowerCase().includes(query) ||
      application.position.toLowerCase().includes(query)
    )
  })

  return (
    <div className="py-4">
      <h1 className="mb-3">Career Applications</h1>
      <div className="mb-3" style={{ maxWidth: '420px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by name, email, or position..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filteredApplications.length === 0 ? (
        <div className="alert alert-info mb-0">No applications submitted yet.</div>
      ) : (
        <div className="row g-3">
          {filteredApplications.map((application) => {
            const createdDate = new Date(application.created_at).toLocaleString()
            return (
              <div className="col-12" key={application.id}>
                <div className="card shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h2 className="h5 mb-1">{application.full_name}</h2>
                        <p className="text-muted mb-0">Applied for: {application.position}</p>
                      </div>
                      <span className="badge bg-secondary">{createdDate}</span>
                    </div>

                    <p className="mb-1"><strong>Email:</strong> {application.email}</p>
                    <p className="mb-2"><strong>Phone:</strong> {application.phone_number || '—'}</p>
                    <p className="mb-3"><strong>Cover Letter:</strong> {application.cover_letter || '—'}</p>

                    <div className="d-flex gap-2">
                      <a
                        href={application.resume_download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        Download Resume
                      </a>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(application.id)}
                        disabled={deletingId === application.id}
                      >
                        {deletingId === application.id ? 'Deleting…' : 'Delete Application'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
