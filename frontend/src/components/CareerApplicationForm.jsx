import { useRef, useState } from 'react'
import { api } from '../api/client'
import './CareerApplicationForm.css'

const MASK = '****'
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const dayLabels = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
const pages = ['Personal & Education', 'Previous Employment', 'References & Consents', 'Voluntary Information', 'Certification']
const createEmployer = () => ({ name: '', address: '', email: '', phone: '', secondary_email: '', job_title: '', responsibilities: '', from: '', to: '', reason_for_leaving: '' })
const createReference = () => ({ name: '', company: '', email: '', relationship: '', title: '', phone: '' })
const initialForm = {
  personal: { full_name: '', address: '', city: '', state: '', phone_number: '', email: '', position: '', date_available: '', desired_pay: '', pay_type: '', employment_desired: '' },
  availability: { days: Object.fromEntries(weekdays.map((day) => [day, { available: false, start: '', end: '' }])), days_preference: false, nights_preference: false },
  employment_eligibility: { legally_eligible: '', previously_employed: '', previous_start_date: '', previous_end_date: '', driver_license: '' },
  education: {
    high_school: { name: '', city_state: '', from: '', to: '', graduated: '', diploma: '' },
    college: { name: '', city_state: '', from: '', to: '', graduated: '', diploma: '' },
    other_education_1: { name: '', city_state: '', from: '', to: '', degree: '' },
    other_education_2: { name: '', city_state: '', from: '', to: '', degree: '' },
  },
  employers: [createEmployer(), createEmployer(), createEmployer()],
  references: [createReference(), createReference(), createReference()],
  additional: { background_check_consent: '', drug_test_consent: '', additional_information: '' },
  certification: { signature: '', printed_name: '', date: '', accepted: false },
}

// Locked questions are fixed demonstration values, never editable applicant answers.
function demoAnswers(form) {
  return {
    ...form,
    demo: true,
    personal: { ...form.personal, ssn: MASK, date_of_birth: MASK },
    employment_eligibility: { ...form.employment_eligibility, felony_conviction: MASK, felony_explanation: MASK, driver_license_number: MASK, driver_license_state: MASK },
    employers: form.employers.map((employer) => ({ ...employer, starting_pay: MASK, starting_pay_type: MASK, ending_pay: MASK, ending_pay_type: MASK })),
    military: Object.fromEntries(['veteran', 'branch', 'rank_at_discharge', 'from', 'to', 'type_of_discharge', 'discharge_explanation'].map((key) => [key, MASK])),
    additional: { ...form.additional, disability: MASK, hispanic_latino: MASK, race_categories: [MASK] },
  }
}

function firstApiError(value, path = []) {
  if (typeof value === 'string') return { message: value, path }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const found = firstApiError(child, [...path, key])
      if (found) return found
    }
  }
  return null
}

function PaperField({ form, setValue, path, label, type = 'text', wide = false, min, step, autoComplete = 'off', maxLength = 255 }) {
  const value = path.reduce((object, key) => object[key], form)
  const id = 'application-' + path.join('-')
  return (
    <div className={'paper-field' + (wide ? ' paper-wide' : '')}>
      <label htmlFor={id}>{label}</label>
      {type === 'textarea' ? (
        <textarea id={id} name={id} value={value} onChange={(event) => setValue(path, event.target.value)} rows="1" maxLength={maxLength} />
      ) : (
        <input id={id} name={id} type={type} value={value} data-empty={value === ''} onChange={(event) => setValue(path, event.target.value)} autoComplete={autoComplete} min={min} step={step} maxLength={type === 'email' ? Math.min(maxLength, 254) : maxLength} />
      )}
    </div>
  )
}

function LockedField({ label, id, wide = false, prefix = '' }) {
  return (
    <div className={'paper-field paper-locked' + (wide ? ' paper-wide' : '')}>
      <label htmlFor={id}>{label}</label>
      {prefix ? <div className="paper-money-input"><span>{prefix}</span><input id={id} type="text" value={MASK} disabled readOnly aria-describedby="career-demo-notice" /></div> : <input id={id} type="text" value={MASK} disabled readOnly aria-describedby="career-demo-notice" />}
    </div>
  )
}

function Choices({ label, name, options = ['Yes', 'No'], value = '', onChange, locked = false, wide = false }) {
  return (
    <fieldset className={'paper-choice-field' + (wide ? ' paper-wide' : '') + (locked ? ' paper-locked' : '')} disabled={locked}>
      <legend>{label}</legend>
      <div className="paper-choices">
        {options.map((option) => {
          const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, option]
          return <label className="paper-check" key={optionValue}><input type="radio" name={name} value={optionValue} checked={!locked && value === optionValue} onChange={locked ? undefined : () => onChange(optionValue)} readOnly={locked} /><span>{optionLabel}</span></label>
        })}
        {locked && <span className="paper-demo-mask" aria-hidden="true">{MASK}</span>}
      </div>
    </fieldset>
  )
}

function Bar({ children }) {
  return <h2 className="paper-section-bar">{children}</h2>
}

function Sheet({ number, children }) {
  return <section className={'career-paper career-paper-' + number} id={'application-page-' + number} aria-label={'Application page ' + number + ': ' + pages[number - 1]}>{children}</section>
}

const raceChoices = [
  ['Hispanic or Latino', 'a person of Cuban, Mexican, Chicano, Puerto Rican, South or Central American, or other Spanish culture or origin, regardless of race.'],
  ['White (not Hispanic or Latino)', 'a person having origins in any of the original peoples of Europe, the Middle East, or North Africa.'],
  ['Black or African American (not Hispanic or Latino)', 'a person having origins in any of the black racial groups of Africa.'],
  ['Asian (not Hispanic or Latino)', 'a person having origins in any of the original peoples of the Far East, Southeast Asia, or the Indian subcontinent including, for example, Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, the Philippine Islands, Thailand, and Vietnam.'],
  ['Native Hawaiian or Other Pacific Islander (not Hispanic or Latino)', 'a person having origins in any of the original peoples of Hawaii, Guam, Samoa, or other Pacific Islands.'],
  ['American Indian or Alaska Native (not Hispanic or Latino)', 'a person having origins in any of the original peoples of North and South America (including Central America), and who maintains tribal affiliation or community attachment.'],
  ['Two or More Races (not Hispanic or Latino)', ''],
]

function LockedRace({ choices }) {
  return <fieldset className="paper-race-list" disabled>{choices.map(([label, explanation]) => <label key={label}><input type="checkbox" readOnly aria-label={label + ' (demo only)'} /><span>{label}{explanation ? ': ' + explanation : ''}</span></label>)}</fieldset>
}

export default function CareerApplicationForm() {
  const [form, setForm] = useState(() => structuredClone(initialForm))
  const [resume, setResume] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const formRef = useRef(null)
  const messageRef = useRef(null)

  const setValue = (path, value) => setForm((current) => {
    const next = structuredClone(current)
    let target = next
    path.slice(0, -1).forEach((key) => { target = target[key] })
    target[path[path.length - 1]] = value
    if (path.join('.') === 'employment_eligibility.previously_employed' && value !== 'Yes') {
      next.employment_eligibility.previous_start_date = ''
      next.employment_eligibility.previous_end_date = ''
    }
    return next
  })
  const field = (path, label, options = {}) => <PaperField key={path.join('-')} form={form} setValue={setValue} path={path} label={label} {...options} />
  const choice = (path, label, options = {}) => <Choices name={'application-' + path.join('-')} label={label} value={path.reduce((object, key) => object[key], form)} onChange={(value) => setValue(path, value)} {...options} />
  const locked = (id, label, wide = false, prefix = '') => <LockedField id={'application-demo-' + id} label={label} wide={wide} prefix={prefix} />
  const school = (key, title, other = false) => (
    <div className="paper-school paper-grid">
      {field(['education', key, 'name'], title)}
      {field(['education', key, 'city_state'], 'City / State:')}
      {field(['education', key, 'from'], 'From:', { type: 'date' })}
      {field(['education', key, 'to'], 'To:', { type: 'date', min: form.education[key].from })}
      {other ? field(['education', key, 'degree'], 'Degree / Certification:', { wide: true }) : <>{choice(['education', key, 'graduated'], 'Graduate:')}{field(['education', key, 'diploma'], 'Diploma:')}</>}
    </div>
  )
  const employerStart = (index) => (
    <>
      {field(['employers', index, 'name'], 'Employer ' + (index + 1) + ':', { wide: true })}
      {field(['employers', index, 'address'], 'Address:', { wide: true })}
      {field(['employers', index, 'email'], 'Email Address:', { type: 'email' })}
      {index === 0 ? field(['employers', index, 'phone'], 'Phone Number:', { type: 'tel', maxLength: 50 }) : field(['employers', index, 'secondary_email'], 'Email Address:', { type: 'email' })}
      {['Starting', 'Ending'].map((label) => <div className="paper-pay-row paper-wide" key={label}>{locked('employer-' + index + '-' + label, label + ' Pay:', false, '$')}<Choices name={'demo-employer-' + index + '-' + label} label="" options={['Hour', 'Salary']} locked /></div>)}
    </>
  )
  const employerEnd = (index) => (
    <>
      {field(['employers', index, 'job_title'], 'Job Title:')}
      {field(['employers', index, 'responsibilities'], 'Responsibilities:', { type: 'textarea', maxLength: 5000 })}
      {field(['employers', index, 'from'], 'From:', { type: 'date' })}
      {field(['employers', index, 'to'], 'To:', { type: 'date', min: form.employers[index].from })}
      {field(['employers', index, 'reason_for_leaving'], 'Reason for leaving:', { type: 'textarea', wide: true, maxLength: 5000 })}
    </>
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting || !event.currentTarget.reportValidity()) return
    setSubmitting(true)
    setError('')
    try {
      const answers = demoAnswers(form)
      const payload = new FormData()
      payload.append('full_name', answers.personal.full_name)
      payload.append('email', answers.personal.email)
      payload.append('phone_number', answers.personal.phone_number)
      payload.append('position', answers.personal.position)
      payload.append('cover_letter', answers.additional.additional_information)
      payload.append('application_data', JSON.stringify(answers))
      if (resume) payload.append('resume', resume)
      await api.post('/api/careers/applications/', payload, { timeout: 90000 })
      setForm(structuredClone(initialForm))
      setResume(null)
      formRef.current?.reset()
      setSuccess(true)
      window.requestAnimationFrame(() => messageRef.current?.focus())
    } catch (submissionError) {
      const failure = firstApiError(submissionError.response?.data)
      setError(failure?.message || (submissionError.response ? 'We could not submit the demo application. Please try again.' : 'We could not confirm your submission. Your sample answers are still here. Please try again in a moment.'))
      window.requestAnimationFrame(() => messageRef.current?.focus())
    } finally {
      setSubmitting(false)
    }
  }

  if (success) return (
    <div className="career-demo-success" role="status" ref={messageRef} tabIndex="-1">
      <h2 className="h4">Demo application submitted</h2>
      <p>Your sample application is saved for admin review. Locked questions contain fixed fake values ({MASK}).</p>
      <button className="btn btn-outline-primary" type="button" onClick={() => { setSuccess(false); setError('') }}>Try the form again</button>
    </div>
  )

  return (
    <div className="career-application">
      <div className="career-demo-notice" id="career-demo-notice">
        <strong>Demo application — use sample information only.</strong>
        <p className="mb-0">This reproduces the five-page paper form. Locked identity, demographic, conviction, and past-pay fields submit fixed fake values ({MASK}). You can submit an empty demo application.</p>
      </div>
      <nav className="career-page-nav" aria-label="Application pages">{pages.map((label, index) => <a href={'#application-page-' + (index + 1)} key={label}><span>{index + 1}</span>{label}</a>)}</nav>
      {error && <div className="alert alert-danger" role="alert" ref={messageRef} tabIndex="-1">{error}</div>}
      <form ref={formRef} onSubmit={handleSubmit}>
        <fieldset className="career-paper-fields" disabled={submitting}>
          <Sheet number={1}>
            <header className="paper-heading">
              <h2>PEACELOVING HOME HEALTH</h2>
              <p>1307 W 6<sup>th</sup> Street, Suite 220C, Corona, CA 92882</p>
              <h3>JOB APPLICATION FORM</h3>
            </header>
            <Bar>Personal Information</Bar>
            <div className="paper-grid">
              {field(['personal', 'full_name'], 'Name:', { autoComplete: 'name' })}
              {locked('birth-date', 'D.O.B')}
              {field(['personal', 'address'], 'Address:', { wide: true, autoComplete: 'street-address' })}
              <div className="paper-field"><label htmlFor="application-personal-city">City, State:</label><div className="paper-city-state"><input id="application-personal-city" aria-label="City" value={form.personal.city} onChange={(event) => setValue(['personal', 'city'], event.target.value)} autoComplete="address-level2" maxLength={255} /><input id="application-personal-state" aria-label="State" value={form.personal.state} onChange={(event) => setValue(['personal', 'state'], event.target.value)} autoComplete="address-level1" maxLength={255} /></div></div>
              {field(['personal', 'email'], 'Email Address:', { type: 'email', autoComplete: 'email' })}
              {field(['personal', 'phone_number'], 'Phone Number:', { type: 'tel', autoComplete: 'tel', maxLength: 50 })}
              {locked('ssn', 'S.S.N:')}
              {field(['personal', 'position'], 'Position applied for:')}
              {field(['personal', 'date_available'], 'Date available:', { type: 'date' })}
              <div className="paper-desired-pay paper-wide">{choice(['personal', 'pay_type'], 'Desired Pay:', { options: ['Hour', 'Salary'] })}</div>
              {choice(['personal', 'employment_desired'], 'Employment desired:', { options: [['Full Time', 'Full time'], ['Part Time', 'Part time'], ['Seasonal', 'Seasonal']], wide: true })}
            </div>
            <div className="paper-availability">
              <p>Days/Hours Available To Work (Circle)</p>
              <div className="paper-days">{weekdays.map((day, index) => <label key={day} className={form.availability.days[day].available ? 'selected' : ''}><input type="checkbox" checked={form.availability.days[day].available} onChange={(event) => setValue(['availability', 'days', day, 'available'], event.target.checked)} /><span>{dayLabels[index]}</span></label>)}<div className="paper-day-night"><label className={form.availability.days_preference ? 'selected' : ''}><input type="checkbox" checked={form.availability.days_preference} onChange={(event) => setValue(['availability', 'days_preference'], event.target.checked)} /><span>Days</span></label><span>or</span><label className={form.availability.nights_preference ? 'selected' : ''}><input type="checkbox" checked={form.availability.nights_preference} onChange={(event) => setValue(['availability', 'nights_preference'], event.target.checked)} /><span>Nights</span></label></div></div>
            </div>
            <Bar>Employment Eligibility</Bar>
            <div className="paper-eligibility">
              {choice(['employment_eligibility', 'legally_eligible'], 'Are you legally eligible to work in the U.S.?')}
              {choice(['employment_eligibility', 'previously_employed'], 'Have you ever worked for this employer?')}
              <div className="paper-previous-dates"><span>If yes, write the start and end dates.</span><div className="paper-date-range"><input type="date" id="application-employment_eligibility-previous_start_date" aria-label="Previous employment start date" value={form.employment_eligibility.previous_start_date} data-empty={form.employment_eligibility.previous_start_date === ''} onChange={(event) => setValue(['employment_eligibility', 'previous_start_date'], event.target.value)} /><input type="date" id="application-employment_eligibility-previous_end_date" aria-label="Previous employment end date" value={form.employment_eligibility.previous_end_date} data-empty={form.employment_eligibility.previous_end_date === ''} min={form.employment_eligibility.previous_start_date} onChange={(event) => setValue(['employment_eligibility', 'previous_end_date'], event.target.value)} /></div></div>
              <Choices label="Have you ever been convicted of a felony?" name="demo-felony" locked />
              {locked('felony-explanation', 'If yes, please explain.', true)}
              <div className="paper-field"><label htmlFor="application-employment_eligibility-driver_license">Do you have Driver’s License?</label><select id="application-employment_eligibility-driver_license" value={form.employment_eligibility.driver_license} onChange={(event) => setValue(['employment_eligibility', 'driver_license'], event.target.value)}><option value=""></option><option value="Yes">Yes</option><option value="No">No</option></select></div>
              {locked('driver-license', 'If Yes, Driver’s License Number and State Issued', true)}
            </div>
            <Bar>Education</Bar>
            {school('high_school', 'High School:')}
            {school('college', 'College')}
          </Sheet>

          <Sheet number={2}>
            {school('other_education_1', 'Other:', true)}
            {school('other_education_2', 'Other:', true)}
            <Bar>Previous Employment</Bar>
            {[0, 1].map((index) => <div className="paper-employer paper-grid" key={index}>{employerStart(index)}{employerEnd(index)}</div>)}
            <div className="paper-employer paper-grid">{employerStart(2)}</div>
          </Sheet>

          <Sheet number={3}>
            <div className="paper-employer-continuation paper-grid">{employerEnd(2)}</div>
            <Bar>References <span className="paper-original-case">(Professional Only)</span></Bar>
            {[0, 1, 2].map((index) => <div className="paper-reference paper-grid" key={index}>{field(['references', index, 'name'], 'Full Name:')}{field(['references', index, 'relationship'], 'Relationship:')}{field(['references', index, 'company'], 'Company:')}{field(['references', index, 'title'], 'Title:')}{field(['references', index, 'email'], 'Email Address:', { type: 'email' })}{field(['references', index, 'phone'], 'Phone Number:', { type: 'tel', maxLength: 50 })}</div>)}
            <Bar>Military Service</Bar>
            <div className="paper-grid">
              <Choices label="Are you a Veteran?" name="demo-veteran" wide locked />
              {locked('military-branch', 'Branch:')}{locked('military-rank', 'Rank at Discharge:')}
              {locked('military-from', 'From:')}{locked('military-to', 'To:')}
              <div className="paper-military-discharge paper-wide">{locked('military-discharge', 'Type of Discharge:')}{locked('military-explanation', <>If not Honorable, please<br />explain.</>)}</div>
            </div>
            <Bar>Background Check Consent</Bar>
            <div className="paper-consents">{choice(['additional', 'background_check_consent'], 'If asked, are you willing to consent to a background check?')}{choice(['additional', 'drug_test_consent'], 'If asked, are willing to consent to a drug test?')}</div>
          </Sheet>

          <Sheet number={4}>
            <h2 className="paper-centered-heading">Voluntary Self-Identification of Disability</h2>
            <p>Please check one of the boxes below:</p>
            <fieldset className="paper-disability" disabled>{['Yes, I have a disability, or have had one in the past', 'No, I do not have a disability and have not had one in the past', 'I do not want to answer'].map((label) => <label className="paper-check" key={label}><input type="radio" name="demo-disability" readOnly /><span>{label}</span></label>)}</fieldset>
            <h3 className="paper-centered-heading">Privacy Act Statement</h3>
            <div className="paper-statement">
              <p>Ethnicity and race information is requested under the authority of 42 U.S.C. Section 2000e-16 and in compliance with the Office of Management and Budget's 1997 Revisions to the Standards for the Classification of Federal Data on Race and Ethnicity. Providing this information is voluntary and has no impact on your employment status, but in the instance of missing information, your employing agency will attempt to identify your race and ethnicity by visual observation.</p>
              <p>This information is used as necessary to plan for equal employment opportunity throughout the Federal government. It is also used by the U. S. Office of Personnel Management or employing agency maintaining the records to locate individuals for personnel research or survey response and in the production of summary descriptive statistics and analytical studies in support of the function for which the records are collected and maintained, or for related workforce studies.</p>
              <p>Social Security Number (SSN) is requested under the authority of Executive Order 9397, which requires SSN be used for the purpose of uniform, orderly administration of personnel records. Providing this information is voluntary and failure to do so will have no effect on your employment status. If SSN is not provided, however, other agency sources may be used to obtain it.</p>
              <p><strong>Specific Instructions:</strong> The two questions below are designed to identify your ethnicity and race. Regardless of your answer to question 1, go to question 2.</p>
              <p className="mb-1"><strong>Question 1.</strong> Are You Hispanic or Latino? (A person of Cuban, Mexican, Puerto Rican, South or Central American, or other Spanish culture or origin, regardless of race.)</p>
              <Choices label="" name="demo-hispanic-latino" locked />
              <p className="paper-race-instructions"><strong>Question 2.</strong> Please select the racial category or categories with which you most closely identify by placing an “X” on the appropriate line. Check as many as apply.</p>
              <LockedRace choices={raceChoices.slice(0, 3)} />
            </div>
          </Sheet>

          <Sheet number={5}>
            <LockedRace choices={raceChoices.slice(3)} />
            <Bar>Disclaimer</Bar>
            <div className="paper-disclaimer">
              <p>Applicant understands that this is an Equal Opportunity Employer and committed to excellence through diversity. In order to ensure this application is acceptable, please print or type with the application being fully completed in order for it to be considered.</p>
              <p>Please complete each section EVEN IF you decide to attach a resume.</p>
              <p>I, the Applicant, certify that my answers are true and honest to the best of my knowledge. If this application leads to my eventual employment, I understand that any false or misleading information in my application or interview may result in my employment being terminated.</p>
            </div>
            <div className="paper-signatures">{[['signature', 'Signature'], ['printed_name', 'Name'], ['date', 'Date']].map(([key, label]) => <div key={key}><input id={'application-certification-' + key} type={key === 'date' ? 'date' : 'text'} value={form.certification[key]} data-empty={form.certification[key] === ''} onChange={(event) => setValue(['certification', key], event.target.value)} maxLength={255} /><label htmlFor={'application-certification-' + key}>{label}</label></div>)}</div>
          </Sheet>
        </fieldset>
        <div className="career-demo-submit">
          <h2 className="h5">Submit a sample application</h2>
          <p>The printed statements above are reproduced from the sample paper form. This website demonstration stores fake placeholders for its locked questions.</p>
          <label className="form-label" htmlFor="application-resume">Optional sample resume (PDF, DOC, DOCX; maximum 10 MB)</label>
          <input className="form-control" id="application-resume" type="file" accept=".pdf,.doc,.docx" disabled={submitting} onChange={(event) => {
            const file = event.target.files?.[0] || null
            setError('')
            if (file && (!/\.(pdf|doc|docx)$/i.test(file.name) || file.size > 10 * 1024 * 1024)) { setError('Choose a PDF, DOC, or DOCX sample resume no larger than 10 MB.'); event.target.value = ''; setResume(null); return }
            setResume(file)
          }} />
          {resume && <p className="form-text">Selected: {resume.name}</p>}
          <label className="form-check mt-3"><input className="form-check-input" type="checkbox" checked={form.certification.accepted} onChange={(event) => setValue(['certification', 'accepted'], event.target.checked)} disabled={submitting} /><span className="form-check-label">I am submitting sample information for this demonstration.</span></label>
          <button className="btn btn-primary mt-3" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Demo Application'}</button>
          {submitting && <p className="form-text mt-2" role="status">Please keep this page open while the server responds.</p>}
        </div>
      </form>
    </div>
  )
}
