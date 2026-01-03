import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Loading from '../components/Loading'
import ErrorAlert from '../components/ErrorAlert'

function StaffPatientRecord() {
  const { patientId } = useParams()
  const navigate = useNavigate()

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Note form state
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteFormData, setNoteFormData] = useState({
    note_type: 'GENERAL',
    content: '',
    visibility: 'STAFF_ONLY',
  })
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteError, setNoteError] = useState(null)

  // Document upload state
  const [showDocForm, setShowDocForm] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError] = useState(null)

  // Success messages
  const [successMsg, setSuccessMsg] = useState(null)

  // Document preview state
  const [previewDocument, setPreviewDocument] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    loadRecord()
  }, [patientId])

  const loadRecord = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/staff/patients/${patientId}/record/`)
      setRecord(response.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load patient record')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    try {
      setNoteSubmitting(true)
      setNoteError(null)

      await api.post(`/api/staff/patients/${patientId}/notes/`, noteFormData)

      setSuccessMsg('Note added successfully')
      setTimeout(() => setSuccessMsg(null), 3000)

      // Reset form and reload
      setNoteFormData({ note_type: 'GENERAL', content: '', visibility: 'STAFF_ONLY' })
      setShowNoteForm(false)
      await loadRecord()
    } catch (err) {
      setNoteError(err.response?.data?.error || 'Failed to add note')
    } finally {
      setNoteSubmitting(false)
    }
  }

  const handleToggleNoteVisibility = async (noteId, currentVisibility) => {
    const newVisibility =
      currentVisibility === 'STAFF_ONLY' ? 'SHARED_WITH_PATIENT' : 'STAFF_ONLY'

    const confirmMsg =
      newVisibility === 'SHARED_WITH_PATIENT'
        ? 'Share this note with the patient?'
        : 'Hide this note from the patient?'

    if (!confirm(confirmMsg)) return

    try {
      await api.patch(`/api/staff/notes/${noteId}/`, {
        visibility: newVisibility,
      })

      setSuccessMsg(
        newVisibility === 'SHARED_WITH_PATIENT'
          ? 'Note shared with patient'
          : 'Note hidden from patient'
      )
      setTimeout(() => setSuccessMsg(null), 3000)

      await loadRecord()
    } catch (err) {
      alert('Failed to update note visibility')
    }
  }

  const handleUploadDocument = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    try {
      setDocUploading(true)
      setDocError(null)

      await api.post(`/api/staff/patients/${patientId}/documents/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSuccessMsg('Document uploaded successfully')
      setTimeout(() => setSuccessMsg(null), 3000)

      e.target.reset()
      setShowDocForm(false)
      await loadRecord()
    } catch (err) {
      setDocError(
        err.response?.data?.file?.[0] || err.response?.data?.error || 'Failed to upload document'
      )
    } finally {
      setDocUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId, documentName) => {
    if (!confirm(`Delete document "${documentName}"? This cannot be undone.`)) return

    try {
      await api.delete(`/api/staff/documents/${documentId}/`)

      setSuccessMsg('Document deleted successfully')
      setTimeout(() => setSuccessMsg(null), 3000)

      await loadRecord()
    } catch (err) {
      alert('Failed to delete document')
    }
  }

  const handleDownload = async (documentId, originalName) => {
    try {
      const response = await api.get(`/api/documents/${documentId}/download/`, {
        responseType: 'blob',
      })

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

  const handleUpdateSummary = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    try {
      await api.patch(`/api/staff/patients/${patientId}/record/`, {
        history_text: formData.get('history_text'),
        allergies_text: formData.get('allergies_text'),
        medications_text: formData.get('medications_text'),
      })

      setSuccessMsg('Record summary updated successfully')
      setTimeout(() => setSuccessMsg(null), 3000)

      await loadRecord()
    } catch (err) {
      alert('Failed to update record summary')
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
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

  if (loading) return <Loading />
  if (error) return <ErrorAlert message={error} />

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Patient Medical Record</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/staff/dashboard')}>
          Back to Dashboard
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMsg}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMsg(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Patient Info */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Patient Information</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <strong>Patient:</strong>
              <p className="mb-0">{record.patient_name}</p>
              <p className="text-muted small">{record.patient_email}</p>
            </div>
            <div className="col-md-4">
              <strong>Record Created:</strong>
              <p className="mb-0">{formatDate(record.created_at)}</p>
            </div>
            <div className="col-md-4">
              <strong>Last Updated:</strong>
              <p className="mb-0">{formatDate(record.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Record Summary */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Medical Record Summary</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleUpdateSummary}>
            <div className="mb-3">
              <label htmlFor="history_text" className="form-label">
                Medical History
              </label>
              <textarea
                className="form-control"
                id="history_text"
                name="history_text"
                rows="3"
                defaultValue={record.history_text}
              ></textarea>
            </div>

            <div className="mb-3">
              <label htmlFor="allergies_text" className="form-label">
                Known Allergies
              </label>
              <textarea
                className="form-control"
                id="allergies_text"
                name="allergies_text"
                rows="2"
                defaultValue={record.allergies_text}
              ></textarea>
            </div>

            <div className="mb-3">
              <label htmlFor="medications_text" className="form-label">
                Current Medications
              </label>
              <textarea
                className="form-control"
                id="medications_text"
                name="medications_text"
                rows="2"
                defaultValue={record.medications_text}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">
              Update Summary
            </button>
          </form>
        </div>
      </div>

      {/* Notes Section */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Medical Notes ({record.notes?.length || 0})</h5>
          <button
            className="btn btn-sm btn-success"
            onClick={() => setShowNoteForm(!showNoteForm)}
          >
            {showNoteForm ? 'Cancel' : '+ Add Note'}
          </button>
        </div>
        <div className="card-body">
          {showNoteForm && (
            <div className="border rounded p-3 mb-3 bg-light">
              <h6>Add New Note</h6>
              {noteError && <ErrorAlert message={noteError} />}

              <form onSubmit={handleAddNote}>
                <div className="mb-3">
                  <label htmlFor="note_type" className="form-label">
                    Note Type
                  </label>
                  <select
                    className="form-select"
                    id="note_type"
                    value={noteFormData.note_type}
                    onChange={(e) =>
                      setNoteFormData({ ...noteFormData, note_type: e.target.value })
                    }
                    required
                  >
                    <option value="VISIT">Visit Note</option>
                    <option value="LAB">Lab Result</option>
                    <option value="PRESCRIPTION">Prescription</option>
                    <option value="GENERAL">General Note</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="content" className="form-label">
                    Note Content
                  </label>
                  <textarea
                    className="form-control"
                    id="content"
                    rows="4"
                    value={noteFormData.content}
                    onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label htmlFor="visibility" className="form-label">
                    Visibility
                  </label>
                  <select
                    className="form-select"
                    id="visibility"
                    value={noteFormData.visibility}
                    onChange={(e) =>
                      setNoteFormData({ ...noteFormData, visibility: e.target.value })
                    }
                  >
                    <option value="STAFF_ONLY">Staff Only (Hidden from patient)</option>
                    <option value="SHARED_WITH_PATIENT">Shared with Patient</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" disabled={noteSubmitting}>
                  {noteSubmitting ? 'Adding...' : 'Add Note'}
                </button>
              </form>
            </div>
          )}

          {record.notes && record.notes.length > 0 ? (
            <div className="list-group">
              {record.notes.map((note) => (
                <div key={note.id} className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">
                      <span className="badge bg-info me-2">{note.note_type}</span>
                      {note.author_name}
                      {note.visibility === 'STAFF_ONLY' ? (
                        <span className="badge bg-warning text-dark ms-2">Staff Only</span>
                      ) : (
                        <span className="badge bg-success ms-2">Shared with Patient</span>
                      )}
                    </h6>
                    <small className="text-muted">{formatDate(note.created_at)}</small>
                  </div>
                  <p className="mb-2">{note.content}</p>
                  {note.shared_at && (
                    <p className="mb-2 small text-muted">
                      Shared by {note.shared_by_name} on {formatDate(note.shared_at)}
                    </p>
                  )}
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleToggleNoteVisibility(note.id, note.visibility)}
                  >
                    {note.visibility === 'STAFF_ONLY' ? '👁️ Share with Patient' : '🚫 Hide from Patient'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0">No notes recorded yet.</p>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Medical Documents ({record.documents?.length || 0})</h5>
          <button
            className="btn btn-sm btn-success"
            onClick={() => setShowDocForm(!showDocForm)}
          >
            {showDocForm ? 'Cancel' : '+ Upload Document'}
          </button>
        </div>
        <div className="card-body">
          {showDocForm && (
            <div className="border rounded p-3 mb-3 bg-light">
              <h6>Upload New Document</h6>
              {docError && <ErrorAlert message={docError} />}

              <form onSubmit={handleUploadDocument}>
                <div className="mb-3">
                  <label htmlFor="doc_category" className="form-label">
                    Category
                  </label>
                  <select className="form-select" id="doc_category" name="category" required>
                    <option value="LAB_RESULT">Lab Result</option>
                    <option value="PRESCRIPTION">Prescription</option>
                    <option value="IMAGING">Imaging</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="doc_visibility" className="form-label">
                    Visibility
                  </label>
                  <select
                    className="form-select"
                    id="doc_visibility"
                    name="visibility"
                    defaultValue="STAFF_ONLY"
                  >
                    <option value="STAFF_ONLY">Staff Only (Hidden from patient)</option>
                    <option value="PATIENT_AND_STAFF">Patient and Staff</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="doc_file" className="form-label">
                    Select File
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="doc_file"
                    name="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    required
                  />
                  <small className="text-muted">Max 10MB. Formats: PDF, PNG, JPG</small>
                </div>

                <button type="submit" className="btn btn-primary" disabled={docUploading}>
                  {docUploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>
          )}

          {record.documents && record.documents.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Category</th>
                    <th>Visibility</th>
                    <th>Size</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {record.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.original_name}</td>
                      <td>
                        <span className="badge bg-secondary">{doc.category}</span>
                      </td>
                      <td>
                        {doc.visibility === 'STAFF_ONLY' ? (
                          <span className="badge bg-warning text-dark">Staff Only</span>
                        ) : (
                          <span className="badge bg-success">Patient & Staff</span>
                        )}
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
                          👁️ View
                        </button>
                        <button
                          className="btn btn-sm btn-primary me-1"
                          onClick={() => handleDownload(doc.id, doc.original_name)}
                        >
                          ⬇️ Download
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteDocument(doc.id, doc.original_name)}
                        >
                          🗑️ Delete
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
                  className="btn btn-primary me-2"
                  onClick={() => handleDownload(previewDocument.id, previewDocument.original_name)}
                >
                  ⬇️ Download
                </button>
                <button
                  className="btn btn-danger me-2"
                  onClick={() => {
                    closePreview()
                    handleDeleteDocument(previewDocument.id, previewDocument.original_name)
                  }}
                >
                  🗑️ Delete
                </button>
                <button className="btn btn-secondary" onClick={closePreview}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}    </div>
  )
}

export default StaffPatientRecord
