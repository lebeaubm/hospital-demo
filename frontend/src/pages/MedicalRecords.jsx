import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { SkeletonList } from '../components/SkeletonLoader'
import ErrorAlert from '../components/ErrorAlert'

function MedicalRecords() {
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    loadRecord()
  }, [])

  const loadRecord = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/records/me/')
      setRecord(response.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load medical record')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    try {
      setUploading(true)
      setUploadError(null)
      setUploadSuccess(false)

      await api.post('/api/records/me/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadSuccess(true)
      e.target.reset()
      // Reload record to show new document
      await loadRecord()

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err) {
      setUploadError(
        err.response?.data?.file?.[0] ||
          err.response?.data?.error ||
          'Failed to upload document'
      )
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (documentId, originalName) => {
    try {
      const response = await api.get(`/api/documents/${documentId}/download/`, {
        responseType: 'blob',
      })

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', originalName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download document')
    }
  }

  const handlePreview = async (doc) => {
    try {
      setPreviewLoading(true)
      const response = await api.get(`/api/documents/${doc.id}/download/`, {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data], { type: doc.mime_type }))
      setPreviewDocument({
        ...doc,
        url,
      })
    } catch (err) {
      alert('Failed to preview document')
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    if (previewDocument?.url) {
      window.URL.revokeObjectURL(previewDocument.url)
    }
    setPreviewDocument(null)
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) return (
    <div className="container my-4">
      <h2 className="mb-4">My Medical Records</h2>
      <SkeletonList />
    </div>
  )
  if (error) return <ErrorAlert message={error} />

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Medical Records</h2>

      {/* Record Summary */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Medical Record Summary</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <strong>Patient:</strong>
              <p className="mb-0">{record.patient_name}</p>
              <p className="text-muted small">{record.patient_email}</p>
            </div>
            <div className="col-md-4 mb-3">
              <strong>Created:</strong>
              <p className="mb-0">{formatDate(record.created_at)}</p>
            </div>
            <div className="col-md-4 mb-3">
              <strong>Last Updated:</strong>
              <p className="mb-0">{formatDate(record.updated_at)}</p>
            </div>
          </div>

          {record.history_text && (
            <div className="mb-3">
              <strong>Medical History:</strong>
              <p className="mb-0">{record.history_text}</p>
            </div>
          )}

          {record.allergies_text && (
            <div className="mb-3">
              <strong>Allergies:</strong>
              <p className="mb-0">{record.allergies_text}</p>
            </div>
          )}

          {record.medications_text && (
            <div className="mb-3">
              <strong>Current Medications:</strong>
              <p className="mb-0">{record.medications_text}</p>
            </div>
          )}

          {!record.history_text && !record.allergies_text && !record.medications_text && (
            <p className="text-muted mb-0">
              No medical history information recorded yet. Your healthcare provider will update this
              during appointments.
            </p>
          )}
        </div>
      </div>

      {/* Shared Notes from Staff */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Notes from Healthcare Providers</h5>
        </div>
        <div className="card-body">
          {record.notes && record.notes.length > 0 ? (
            <div className="list-group">
              {record.notes.map((note) => (
                <div key={note.id} className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">
                      <span className="badge bg-info me-2">{note.note_type}</span>
                      {note.author_name}
                    </h6>
                    <small className="text-muted">{formatDate(note.created_at)}</small>
                  </div>
                  <p className="mb-1">{note.content}</p>
                  {note.shared_at && (
                    <small className="text-muted">
                      Shared by {note.shared_by_name} on {formatDate(note.shared_at)}
                    </small>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0">
              No notes have been shared with you yet. Your healthcare provider may add notes during
              appointments.
            </p>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Medical Documents</h5>
        </div>
        <div className="card-body">
          {record.documents && record.documents.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {record.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.original_name}</td>
                      <td>
                        <span className="badge bg-secondary">{doc.category}</span>
                      </td>
                      <td>{formatBytes(doc.size_bytes)}</td>
                      <td>{doc.uploaded_by_name}</td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-1"
                          onClick={() => handlePreview(doc)}
                          disabled={previewLoading}
                        >
                           View
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleDownload(doc.id, doc.original_name)}
                        >
                           Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted mb-0">No documents uploaded yet.</p>
          )}
        </div>
      </div>

      {/* Upload Document */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Upload Document</h5>
        </div>
        <div className="card-body">
          <p className="text-muted">
            You can upload medical documents such as lab results, prescriptions, or other medical
            records. Accepted formats: PDF, PNG, JPG (max 10MB)
          </p>

          {uploadSuccess && (
            <div className="alert alert-success" role="alert">
              Document uploaded successfully!
            </div>
          )}

          {uploadError && <ErrorAlert message={uploadError} />}

          <form onSubmit={handleFileUpload}>
            <div className="mb-3">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <select className="form-select" id="category" name="category" required>
                <option value="LAB_RESULT">Lab Result</option>
                <option value="PRESCRIPTION">Prescription</option>
                <option value="IMAGING">Imaging</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="file" className="form-label">
                Select File
              </label>
              <input
                type="file"
                className="form-control"
                id="file"
                name="file"
                accept=".pdf,.png,.jpg,.jpeg"
                required
              />
              <small className="text-muted">Max file size: 10MB. Formats: PDF, PNG, JPG</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </button>
          </form>

          <div className="alert alert-info mt-3" role="alert">
            <strong>Note:</strong> You cannot delete documents after uploading. If you need a
            document removed, please contact your healthcare provider.
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closePreview}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{previewDocument.original_name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closePreview}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '80vh', overflow: 'auto' }}>
                {previewDocument.mime_type === 'application/pdf' ? (
                  <iframe
                    src={previewDocument.url}
                    style={{ width: '100%', height: '70vh', border: 'none' }}
                    title={previewDocument.original_name}
                  />
                ) : previewDocument.mime_type.startsWith('image/') ? (
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.original_name}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : (
                  <div className="alert alert-info">
                    Preview not available for this file type. Please download to view.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(previewDocument.id, previewDocument.original_name)}
                >
                   Download
                </button>
                <button className="btn btn-secondary" onClick={closePreview}>
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

export default MedicalRecords
