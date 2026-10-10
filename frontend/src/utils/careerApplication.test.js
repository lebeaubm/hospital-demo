import test from 'node:test'
import assert from 'node:assert/strict'
import { careerApplicationAnswers, createCareerForm } from './careerApplication.js'

test('every photographed protected section starts with editable empty values', () => {
  const form = createCareerForm()
  assert.equal(form.personal.ssn, '')
  assert.equal(form.personal.date_of_birth, '')
  assert.equal(form.employment_eligibility.felony_conviction, '')
  assert.equal(form.employment_eligibility.driver_license_number, '')
  assert.equal(form.employers[0].starting_pay, '')
  assert.equal(form.military.veteran, '')
  assert.deepEqual(form.additional.race_categories, [])
})

test('checkbox determines the test flag without replacing or mutating entered answers', () => {
  const form = createCareerForm()
  form.personal.ssn = '000-00-0000'
  form.employment_eligibility.felony_conviction = 'No'
  form.additional.race_categories = ['Asian (not Hispanic or Latino)']
  assert.equal(careerApplicationAnswers(form).demo, false)
  form.certification.accepted = true
  const answers = careerApplicationAnswers(form)
  assert.equal(answers.demo, true)
  assert.equal(answers.personal.ssn, form.personal.ssn)
  answers.additional.race_categories.push('Hispanic or Latino')
  assert.equal(form.additional.race_categories.length, 1)
})

test('reset forms and repeatable employer entries are independent', () => {
  const first = createCareerForm()
  first.employers[0].starting_pay = '0'
  assert.equal(first.employers[1].starting_pay, '')
  assert.equal(createCareerForm().employers[0].starting_pay, '')
})
