import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import './AdminApplications.css'

const statuses = [
  ['NEW', 'New'],
  ['REVIEWING', 'Reviewing'],
  ['INTERVIEW', 'Interview'],
  ['OFFER', 'Offer'],
  ['HIRED', 'Hired'],
  ['NOT_SELECTED', 'Not Selected'],
]

const sectionNames = {
  personal: 'Personal Information',
  availability: 'Availability',
  employment_eligibility: 'Employment Eligibility',
  education: 'Education',
  employers: 'Previous Employment',
  references: 'Professional References',
  additional: 'Additional Information',
  certification: 'Certification',
}

const pageSize = 20

function isPdfResume(application) {
  return /\.pdf$/i.test(application.resume_original_filename || '')
}

function applicantName(application) {
  return application.full_name?.trim() || 'Blank demo application'
}

function humanize(value) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function AnswerList({ value }) {
  if (Array.isArray(value)) {
    if (value.every((item) => item === null || typeof item !== 'object')) {
      return <dd>{value.length ? value.join(', ') : '—'}</dd>
    }
    return <div className="career-answer-list">{value.map((item, index) => <div className="career-answer-entry" key={index}><h4 className="h6">{index + 1}</h4><AnswerList value={item} /></div>)}</div>
  }

  if (value && typeof value === 'object') {
    return <dl className="career-answer-grid">{Object.entries(value).map(([key, answer]) => <div key={key}><dt>{humanize(key)}</dt><AnswerList value={answer} /></div>)}</dl>
  }

  return <dd>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '—'}</dd>
}

export default function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [resumePreview, setResumePreview] = useState(null)
  const [resumeBusy, setResumeBusy] = useState(false)
  const detailController = useRef(null)
  const statusController = useRef(null)
  const resumeController = useRef(null)
  const selectedId = useRef(null)
  const previewCloseButton = useRef(null)
  const previewTrigger = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/api/admin/applications/', {
          params: { search, position, status: statusFilter, ordering, page, page_size: pageSize },
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        const results = Array.isArray(data) ? data : data.results || []
        const count = Array.isArray(data) ? data.length : data.count ?? results.length
        const lastPage = Math.max(1, Math.ceil(count / pageSize))
        setApplications(results)
        setTotal(count)
        setListError(null)
        if (page > lastPage) setPage(lastPage)
      } catch (requestError) {
        if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return
        const responseStatus = requestError.response?.status
        if (responseStatus === 404 && page > 1) {
          setPage(1)
          return
        }
        setListError(responseStatus === 403
          ? 'Access denied. Admin access is required.'
          : responseStatus === 401
            ? 'Your session has expired. Please sign in again.'
            : requestError.response?.data?.detail || 'Could not load applications.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [search, position, statusFilter, ordering, page, refresh])

  useEffect(() => () => {
    detailController.current?.abort()
    statusController.current?.abort()
    resumeController.current?.abort()
  }, [])

  const closePreview = (restoreFocus = true) => {
    setResumePreview(null)
    if (restoreFocus && previewTrigger.current?.isConnected) previewTrigger.current.focus()
  }

  const updateFilter = (setFilter, value) => {
    setFilter(value)
    setPage(1)
  }

  const returnToApplications = () => {
    detailController.current?.abort()
    statusController.current?.abort()
    resumeController.current?.abort()
    selectedId.current = null
    setSelected(null)
    setDetailLoading(false)
    setSavingStatus(false)
    setResumeBusy(false)
    setError(null)
    closePreview(false)
  }

  const openApplication = async (applicationId) => {
    detailController.current?.abort()
    statusController.current?.abort()
    resumeController.current?.abort()
    const controller = new AbortController()
    detailController.current = controller
    selectedId.current = applicationId
    setSelected(null)
    setDetailLoading(true)
    setSavingStatus(false)
    setResumeBusy(false)
    setError(null)
    closePreview(false)
    try {
      const { data } = await api.get(`/api/admin/applications/${applicationId}/`, { signal: controller.signal })
      if (controller.signal.aborted) return
      setSelected(data)
    } catch (requestError) {
      if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return
      setError(requestError.response?.data?.detail || 'Could not open this application.')
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false)
    }
  }

  const changeStatus = async (nextStatus) => {
    if (!selected || nextStatus === selected.status) return
    statusController.current?.abort()
    const controller = new AbortController()
    statusController.current = controller
    const applicationId = selected.id
    setSavingStatus(true)
    setError(null)
    try {
      const { data } = await api.patch(`/api/admin/applications/${applicationId}/`, { status: nextStatus }, { signal: controller.signal })
      if (controller.signal.aborted) return
      if (selectedId.current === applicationId) setSelected(data)
      setApplications((current) => current.map((item) => item.id === data.id ? { ...item, status: data.status } : item))
      setRefresh((current) => current + 1)
    } catch (requestError) {
      if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return
      setError(requestError.response?.data?.status?.[0] || 'Could not update application status.')
    } finally {
      if (!controller.signal.aborted) setSavingStatus(false)
    }
  }

  const handleResume = async (application, download, trigger) => {
    resumeController.current?.abort()
    const controller = new AbortController()
    resumeController.current = controller
    const shouldDownload = download || !isPdfResume(application)
    if (!shouldDownload) previewTrigger.current = trigger
    setResumeBusy(true)
    setError(null)
    try {
      const query = shouldDownload ? '?download=1' : ''
      const { data } = await api.get(`/api/admin/applications/${application.id}/resume/${query}`, { responseType: 'blob', signal: controller.signal })
      if (controller.signal.aborted || selectedId.current !== application.id) return
      const url = URL.createObjectURL(data)
      if (shouldDownload) {
        const link = document.createElement('a')
        link.href = url
        link.download = application.resume_original_filename || 'resume'
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } else {
        setResumePreview({ url, name: application.resume_original_filename || 'Resume' })
      }
    } catch (requestError) {
      if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return
      setError(requestError.response?.status === 403 ? 'Access denied. Admin access is required to view resumes.' : 'Could not retrieve the resume.')
    } finally {
      if (!controller.signal.aborted) setResumeBusy(false)
    }
  }

  const handleDelete = async (applicationId) => {
    if (!window.confirm('Delete this application? This action cannot be undone.')) return
    setDeletingId(applicationId)
    setError(null)
    try {
      await api.delete(`/api/admin/applications/${applicationId}/`)
      setApplications((current) => current.filter((item) => item.id !== applicationId))
      setRefresh((current) => current + 1)
      if (selectedId.current === applicationId) returnToApplications()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not delete this application.')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (!resumePreview) return
    previewCloseButton.current?.focus()
    return () => URL.revokeObjectURL(resumePreview.url)
  }, [resumePreview])

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
        <div><p className="section-kicker mb-1">Hiring Workspace</p><h1 className="h2 mb-0">Career Applications</h1></div>
        {(selected || detailLoading) && <button className="btn btn-outline-secondary" onClick={returnToApplications}>Back to applications</button>}
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {!selected && !detailLoading && <>
        <div className="row g-2 mb-3">
          <div className="col-lg-5"><label className="visually-hidden" htmlFor="application-search">Search applicants</label><input id="application-search" className="form-control" placeholder="Search name or email" value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} /></div>
          <div className="col-md-4 col-lg-3"><label className="visually-hidden" htmlFor="application-position-filter">Filter by position</label><input id="application-position-filter" className="form-control" placeholder="Filter by position" value={position} onChange={(event) => updateFilter(setPosition, event.target.value)} /></div>
          <div className="col-md-4 col-lg-2"><label className="visually-hidden" htmlFor="application-status-filter">Filter by status</label><select id="application-status-filter" className="form-select" value={statusFilter} onChange={(event) => updateFilter(setStatusFilter, event.target.value)}><option value="">All statuses</option>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
          <div className="col-md-4 col-lg-2"><label className="visually-hidden" htmlFor="application-sort">Sort by date</label><select id="application-sort" className="form-select" value={ordering} onChange={(event) => updateFilter(setOrdering, event.target.value)}><option value="-created_at">Newest first</option><option value="created_at">Oldest first</option></select></div>
        </div>
        {listError && <div className="alert alert-danger" role="alert">{listError}</div>}
        {loading ? <div className="text-center py-5" role="status"><div className="spinner-border text-primary" aria-hidden="true" /><p className="mt-2 text-muted">Loading applications…</p></div> : applications.length === 0 ? !listError && <div className="alert alert-info">No applications match these filters.</div> : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead><tr><th scope="col">Applicant</th><th scope="col">Position</th><th scope="col">Contact</th><th scope="col">Date Applied</th><th scope="col">Status</th><th scope="col">Resume</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>{applications.map((application) => <tr key={application.id}>
                <td className="fw-semibold">{applicantName(application)}</td><td>{application.position?.trim() || 'Position not provided'}</td>
                <td>{application.email?.trim() ? <a href={`mailto:${application.email}`}>{application.email}</a> : <span className="text-muted">No email provided</span>}<div className="small text-muted">{application.phone_number || '—'}</div></td>
                <td>{new Date(application.submitted_at || application.created_at).toLocaleDateString()}</td>
                <td><span className="badge text-bg-secondary">{statuses.find(([value]) => value === application.status)?.[1] || application.status}</span></td>
                <td>{application.has_resume ? 'Yes' : 'No'}</td>
                <td><div className="d-flex flex-wrap gap-2"><button className="btn btn-sm btn-outline-primary" onClick={() => openApplication(application.id)}>View Application</button><button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(application.id)} disabled={deletingId !== null}>{deletingId === application.id ? 'Deleting…' : 'Delete Application'}</button></div></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
        <nav className="career-application-pagination" aria-label="Application pages">
          <p className="mb-0 text-muted small" aria-live="polite">{total === 0 ? '0 applications' : `${total} application${total === 1 ? '' : 's'} · Page ${page} of ${pageCount}`}</p>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={loading || page === 1}>Previous page</button>
            <button className="btn btn-outline-secondary" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={loading || page >= pageCount}>Next page</button>
          </div>
        </nav>
      </>}

      {detailLoading && <div className="text-center py-5"><div className="spinner-border" role="status" /><span className="visually-hidden">Loading application</span></div>}

      {selected && <>
        <section className="border-bottom pb-3 mb-3">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div><p className="section-kicker mb-1">Application Review</p><h2 className="h3 mb-1">{applicantName(selected)}</h2><p className="mb-0">{selected.position?.trim() || 'Position not provided'} · Applied {new Date(selected.submitted_at || selected.created_at).toLocaleString()}</p></div>
            <div><label className="form-label" htmlFor="application-status">Application status</label><select id="application-status" className="form-select" value={selected.status} onChange={(event) => changeStatus(event.target.value)} disabled={savingStatus || deletingId === selected.id}>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="btn btn-outline-danger mt-2" onClick={() => handleDelete(selected.id)} disabled={deletingId !== null || savingStatus}>{deletingId === selected.id ? 'Deleting…' : 'Delete Application'}</button></div>
          </div>
        </section>
        {selected.application_data?.demo === true && <div className="alert alert-info" role="note"><strong>Demo application.</strong> This application contains sample data.</div>}
        <section className="mb-4"><h3 className="h5">Contact</h3><p className="mb-1">{selected.email?.trim() ? <a href={`mailto:${selected.email}`}>{selected.email}</a> : <span className="text-muted">No email provided</span>}</p><p className="mb-0">{selected.phone_number || 'No phone number provided'}</p></section>
        {Object.entries(selected.application_data || {}).filter(([key]) => key !== 'demo').map(([key, value]) => <section className="mb-4" key={key}><h3 className="h5 border-bottom pb-2">{sectionNames[key] || humanize(key)}</h3><AnswerList value={value} /></section>)}
        <section className="mb-4">
          <h3 className="h5 border-bottom pb-2">Resume</h3>
          <p>{selected.has_resume ? selected.resume_original_filename || 'Resume attached.' : 'No resume attached.'}</p>
          {selected.has_resume && <>
            <div className="d-flex flex-wrap gap-2">
              {isPdfResume(selected) && <button className="btn btn-outline-primary" onClick={(event) => handleResume(selected, false, event.currentTarget)} disabled={resumeBusy}>Preview PDF</button>}
              <button className="btn btn-primary" onClick={() => handleResume(selected, true)} disabled={resumeBusy}>Download Resume</button>
            </div>
            {!isPdfResume(selected) && <p className="form-text">Download this resume to open it in Word or another compatible application.</p>}
          </>}
          {resumePreview && <div className="career-resume-preview mt-3" role="region" aria-labelledby="resume-preview-title" onKeyDown={(event) => { if (event.key === 'Escape') closePreview() }}>
            <div className="career-resume-preview-heading"><h4 className="h6 mb-0" id="resume-preview-title">{resumePreview.name}</h4><button ref={previewCloseButton} className="btn btn-sm btn-outline-secondary" onClick={() => closePreview()}>Close preview</button></div>
            <iframe className="career-resume-frame" title={`Resume preview: ${resumePreview.name}`} src={resumePreview.url} />
          </div>}
        </section>
        <section className="mb-4"><h3 className="h5 border-bottom pb-2">Submission</h3><dl className="career-answer-grid"><div><dt>Submitted</dt><dd>{new Date(selected.submitted_at || selected.created_at).toLocaleString()}</dd></div><div><dt>Last Updated</dt><dd>{new Date(selected.updated_at).toLocaleString()}</dd></div><div><dt>Cover Letter / Additional Information</dt><dd>{selected.cover_letter || '—'}</dd></div></dl></section>
      </>}

    </div>
  )
}
