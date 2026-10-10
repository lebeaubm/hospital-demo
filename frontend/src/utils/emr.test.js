import test from 'node:test'
import assert from 'node:assert/strict'
import { localDateTime, noteEditor, notePayload } from './emr.js'

test('new note has a stable request reference, empty optional fields and local time', () => {
  const editor = noteEditor()
  assert.match(editor.client_id, /^[a-f0-9-]{36}$/)
  assert.equal(editor.id, null)
  assert.equal(editor.amendment_of, null)
  assert.match(editor.visit_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  assert.deepEqual(notePayload(editor).vitals, {})
  assert.equal(notePayload(editor).client_id, editor.client_id)
})

test('editing a draft preserves author-independent reference, revision and zero values', () => {
  const editor = noteEditor({ id: 7, client_id: 'sample', revision: 3, amendment_of: 4, visit_at: '2026-10-01T18:35:00Z', vitals: { pain: 0, pulse: 72 }, assessment: 'Observed' })
  const payload = notePayload(editor)
  assert.equal(payload.revision, 3)
  assert.equal(payload.client_id, 'sample')
  assert.equal(payload.amendment_of, 4)
  assert.equal(payload.vitals.pain, 0)
  assert.equal(payload.visit_at, '2026-10-01T18:35:00.000Z')
})

test('amendment starts a fresh note linked to the preserved original', () => {
  const editor = noteEditor(null, 12)
  assert.equal(editor.amendment_of, 12)
  assert.equal(editor.assessment, '')
  assert.equal(editor.id, null)
})

test('finalization needs an assessment but an empty draft can be saved', () => {
  const editor = noteEditor()
  assert.equal(notePayload(editor).status, 'DRAFT')
  assert.throws(() => notePayload(editor, 'FINAL'), /assessment/)
  editor.assessment = '  Recorded observation  '
  assert.equal(notePayload(editor, 'FINAL').assessment, 'Recorded observation')
})

test('invalid measurements and dates cannot enter the request payload', () => {
  const editor = noteEditor()
  for (const value of ['NaN', 'Infinity', '101', '-1']) {
    editor.vitals.oxygen = value
    assert.throws(() => notePayload(editor), /Oxygen/)
  }
  editor.vitals.oxygen = ''
  editor.visit_at = 'invalid'
  assert.throws(() => notePayload(editor), /date and time/)
})

test('visit date converts to the browser local calendar date without UTC slicing', () => {
  const date = new Date(2026, 9, 1, 8, 5)
  assert.equal(localDateTime(date), '2026-10-01T08:05')
})
