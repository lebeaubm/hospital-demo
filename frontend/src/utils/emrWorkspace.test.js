import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardCounts, emrUserId, samplePatient, workspaceForm, workspacePayload } from './emrWorkspace.js'

test('EMR identity matches the auth context userId and handles numeric strings', () => {
  assert.equal(emrUserId({ userId: 7 }), 7)
  assert.equal(emrUserId({ userId: '7' }), 7)
  assert.equal(emrUserId({ id: 7 }), 7)
  assert.equal(emrUserId(null), null)
  assert.equal(emrUserId({ userId: 'unknown' }), null)
})

test('sample patient uses one stable reference and cleans multiline entries', () => {
  const form = workspaceForm('patient')
  const sample = samplePatient(form)
  const payload = workspacePayload({ ...sample, allergies: ' Latex\n\nLatex\nPenicillin ' })
  assert.equal(payload.client_id, form.client_id)
  assert.equal(payload.full_name, 'Taylor Morgan')
  assert.deepEqual(payload.allergies, ['Latex', 'Penicillin'])
  assert.deepEqual(payload.care_plan, ['Record vital signs', 'Review home safety'])
})

test('patient name and birth date are validated before submission', () => {
  const form = workspaceForm('patient')
  assert.throws(() => workspacePayload(form), /birth date/)
  assert.throws(() => workspacePayload({ ...form, date_of_birth: '1960-01-01' }), /patient name/)
  assert.throws(() => workspacePayload({ ...samplePatient(form), date_of_birth: '2999-01-01' }), /future/)
})

test('assessment preserves zero pain, omits unrecorded fields and requires an observation', () => {
  const form = workspaceForm('assessment')
  assert.throws(() => workspacePayload(form), /observation/)
  const payload = workspacePayload({ ...form, findings: { ...form.findings, pain: '0', mobility: 'Needs assistance' } })
  assert.deepEqual(payload.findings, { mobility: 'Needs assistance', pain: 0 })
  assert.throws(() => workspacePayload({ ...form, findings: { ...form.findings, pain: '11' } }), /Pain/)
  assert.throws(() => workspacePayload({ ...form, findings: { ...form.findings, breathing: 'Unknown' } }), /listed/)
})

test('visit and task payloads keep assignments and optional links', () => {
  const visit = workspacePayload(workspaceForm('visit', 2, 7))
  assert.equal(visit.patient, 2)
  assert.equal(visit.assigned_to, 7)
  assert.equal(visit.purpose, 'Home visit')
  const form = { ...workspaceForm('task', 2, 7), title: ' Review care plan ', visit: '4' }
  const task = workspacePayload(form)
  assert.equal(task.title, 'Review care plan')
  assert.equal(task.visit, 4)
  assert.equal(task.due_at, null)
  assert.throws(() => workspacePayload({ ...form, patient: '' }), /patient/)
  assert.throws(() => workspacePayload({ ...form, due_at: 'invalid' }), /due date/)
  assert.throws(() => workspacePayload({ ...form, priority: 'URGENT' }), /priority/)
})

test('dashboard counts use local dates and exclude completed work', () => {
  const now = new Date(2026, 9, 1, 12)
  const visits = [{ scheduled_start: new Date(2026, 9, 1, 9), status: 'SCHEDULED' }, { scheduled_start: now, status: 'COMPLETED' }, { scheduled_start: new Date(2026, 9, 2, 9), status: 'IN_PROGRESS' }]
  const tasks = [{ status: 'OPEN', assigned_to: 7, due_at: new Date(2026, 9, 1, 9) }, { status: 'OPEN', assigned_to: 8, due_at: null }, { status: 'DONE', assigned_to: 7, due_at: new Date(2026, 9, 1, 8) }]
  assert.deepEqual(dashboardCounts(visits, tasks, 7, now), { today: 1, open: 2, overdue: 1, mine: 1 })
})
