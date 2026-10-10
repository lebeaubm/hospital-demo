import { useEffect, useRef } from 'react'
import ErrorAlert from './ErrorAlert'
import { localDateTime } from '../utils/emr'
import { assessmentFields, formTitles, samplePatient } from '../utils/emrWorkspace'

export default function EMREntryForm({ form, onChange, onSubmit, onClose, patients, staff, visits, saving, error, inert }) {
  const dialog = useRef(null)
  const title = formTitles[form.kind]
  useEffect(() => {
    const previous = document.activeElement
    dialog.current.querySelector('input, select, textarea')?.focus()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [title])
  useEffect(() => {
    const handleKey = event => {
      if (!dialog.current?.contains(event.target)) return
      if (event.key === 'Escape') { event.preventDefault(); if (!saving) onClose() }
      if (event.key === 'Tab') {
        const inputs = [...dialog.current.querySelectorAll('input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)')]
        if (!inputs.length) return
        if (event.shiftKey && document.activeElement === inputs[0]) { event.preventDefault(); inputs.at(-1).focus() }
        else if (!event.shiftKey && document.activeElement === inputs.at(-1)) { event.preventDefault(); inputs[0].focus() }
      }
    }
    document.addEventListener('keydown', handleKey, true)
    return () => document.removeEventListener('keydown', handleKey, true)
  }, [onClose, saving])
  const update = (key, value) => onChange({ ...form, [key]: value })
  const input = (key, label, type = 'text', required = false, maxLength = 200) => <div className="mb-3" key={key}><label className="form-label" htmlFor={`emr-entry-${key}`}>{label}</label><input className="form-control" id={`emr-entry-${key}`} type={type} value={form[key]} required={required} maxLength={maxLength} max={type === 'date' ? localDateTime().slice(0, 10) : undefined} onInput={['date', 'datetime-local'].includes(type) ? event => update(key, event.target.value) : undefined} onChange={event => update(key, event.target.value)} /></div>
  const textarea = (key, label, maxLength = 5000) => <div className="mb-3" key={key}><label className="form-label" htmlFor={`emr-entry-${key}`}>{label}</label><textarea className="form-control" id={`emr-entry-${key}`} rows="3" maxLength={maxLength} value={form[key]} onChange={event => update(key, event.target.value)} /></div>
  const workForm = ['visit', 'task'].includes(form.kind)
  return <div className="modal show d-block emr-entry-modal" inert={inert || undefined} style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 2050 }}><div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><form className="modal-content" role="dialog" aria-modal="true" aria-labelledby="emr-entry-dialog-title" ref={dialog} onSubmit={onSubmit} aria-busy={saving}>
    <div className="modal-header"><h2 className="modal-title h5" id="emr-entry-dialog-title">{title}</h2><span className="emr-demo-label">Demo test</span></div>
    <div className="modal-body"><fieldset disabled={saving}>
      {form.kind === 'patient' && <><button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={() => onChange(samplePatient(form))}>Use Sample Details</button><div className="row"><div className="col-md-8">{input('full_name', 'Patient Name', 'text', true, 150)}</div><div className="col-md-4">{input('date_of_birth', 'Birth Date', 'date', true)}</div></div>{input('primary_condition', 'Primary Condition')}{textarea('allergies', 'Allergies (one per line)')}{textarea('medications', 'Medications (one per line)')}{textarea('care_plan', 'Care Plan Tasks (one per line)')}{textarea('history', 'Patient History')}</>}
      {form.kind === 'assessment' && <>{input('observed_at', 'Assessment Date & Time', 'datetime-local', true)}<div className="row g-3 mb-3">{assessmentFields.map(([key, label, choices]) => <div className="col-md-6" key={key}><label className="form-label" htmlFor={`emr-assessment-${key}`}>{label}</label><select className="form-select" id={`emr-assessment-${key}`} value={form.findings[key]} onChange={event => update('findings', { ...form.findings, [key]: event.target.value })}><option value="">Not recorded</option>{choices.map(value => <option key={value}>{value}</option>)}</select></div>)}<div className="col-md-6"><label className="form-label" htmlFor="emr-assessment-pain">Pain Score (0–10)</label><input id="emr-assessment-pain" className="form-control" type="number" min="0" max="10" step="any" value={form.findings.pain} onChange={event => update('findings', { ...form.findings, pain: event.target.value })} /></div></div>{textarea('notes', 'Assessment Notes')}</>}
      {workForm && <><div className="mb-3"><label className="form-label" htmlFor="emr-entry-patient">Patient</label><select id="emr-entry-patient" className="form-select" required value={form.patient} onChange={event => onChange({ ...form, patient: event.target.value, ...(form.kind === 'task' ? { visit: '' } : {}) })}><option value="">Select patient</option>{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.full_name} · {patient.chart_number}</option>)}</select></div><div className="mb-3"><label className="form-label" htmlFor="emr-entry-assigned_to">Assigned Nurse</label><select id="emr-entry-assigned_to" className="form-select" value={form.assigned_to} onChange={event => update('assigned_to', event.target.value)}><option value="">Unassigned</option>{staff.map(person => <option value={person.id} key={person.id}>{person.name}</option>)}</select></div></>}
      {form.kind === 'visit' && <>{input('purpose', 'Visit Purpose', 'text', true)}{input('scheduled_start', 'Scheduled Date & Time', 'datetime-local', true)}</>}
      {form.kind === 'task' && <>{input('title', 'Task Title', 'text', true)}{textarea('details', 'Task Details', 1000)}{input('due_at', 'Due Date & Time', 'datetime-local')}<div className="row"><div className="col-md-6 mb-3"><label className="form-label" htmlFor="emr-entry-priority">Priority</label><select id="emr-entry-priority" className="form-select" value={form.priority} onChange={event => update('priority', event.target.value)}><option value="NORMAL">Normal</option><option value="HIGH">High</option></select></div><div className="col-md-6 mb-3"><label className="form-label" htmlFor="emr-entry-visit">Linked Visit (optional)</label><select id="emr-entry-visit" className="form-select" value={form.visit} onChange={event => update('visit', event.target.value)}><option value="">No linked visit</option>{visits.filter(visit => String(visit.patient) === form.patient && ['SCHEDULED', 'IN_PROGRESS'].includes(visit.status)).map(visit => <option key={visit.id} value={visit.id}>{visit.purpose} · {new Date(visit.scheduled_start).toLocaleString()}</option>)}</select></div></div></>}
    </fieldset>{error && <ErrorAlert error={error} />}</div><div className="modal-footer"><button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : title}</button></div>
  </form></div></div>
}
