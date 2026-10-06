import { localDateTime } from './emr.js'

export const assessmentFields = [
  ['orientation', 'Orientation', ['Alert and oriented', 'Drowsy', 'Confusion noted', 'Unable to assess']],
  ['breathing', 'Breathing', ['Unlabored', 'Concern noted', 'Unable to assess']],
  ['mobility', 'Mobility', ['Independent', 'Needs assistance', 'Unable to assess']],
  ['skin', 'Skin', ['Intact', 'Concern noted', 'Unable to assess']],
  ['nutrition', 'Nutrition', ['Usual intake', 'Reduced intake', 'Unable to assess']],
  ['fall_concern', 'Fall Concern', ['No concern noted', 'Concern noted', 'Unable to assess']],
]

export const formTitles = { patient: 'Add Patient', assessment: 'Record Assessment', visit: 'Schedule Visit', task: 'Add Task' }
export const statusLabels = { SCHEDULED: 'Scheduled', IN_PROGRESS: 'In progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled', OPEN: 'Open', DONE: 'Done' }

export function emrUserId(user) {
  const id = Number(user?.userId ?? user?.id)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export function workspaceForm(kind, patient = '', assignedTo = '') {
  const common = { kind, client_id: crypto.randomUUID() }
  if (kind === 'patient') return { ...common, full_name: '', date_of_birth: '', primary_condition: '', allergies: '', medications: '', care_plan: '', history: '' }
  if (kind === 'assessment') return { ...common, observed_at: localDateTime(), findings: Object.fromEntries([...assessmentFields.map(([key]) => [key, '']), ['pain', '']]), notes: '' }
  if (kind === 'visit') return { ...common, patient: String(patient), assigned_to: String(assignedTo), purpose: 'Home visit', scheduled_start: localDateTime(new Date(Date.now() + 86400000)) }
  if (kind === 'task') return { ...common, patient: String(patient), assigned_to: String(assignedTo), visit: '', title: '', details: '', due_at: '', priority: 'NORMAL' }
  throw new Error('Unknown entry type.')
}

export function samplePatient(form) {
  return { ...form, full_name: 'Taylor Morgan', date_of_birth: '1960-02-14', primary_condition: 'General home health support', allergies: 'No known allergies recorded', medications: 'Medication A — per care plan', care_plan: 'Record vital signs\nReview home safety', history: 'Fictional patient for charting practice.' }
}

const dateValue = (value, label) => {
  const date = new Date(value)
  if (!value || !Number.isFinite(date.getTime())) throw new Error(`Enter a valid ${label}.`)
  return date.toISOString()
}
const requiredText = (value, label) => {
  if (!value.trim()) throw new Error(`Enter ${label}.`)
  return value.trim()
}
const listValues = value => [...new Set(value.split('\n').map(item => item.trim()).filter(Boolean))]

export function workspacePayload(form) {
  const common = { client_id: form.client_id }
  if (form.kind === 'patient') {
    if (!form.date_of_birth || form.date_of_birth > localDateTime().slice(0, 10)) throw new Error('Enter a birth date that is not in the future.')
    return { ...common, full_name: requiredText(form.full_name, 'a patient name'), date_of_birth: form.date_of_birth, primary_condition: form.primary_condition.trim() || 'General home health support', allergies: listValues(form.allergies), medications: listValues(form.medications), care_plan: listValues(form.care_plan), history: form.history.trim() }
  }
  if (form.kind === 'assessment') {
    const findings = {}
    for (const [key, , choices] of assessmentFields) {
      if (!form.findings[key]) continue
      if (!choices.includes(form.findings[key])) throw new Error('Select a listed assessment value.')
      findings[key] = form.findings[key]
    }
    if (String(form.findings.pain).trim()) {
      const pain = Number(form.findings.pain)
      if (!Number.isFinite(pain) || pain < 0 || pain > 10) throw new Error('Pain must be a number from 0 to 10.')
      findings.pain = pain
    }
    const notes = form.notes.trim()
    if (!Object.keys(findings).length && !notes) throw new Error('Record at least one observation or a note.')
    return { ...common, observed_at: dateValue(form.observed_at, 'assessment date and time'), findings, notes }
  }
  const patient = Number(form.patient)
  if (!Number.isSafeInteger(patient) || patient < 1) throw new Error('Select a patient.')
  const assigned_to = form.assigned_to ? Number(form.assigned_to) : null
  if (assigned_to !== null && (!Number.isSafeInteger(assigned_to) || assigned_to < 1)) throw new Error('Select a nurse.')
  if (form.kind === 'visit') return { ...common, patient, assigned_to, purpose: requiredText(form.purpose, 'a visit purpose'), scheduled_start: dateValue(form.scheduled_start, 'visit date and time') }
  if (form.kind !== 'task') throw new Error('Unknown entry type.')
  const visit = form.visit ? Number(form.visit) : null
  if (visit !== null && (!Number.isSafeInteger(visit) || visit < 1)) throw new Error('Select a visit.')
  if (!['NORMAL', 'HIGH'].includes(form.priority)) throw new Error('Select a listed priority.')
  return { ...common, patient, assigned_to, visit, title: requiredText(form.title, 'a task title'), details: form.details.trim(), due_at: form.due_at ? dateValue(form.due_at, 'task due date') : null, priority: form.priority }
}

export function dashboardCounts(visits, tasks, userId, now = new Date()) {
  const today = localDateTime(now).slice(0, 10)
  const open = tasks.filter(task => task.status === 'OPEN')
  return {
    today: visits.filter(visit => localDateTime(visit.scheduled_start).slice(0, 10) === today && ['SCHEDULED', 'IN_PROGRESS'].includes(visit.status)).length,
    open: open.length,
    overdue: open.filter(task => task.due_at && new Date(task.due_at) < now).length,
    mine: open.filter(task => task.assigned_to === userId).length,
  }
}
