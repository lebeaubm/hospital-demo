import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorAlert from '../components/ErrorAlert'
import Loading from '../components/Loading'
import ConfirmDialog from '../components/ConfirmDialog'
import EMREntryForm from '../components/EMREntryForm'
import EMRAssessments from '../components/EMRAssessments'
import EMRDashboard from '../components/EMRDashboard'
import { noteEditor, notePayload, vitalFields } from '../utils/emr'
import { emrUserId, workspaceForm, workspacePayload } from '../utils/emrWorkspace'
import './DemoEMR.css'

const sections = [['assessment', 'Assessment'], ['interventions', 'Interventions'], ['response', 'Patient Response'], ['plan', 'Follow-up Plan']]
const tabs = ['Overview', 'Nursing Notes', 'Assessments', 'Vital History']
const displayDate = value => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

function Vitals({ values }) {
  return <dl className="emr-vitals mb-0">{vitalFields.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{values?.[key] ?? '—'} <small className="text-muted">{values?.[key] != null ? unit : ''}</small></dd></div>)}</dl>
}

export default function DemoEMR() {
  const { user } = useAuth()
  const userId = emrUserId(user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const patientId = searchParams.get('patient') || ''
  const dashboardView = searchParams.get('view') === 'dashboard'
  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [patientsError, setPatientsError] = useState(null)
  const [listReload, setListReload] = useState(0)
  const [chart, setChart] = useState(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState(null)
  const [chartReload, setChartReload] = useState(0)
  const [search, setSearch] = useState('')
  const [listMode, setListMode] = useState('ACTIVE')
  const [activeForm, setActiveForm] = useState(null)
  const [formBaseline, setFormBaseline] = useState('')
  const [entryError, setEntryError] = useState(null)
  const [workflowError, setWorkflowError] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState(null)
  const [dashboardReload, setDashboardReload] = useState(0)
  const [tab, setTab] = useState('Overview')
  const [editor, setEditor] = useState(null)
  const [baseline, setBaseline] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [success, setSuccess] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const confirmationResolver = useRef(null)
  const pendingSave = useRef(null)
  const editorHeading = useRef(null)
  const dirty = (editor !== null && JSON.stringify(editor) !== baseline) || (activeForm !== null && JSON.stringify(activeForm) !== formBaseline)

  useEffect(() => {
    const controller = new AbortController()
    setPatientsLoading(true)
    setPatientsError(null)
    api.get('/api/staff/demo-emr/patients/?include_removed=true', { signal: controller.signal, timeout: 90000 })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          if (!Array.isArray(data)) throw new Error('The patient list could not be loaded.')
          setPatients(data)
        }
      })
      .catch(error => { if (!controller.signal.aborted) setPatientsError(error) })
      .finally(() => { if (!controller.signal.aborted) setPatientsLoading(false) })
    return () => controller.abort()
  }, [listReload])

  useEffect(() => {
    const first = patients.find(patient => patient.is_active)
    if (!patientId && first && !dashboardView) setSearchParams({ patient: String(first.id) }, { replace: true })
  }, [patientId, patients, dashboardView, setSearchParams])

  useEffect(() => {
    const controller = new AbortController()
    setDashboardLoading(true)
    setDashboardError(null)
    api.get('/api/staff/demo-emr/dashboard/', { signal: controller.signal, timeout: 90000 })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          if (!Array.isArray(data.visits) || !Array.isArray(data.tasks) || !Array.isArray(data.staff)) throw new Error('The dashboard could not be loaded.')
          setDashboard(data)
        }
      }).catch(error => { if (!controller.signal.aborted) setDashboardError(error) })
      .finally(() => { if (!controller.signal.aborted) setDashboardLoading(false) })
    return () => controller.abort()
  }, [dashboardReload])

  useEffect(() => {
    if (!patientId) return
    const controller = new AbortController()
    setChartLoading(true)
    setChartError(null)
    setChart(null)
    setEditor(null)
    setSaveError(null)
    setWorkflowError(null)
    api.get(`/api/staff/demo-emr/patients/${encodeURIComponent(patientId)}/`, { signal: controller.signal, timeout: 90000 })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          if (!data.patient || !Array.isArray(data.notes)) throw new Error('The patient chart could not be loaded.')
          setChart(data)
          setListMode(data.patient.is_active ? 'ACTIVE' : 'REMOVED')
        }
      })
      .catch(error => { if (!controller.signal.aborted) setChartError(error) })
      .finally(() => { if (!controller.signal.aborted) setChartLoading(false) })
    return () => controller.abort()
  }, [patientId, chartReload])

  useEffect(() => () => pendingSave.current?.abort(), [])
  useEffect(() => () => confirmationResolver.current?.(false), [])

  const requestConfirmation = (message, actionLabel) => new Promise(resolve => {
    if (confirmationResolver.current) { resolve(false); return }
    confirmationResolver.current = resolve
    setConfirmation({ message, actionLabel })
  })
  const finishConfirmation = accepted => {
    const resolve = confirmationResolver.current
    confirmationResolver.current = null
    setConfirmation(null)
    resolve?.(accepted)
  }

  useEffect(() => {
    if (!dirty) return
    const beforeUnload = event => { event.preventDefault(); event.returnValue = '' }
    const leavePage = event => {
      const link = event.target.closest('a[href]')
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || link.target === '_blank') return
      const destination = new URL(link.href)
      if (destination.origin === window.location.origin && destination.pathname !== window.location.pathname) {
        event.preventDefault()
        event.stopPropagation()
        requestConfirmation('Leave this page without saving your changes?', 'Leave Page').then(accepted => {
          if (accepted) navigate(destination.pathname + destination.search + destination.hash)
        })
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', leavePage, true)
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', leavePage, true) }
  }, [dirty, navigate])

  const canLeaveEditor = async () => !dirty || await requestConfirmation('Discard your unsaved changes?', 'Discard Changes')
  const selectPatient = async id => {
    if ((String(id) === patientId && !dashboardView) || saving || !await canLeaveEditor()) return
    setEditor(null)
    setActiveForm(null)
    setWorkflowError(null)
    setSuccess('')
    setSearch('')
    setListMode(patients.find(patient => patient.id === id)?.is_active === false ? 'REMOVED' : 'ACTIVE')
    setTab('Overview')
    setSearchParams({ patient: String(id) }, { replace: true })
  }
  const openEditor = async (note = null, amendmentOf = null) => {
    if (saving || chart?.patient.is_active === false || !await canLeaveEditor()) return
    const form = noteEditor(note, amendmentOf)
    setEditor(form)
    setActiveForm(null)
    setBaseline(JSON.stringify(form))
    setSaveError(null)
    setSuccess('')
    setTab('Nursing Notes')
    window.requestAnimationFrame(() => { editorHeading.current?.focus(); editorHeading.current?.scrollIntoView({ block: 'start' }) })
  }
  const updateEditor = (key, value) => setEditor(current => ({ ...current, [key]: value }))
  const reloadChart = async () => {
    if (saving || !await canLeaveEditor()) return
    setSuccess('')
    setChartReload(current => current + 1)
  }

  const switchView = async showDashboard => {
    if (saving || !await canLeaveEditor()) return
    setEditor(null)
    setActiveForm(null)
    setWorkflowError(null)
    setSuccess('')
    setSearchParams(showDashboard ? { ...(patientId ? { patient: patientId } : {}), view: 'dashboard' } : (patientId ? { patient: patientId } : {}), { replace: true })
  }
  const openEntry = async kind => {
    if (saving || !await canLeaveEditor()) return
    const patient = patients.find(person => String(person.id) === patientId && person.is_active) || patients.find(person => person.is_active)
    const form = workspaceForm(kind, patient?.id || '', dashboard?.staff.some(person => person.id === userId) ? userId : '')
    setEditor(null)
    setActiveForm(form)
    setFormBaseline(JSON.stringify(form))
    setEntryError(null)
    setWorkflowError(null)
    setSuccess('')
  }
  const closeEntry = async () => { if (!saving && await canLeaveEditor()) setActiveForm(null) }
  const mutate = async operation => {
    if (pendingSave.current) return null
    const controller = new AbortController()
    pendingSave.current = controller
    setSaving(true)
    try {
      const { data } = await operation({ signal: controller.signal, timeout: 90000 })
      return controller.signal.aborted ? null : data
    } finally {
      pendingSave.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }
  const saveEntry = async event => {
    event.preventDefault()
    if (pendingSave.current) return
    setEntryError(null)
    try {
      const payload = workspacePayload(activeForm)
      const kind = activeForm.kind
      const endpoint = kind === 'patient' ? '/api/staff/demo-emr/patients/' : kind === 'assessment' ? `/api/staff/demo-emr/patients/${chart.patient.id}/assessments/` : `/api/staff/demo-emr/${kind === 'visit' ? 'visits' : 'tasks'}/`
      const data = await mutate(config => api.post(endpoint, payload, config))
      if (!data) return
      setActiveForm(null)
      if (kind === 'patient') {
        setPatients(current => [data, ...current.filter(patient => patient.id !== data.id)].sort((a, b) => a.full_name.localeCompare(b.full_name)))
        setListMode('ACTIVE')
        setTab('Overview')
        setSearch('')
        setSearchParams({ patient: String(data.id) }, { replace: true })
      } else if (kind === 'assessment') {
        setChart(current => ({ ...current, assessments: [data, ...(current.assessments || []).filter(record => record.id !== data.id)].sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at)) }))
      } else {
        setDashboardReload(current => current + 1)
      }
      setSuccess({ patient: 'Patient added.', assessment: 'Assessment recorded.', visit: 'Visit scheduled.', task: 'Task added.' }[kind])
    } catch (error) { if (error.code !== 'ERR_CANCELED') setEntryError(error) }
  }
  const changePatientStatus = async () => {
    if (saving || !chart || !await canLeaveEditor()) return
    const removing = chart.patient.is_active
    if (!await requestConfirmation(removing ? `Remove ${chart.patient.full_name} from the active list? Their chart, visits, and tasks will be retained and can be restored.` : `Restore ${chart.patient.full_name} to the active list?`, removing ? 'Remove Patient' : 'Restore Patient')) return
    setWorkflowError(null)
    try {
      const patient = await mutate(config => api.patch(`/api/staff/demo-emr/patients/${chart.patient.id}/status/`, { is_active: !removing, revision: chart.patient.revision }, config))
      if (!patient) return
      setEditor(null)
      setActiveForm(null)
      setPatients(current => current.map(person => person.id === patient.id ? patient : person))
      setChart(current => ({ ...current, patient }))
      setListMode(removing ? 'REMOVED' : 'ACTIVE')
      setDashboardReload(current => current + 1)
      setSuccess(removing ? 'Patient removed. Their chart is retained.' : 'Patient restored.')
    } catch (error) { if (error.code !== 'ERR_CANCELED') setWorkflowError(error) }
  }
  const updateWorkStatus = async (kind, record, status) => {
    if (saving) return
    if (status === 'CANCELLED' && !await requestConfirmation('Cancel this visit? You can reopen it later.', 'Cancel Visit')) return
    setWorkflowError(null)
    setSuccess('')
    try {
      const data = await mutate(config => api.patch(`/api/staff/demo-emr/${kind}/${record.id}/`, { status, revision: record.revision }, config))
      if (!data) return
      setDashboard(current => ({ ...current, [kind]: current[kind].map(item => item.id === data.id ? data : item) }))
      setSuccess(kind === 'tasks' ? 'Task updated.' : 'Visit updated.')
    } catch (error) { if (error.code !== 'ERR_CANCELED') setWorkflowError(error) }
  }

  const saveNote = async event => {
    event.preventDefault()
    if (pendingSave.current) return
    setSaveError(null)
    const status = event.nativeEvent.submitter?.value === 'FINAL' ? 'FINAL' : 'DRAFT'
    let payload
    try { payload = notePayload(editor, status) } catch (error) { setSaveError(error); return }
    if (status === 'FINAL' && !await requestConfirmation('Finalize this note? Later corrections will be recorded as amendments.', 'Finalize Note')) return
    const controller = new AbortController()
    pendingSave.current = controller
    setSaving(true)
    try {
      const config = { signal: controller.signal, timeout: 90000 }
      const { data } = editor.id
        ? await api.patch(`/api/staff/demo-emr/notes/${editor.id}/`, payload, config)
        : await api.post(`/api/staff/demo-emr/patients/${chart.patient.id}/notes/`, payload, config)
      if (controller.signal.aborted) return
      setChart(current => ({ ...current, notes: [data, ...current.notes.filter(note => note.id !== data.id)].sort((a, b) => new Date(b.visit_at) - new Date(a.visit_at)) }))
      setEditor(null)
      setSuccess(status === 'FINAL' ? 'Note finalized.' : 'Draft saved.')
    } catch (error) {
      if (!controller.signal.aborted) setSaveError(error)
    } finally {
      pendingSave.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  const activePatients = patients.filter(patient => patient.is_active)
  const filteredPatients = patients.filter(patient => patient.is_active === (listMode === 'ACTIVE') && `${patient.full_name} ${patient.chart_number}`.toLowerCase().includes(search.toLowerCase().trim()))
  const finalizedNotes = chart?.notes.filter(note => note.status === 'FINAL') || []
  const latestVitals = finalizedNotes.find(note => Object.keys(note.vitals).length)?.vitals

  return (
    <><div className="emr-workspace py-4" inert={confirmation || activeForm ? true : undefined}>
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div><p className="section-kicker mb-1">Nursing Workspace</p><h1 className="h2 mb-0">Demo EMR</h1></div>
        <div className="d-flex align-items-center gap-2"><span className="emr-demo-label">Demo test</span><button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={() => openEntry('patient')}>Add Patient</button></div>
      </header>
      <div className="emr-view-switch d-flex gap-2 mb-4" role="group" aria-label="EMR workspace view"><button className={`btn btn-sm ${dashboardView ? 'btn-outline-primary' : 'btn-primary'}`} type="button" aria-pressed={!dashboardView} disabled={saving} onClick={() => switchView(false)}>Patient Charts</button><button className={`btn btn-sm ${dashboardView ? 'btn-primary' : 'btn-outline-primary'}`} type="button" aria-pressed={dashboardView} disabled={saving} onClick={() => switchView(true)}>Visits & Tasks</button></div>
      {workflowError && <ErrorAlert error={workflowError} />}
      {success && <div className="alert alert-success py-2" role="status">{success}</div>}
      {dashboardView ? dashboardLoading ? <Loading message="Loading visits and tasks…" /> : dashboardError ? <ErrorAlert error={dashboardError} onRetry={() => setDashboardReload(current => current + 1)} /> : dashboard && <EMRDashboard data={{ ...dashboard, patients: activePatients }} userId={userId} saving={saving} onAdd={openEntry} onUpdate={updateWorkStatus} onPatient={selectPatient} onRefresh={() => setDashboardReload(current => current + 1)} /> : <div className="emr-layout">
        <aside className="card emr-patient-panel" aria-label="Patient list">
          <div className="card-body pb-2"><h2 className="h5">Patients <span className="text-muted small">({listMode === 'ACTIVE' ? activePatients.length : patients.length - activePatients.length})</span></h2><label className="visually-hidden" htmlFor="emr-patient-mode">Patient List</label><select className="form-select form-select-sm mb-2" id="emr-patient-mode" value={listMode} onChange={event => setListMode(event.target.value)}><option value="ACTIVE">Active patients</option><option value="REMOVED">Removed patients</option></select><label className="visually-hidden" htmlFor="emr-patient-search">Search patients</label><input className="form-control" id="emr-patient-search" placeholder="Search name or chart number" value={search} onChange={event => setSearch(event.target.value)} /></div>
          {patientsLoading ? <Loading message="Loading patients…" /> : patientsError ? <div className="p-3"><ErrorAlert error={patientsError} onRetry={() => setListReload(current => current + 1)} /></div> : <div className="emr-patient-list list-group list-group-flush">
            {filteredPatients.map(patient => <button type="button" key={patient.id} className={`list-group-item list-group-item-action emr-patient-button${String(patient.id) === patientId ? ' active' : ''}`} aria-pressed={String(patient.id) === patientId} onClick={() => selectPatient(patient.id)} disabled={saving}><span className="emr-avatar" aria-hidden="true">{patient.full_name.split(' ').map(name => name[0]).join('').slice(0, 2)}</span><span><strong>{patient.full_name}</strong><small>{patient.chart_number}</small></span></button>)}
            {!filteredPatients.length && <p className="p-3 text-muted mb-0">{patients.length ? 'No matching patients.' : 'No patient charts available.'}</p>}
          </div>}
        </aside>
        <section className="emr-chart" aria-label="Patient chart" aria-busy={chartLoading}>
          {chartLoading ? <Loading message="Opening chart…" /> : chartError ? <ErrorAlert error={chartError} onRetry={reloadChart} /> : !chart ? <div className="card p-4 text-muted">Select a patient to open their chart.</div> : <>
            <div className="card emr-chart-header mb-3"><div className="card-body d-flex flex-wrap justify-content-between gap-3"><div><p className="small text-muted mb-1">{chart.patient.chart_number}</p><h2 className="h3 mb-1">{chart.patient.full_name}</h2><p className="text-muted small mb-0">DOB: {new Date(`${chart.patient.date_of_birth}T00:00:00`).toLocaleDateString()} · {chart.patient.primary_condition}</p></div><div className="d-flex flex-wrap gap-2 align-items-start"><button type="button" className="btn btn-outline-secondary btn-sm" onClick={reloadChart} disabled={saving}>Refresh Chart</button><button type="button" className="btn btn-primary btn-sm" onClick={() => openEditor()} disabled={saving || !chart.patient.is_active}>New Visit Note</button><button type="button" className={`btn btn-sm ${chart.patient.is_active ? 'btn-outline-danger' : 'btn-outline-primary'}`} onClick={changePatientStatus} disabled={saving}>{chart.patient.is_active ? 'Remove Patient' : 'Restore Patient'}</button></div></div></div>
            {!chart.patient.is_active && <div className="alert alert-secondary py-2">Removed patient · Chart retained for review. Restore the patient to add entries.</div>}
            <div className="emr-tabs mb-3" role="tablist" aria-label="Chart sections">{tabs.map((name, index) => <button type="button" role="tab" id={`emr-tab-${index}`} aria-controls={`emr-panel-${index}`} aria-selected={tab === name} tabIndex={tab === name ? 0 : -1} className={tab === name ? 'active' : ''} key={name} onClick={() => setTab(name)} onKeyDown={event => {
              const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null
              if (next !== null) { event.preventDefault(); setTab(tabs[next]); document.getElementById(`emr-tab-${next}`)?.focus() }
            }}>{name}</button>)}</div>
            <div role="tabpanel" id={`emr-panel-${tabs.indexOf(tab)}`} aria-labelledby={`emr-tab-${tabs.indexOf(tab)}`}>
              {tab === 'Overview' && <div className="row g-3">
                <div className="col-lg-7"><div className="card h-100"><div className="card-body"><h3 className="h5">Patient Summary</h3><p>{chart.patient.history}</p><h4 className="h6">Medications</h4><ul className="emr-summary-list">{chart.patient.medications.map(item => <li key={item}>{item}</li>)}</ul><h4 className="h6">Allergies</h4><ul className="emr-summary-list mb-0">{chart.patient.allergies.map(item => <li key={item}>{item}</li>)}</ul></div></div></div>
                <div className="col-lg-5"><div className="card h-100"><div className="card-body"><h3 className="h5">Care Plan</h3><ul className="emr-summary-list">{chart.patient.care_plan.map(task => <li key={task}>{task}</li>)}</ul><p className="small text-muted mb-0">{chart.notes.filter(note => note.status === 'DRAFT').length} drafts · {finalizedNotes.length} finalized notes</p></div></div></div>
                <div className="col-12"><div className="card"><div className="card-body"><h3 className="h5">Latest Recorded Vitals</h3>{latestVitals ? <Vitals values={latestVitals} /> : <p className="text-muted mb-0">No vital signs recorded yet.</p>}</div></div></div>
              </div>}
              {tab === 'Nursing Notes' && <>
                {editor && <form className="card emr-note-editor mb-4" onSubmit={saveNote} aria-busy={saving}>
                  <div className="card-body"><h3 ref={editorHeading} tabIndex="-1" className="h5">{editor.amendment_of ? `Amendment to note #${editor.amendment_of}` : editor.id ? 'Edit Draft' : 'New Visit Note'}</h3><fieldset disabled={saving}>
                    <label className="form-label" htmlFor="emr-visit-date">Visit Date & Time</label><input className="form-control mb-3" id="emr-visit-date" type="datetime-local" value={editor.visit_at} required onChange={event => updateEditor('visit_at', event.target.value)} />
                    <h4 className="h6">Vital Signs</h4><div className="row g-3 mb-4">{vitalFields.map(([key, label, unit, low, high]) => <div className="col-6 col-md-3" key={key}><label className="form-label small" htmlFor={`emr-vital-${key}`}>{label} <span className="text-muted">({unit})</span></label><input className="form-control" type="number" step="any" min={low} max={high} id={`emr-vital-${key}`} value={editor.vitals[key]} onChange={event => updateEditor('vitals', { ...editor.vitals, [key]: event.target.value })} /></div>)}</div>
                    <div className="row g-3">{sections.map(([key, label]) => <div key={key} className="col-md-6"><label className="form-label" htmlFor={`emr-note-${key}`}>{label}</label><textarea id={`emr-note-${key}`} className="form-control" rows="4" maxLength={5000} value={editor[key]} onChange={event => updateEditor(key, event.target.value)} /></div>)}</div>
                    <fieldset className="mt-4"><legend className="h6">Care Plan Tasks Completed</legend>{chart.patient.care_plan.map((task, index) => <div className="form-check mb-2" key={task}><input className="form-check-input" type="checkbox" id={`emr-task-${index}`} checked={editor.completed_tasks.includes(task)} onChange={event => updateEditor('completed_tasks', event.target.checked ? [...editor.completed_tasks, task] : editor.completed_tasks.filter(item => item !== task))} /><label className="form-check-label" htmlFor={`emr-task-${index}`}>{task}</label></div>)}</fieldset>
                    {saveError && <div className="mt-3"><ErrorAlert error={saveError} /></div>}
                    <div className="d-flex flex-wrap gap-2 mt-4"><button type="submit" value="DRAFT" className="btn btn-outline-primary">{saving ? 'Saving…' : 'Save Draft'}</button><button type="submit" value="FINAL" className="btn btn-primary">Finalize Note</button><button type="button" className="btn btn-outline-secondary" onClick={async () => { if (await canLeaveEditor()) setEditor(null) }}>Close</button>{dirty && <span className="small text-muted align-self-center">Unsaved changes</span>}</div>
                  </fieldset></div>
                </form>}
                {!chart.notes.length && <div className="card p-4 text-muted">No nursing notes yet. Start a new visit note.</div>}
                {chart.notes.map(note => <article key={note.id} className="card mb-3"><div className="card-body"><div className="d-flex flex-wrap justify-content-between gap-2 mb-3"><div><h3 className="h6 mb-1">{note.amendment_of ? `Amendment to note #${note.amendment_of}` : 'Nursing Visit'} <span className={`badge ms-2 ${note.status === 'FINAL' ? 'text-bg-success' : 'text-bg-secondary'}`}>{note.status === 'FINAL' ? 'Finalized' : 'Draft'}</span></h3><p className="small text-muted mb-0">{displayDate(note.visit_at)} · {note.author_name} · Note #{note.id}</p></div>{note.status === 'DRAFT' ? (note.author === userId || user?.role === 'ADMIN') && <button type="button" className="btn btn-outline-primary btn-sm" disabled={saving || !chart.patient.is_active} onClick={() => openEditor(note)}>Edit Draft</button> : <button type="button" className="btn btn-outline-secondary btn-sm" disabled={saving || !chart.patient.is_active} onClick={() => openEditor(null, note.id)}>Add Amendment</button>}</div>
                  {sections.map(([key, label]) => note[key] && <div className="mb-3" key={key}><h4 className="h6 mb-1">{label}</h4><p className="emr-note-text mb-0">{note[key]}</p></div>)}
                  {Object.keys(note.vitals).length > 0 && <div className="emr-note-vitals mb-3"><Vitals values={note.vitals} /></div>}
                  {note.completed_tasks.length > 0 && <p className="small mb-2"><strong>Completed:</strong> {note.completed_tasks.join(' · ')}</p>}
                  <p className="small text-muted mb-0">{note.finalized_at ? `Finalized ${displayDate(note.finalized_at)} by ${note.finalized_by_name}` : `Last saved ${displayDate(note.updated_at)}`}</p>
                </div></article>)}
              </>}
              {tab === 'Assessments' && <EMRAssessments records={chart.assessments || []} onAdd={() => openEntry('assessment')} removed={!chart.patient.is_active} saving={saving} />}
              {tab === 'Vital History' && <div className="card"><div className="card-body"><h3 className="h5">Vital History</h3>{finalizedNotes.some(note => Object.keys(note.vitals).length) ? <div className="table-responsive"><table className="table table-hover table-sm emr-history-table"><caption className="small">Vitals from finalized visit notes.</caption><thead><tr><th scope="col">Visit</th>{vitalFields.map(([key, label, unit]) => <th scope="col" key={key}>{label}<small className="d-block text-muted">{unit}</small></th>)}</tr></thead><tbody>{finalizedNotes.filter(note => Object.keys(note.vitals).length).map(note => <tr key={note.id}><th scope="row">{displayDate(note.visit_at)}{note.amendment_of && <small className="d-block text-muted">Amendment #{note.amendment_of}</small>}</th>{vitalFields.map(([key]) => <td key={key}>{note.vitals[key] ?? '—'}</td>)}</tr>)}</tbody></table></div> : <p className="text-muted mb-0">No finalized vital signs recorded yet.</p>}</div></div>}
            </div>
          </>}
        </section>
      </div>}
    </div>{activeForm && <EMREntryForm form={activeForm} onChange={setActiveForm} onSubmit={saveEntry} onClose={closeEntry} patients={activePatients} staff={dashboard?.staff || []} visits={dashboard?.visits || []} saving={saving} error={entryError} inert={!!confirmation} />}{confirmation && <ConfirmDialog {...confirmation} onDecision={finishConfirmation} />}</>
  )
}
