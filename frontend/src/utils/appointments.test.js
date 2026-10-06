import test from 'node:test'
import assert from 'node:assert/strict'
import { doctorListFromResponse, prepareAppointmentRequest } from './appointments.js'

const doctors = [{ id: 1, name: 'Sample doctor' }]
const now = Date.parse('2030-05-10T08:00:00Z')
const form = { doctor: '1', requested_start: '2030-05-11T08:00:00Z', reason: ' Sample visit ', patient_notes: ' Demo notes ' }

test('doctor lists accept both API response formats and preserve an empty list', () => {
  assert.deepEqual(doctorListFromResponse({ results: doctors }), doctors)
  assert.deepEqual(doctorListFromResponse(doctors), doctors)
  assert.deepEqual(doctorListFromResponse({ results: [] }), [])
})

test('failed or malformed doctor responses do not become a no-assignment message', () => {
  for (const response of [null, {}, { results: null }, { results: [{ name: 'Missing ID' }] }]) {
    assert.throws(() => doctorListFromResponse(response), /could not be loaded/)
  }
})

test('submission rejects unavailable doctors and past or invalid dates', () => {
  assert.throws(() => prepareAppointmentRequest(form, [], now), /available doctor/)
  assert.throws(() => prepareAppointmentRequest({ ...form, doctor: '99' }, doctors, now), /available doctor/)
  assert.throws(() => prepareAppointmentRequest({ ...form, requested_start: 'invalid' }, doctors, now), /future/)
  assert.throws(() => prepareAppointmentRequest({ ...form, requested_start: '2030-05-09T08:00:00Z' }, doctors, now), /future/)
})

test('submission validates bounded text and creates a normalized API payload', () => {
  assert.throws(() => prepareAppointmentRequest({ ...form, reason: '   ' }, doctors, now), /reason/)
  assert.throws(() => prepareAppointmentRequest({ ...form, reason: 'x'.repeat(256) }, doctors, now), /255/)
  assert.throws(() => prepareAppointmentRequest({ ...form, patient_notes: 'x'.repeat(5001) }, doctors, now), /5,000/)
  assert.deepEqual(prepareAppointmentRequest(form, doctors, now), {
    doctor: 1, requested_start: '2030-05-11T08:00:00.000Z', reason: 'Sample visit', patient_notes: 'Demo notes',
  })
})
