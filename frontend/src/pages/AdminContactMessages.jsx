import ScrollableTable from '../components/ScrollableTable'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

const pageSize = 20

function requestMessage(error, fallback) {
  if (error.response?.status === 403) return 'Admin access is required to review contact messages.'
  if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
  return error.response?.data?.detail || error.response?.data?.status?.[0] || fallback
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const detailHeading = useRef(null)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const fetchMessages = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/api/admin/contact-messages/', {
          params: { page, page_size: pageSize, status: statusFilter },
          signal: controller.signal,
          timeout: 90000,
        })
        if (controller.signal.aborted) return
        setMessages(data.results || [])
        setTotal(data.count || 0)
        setListError('')
      } catch (requestError) {
        if (controller.signal.aborted || requestError.code === 'ERR_CANCELED') return
        if (requestError.response?.status === 404 && page > 1) {
          setPage(1)
          return
        }
        setListError(requestMessage(requestError, 'Could not load contact messages. Please try again.'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchMessages()
    return () => controller.abort()
  }, [page, statusFilter, refresh])

  useEffect(() => {
    if (selected?.id) detailHeading.current?.focus()
  }, [selected?.id])

  const openMessage = (message) => {
    setSelected(message)
    setError('')
  }

  const closeMessage = () => {
    const messageId = selected?.id
    setSelected(null)
    setError('')
    window.requestAnimationFrame(() => document.getElementById(`contact-message-${messageId}`)?.focus())
  }

  const changeStatus = async () => {
    if (!selected || saving) return
    const messageId = selected.id
    const nextStatus = selected.status === 'REVIEWED' ? 'NEW' : 'REVIEWED'
    setSaving(true)
    setError('')
    try {
      const { data } = await api.patch(`/api/admin/contact-messages/${messageId}/`, { status: nextStatus }, { timeout: 90000 })
      if (!mounted.current) return
      setSelected((current) => current?.id === messageId ? data : current)
      setRefresh((current) => current + 1)
    } catch (requestError) {
      if (!mounted.current) return
      setError(requestMessage(requestError, 'Could not update this message. Please try again.'))
    } finally {
      if (mounted.current) setSaving(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
        <div><p className="section-kicker mb-1">Admin Inbox</p><h1 className="h2 mb-1">Contact Messages</h1><p className="text-muted mb-0">Review sample messages submitted through the Contact page.</p></div>
        {selected && <button className="btn btn-outline-secondary" onClick={closeMessage} disabled={saving}>Back to messages</button>}
      </div>

      {selected ? <section className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div><h2 className="h4 mb-2" ref={detailHeading} tabIndex="-1">{selected.subject || 'No subject'}</h2><span className={`badge ${selected.status === 'REVIEWED' ? 'text-bg-success' : 'text-bg-primary'}`}>{selected.status === 'REVIEWED' ? 'Reviewed' : 'New'}</span></div>
            <button className="btn btn-primary" onClick={changeStatus} disabled={saving}>{saving ? 'Saving…' : selected.status === 'REVIEWED' ? 'Mark as new' : 'Mark as reviewed'}</button>
          </div>
          {selected.is_demo && <p className="alert alert-info"><strong>Demo message.</strong> This message contains sample information.</p>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          <dl className="row mb-3">
            <dt className="col-sm-3">From</dt><dd className="col-sm-9 text-break">{selected.full_name || 'Name not provided'}</dd>
            <dt className="col-sm-3">Email</dt><dd className="col-sm-9 text-break">{selected.email || 'Email not provided'}</dd>
            <dt className="col-sm-3">Received</dt><dd className="col-sm-9">{new Date(selected.created_at).toLocaleString()}</dd>
          </dl>
          <h3 className="h6">Message</h3>
          <p className="mb-0 text-break" style={{ whiteSpace: 'pre-wrap' }}>{selected.message}</p>
        </div>
      </section> : <>
        <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
          <div><label className="form-label" htmlFor="contact-message-status">Filter by status</label><select className="form-select" id="contact-message-status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}><option value="">All messages</option><option value="NEW">New</option><option value="REVIEWED">Reviewed</option></select></div>
          <button className="btn btn-outline-secondary" onClick={() => setRefresh((current) => current + 1)} disabled={loading}>Refresh inbox</button>
        </div>
        {listError && <div className="alert alert-danger" role="alert">{listError}</div>}
        {loading ? <div className="text-center py-5" role="status"><div className="spinner-border text-primary" aria-hidden="true" /><p className="mt-2 text-muted">Loading contact messages…</p></div> : messages.length === 0 ? !listError && <div className="alert alert-info">No messages match this filter.</div> : <ScrollableTable className="table-responsive" label="Admin Contact Messages table">
          <table className="table table-hover align-middle">
            <thead><tr><th scope="col">From</th><th scope="col">Subject</th><th scope="col">Received</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>{messages.map((message) => <tr key={message.id}>
              <td className="text-break"><span className="fw-semibold">{message.full_name || 'Name not provided'}</span><div className="small text-muted">{message.email}</div></td>
              <td className="text-break">{message.subject}{message.is_demo && <span className="badge text-bg-secondary ms-2">Demo</span>}</td>
              <td>{new Date(message.created_at).toLocaleString()}</td>
              <td><span className={`badge ${message.status === 'REVIEWED' ? 'text-bg-success' : 'text-bg-primary'}`}>{message.status === 'REVIEWED' ? 'Reviewed' : 'New'}</span></td>
              <td><button className="btn btn-sm btn-outline-primary" id={`contact-message-${message.id}`} onClick={() => openMessage(message)}>View message</button></td>
            </tr>)}</tbody>
          </table>
        </ScrollableTable>}
        <nav className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3" aria-label="Contact message pages">
          <p className="mb-0 text-muted small" aria-live="polite">{total} message{total === 1 ? '' : 's'} · Page {page} of {pageCount}</p>
          <div className="d-flex gap-2"><button className="btn btn-outline-secondary" onClick={() => setPage((current) => current - 1)} disabled={loading || page <= 1}>Previous page</button><button className="btn btn-outline-secondary" onClick={() => setPage((current) => current + 1)} disabled={loading || page >= pageCount}>Next page</button></div>
        </nav>
      </>}
    </div>
  )
}
