import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import PageHero from '../components/PageHero'
import ServiceArea from '../components/ServiceArea'

const fieldLabels = {
  full_name: 'Full name',
  email: 'Email',
  subject: 'Subject',
  message: 'Message',
}

function submissionError(error) {
  if (error.response?.status === 400) {
    const details = error.response.data
    const messages = Object.entries(fieldLabels).flatMap(([field, label]) => {
      const errors = details?.[field]
      return Array.isArray(errors) ? errors.map((message) => `${label}: ${message}`) : []
    })
    if (messages.length) return messages.join(' ')
    return 'Please check your message details and try again.'
  }
  if (error.response?.status === 429) {
    return 'Too many messages have been submitted. Please wait a few minutes and try again.'
  }
  if (!error.response) {
    return 'We could not confirm that your sample message was saved. Please check your connection and try again later.'
  }
  return 'Your sample message could not be saved. Please try again later.'
}

export default function Contact() {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pendingRequest = useRef(null)

  useEffect(() => () => pendingRequest.current?.abort(), [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (pendingRequest.current) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = Object.fromEntries(
      Object.keys(fieldLabels).map((field) => [field, String(formData.get(field) || '').trim()]),
    )
    setSuccess('')
    setError('')

    const emptyField = Object.keys(fieldLabels).find((field) => !payload[field])
    if (emptyField) {
      setError(`Please enter ${fieldLabels[emptyField].toLowerCase()}.`)
      form.elements.namedItem(emptyField)?.focus()
      return
    }

    const controller = new AbortController()
    pendingRequest.current = controller
    setSubmitting(true)
    try {
      const response = await api.post('/api/contact/messages/', payload, {
        timeout: 90000,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (response.status !== 201) throw new Error('Unexpected response status')
      setSuccess('Your message has been saved for review.')
      form.reset()
    } catch (requestError) {
      if (controller.signal.aborted) return
      setError(submissionError(requestError))
    } finally {
      pendingRequest.current = null
      if (!controller.signal.aborted) setSubmitting(false)
    }
  }

  return (
    <div className="public-page">
      <PageHero eyebrow="Contact us" title="Let’s talk about care" />
      <div className="contact-layout page-section">
        <div>
          <section className="contact-call-card" aria-labelledby="contact-call-title">
            <h2 id="contact-call-title">Speak with our team</h2>
            <a className="contact-phone" href="tel:9516213600">(951) 621-3600</a>
            <p>Ask about services, coverage, or care in your area.</p>
          </section>
          <div className="contact-details">
            <div><h3>Care availability</h3><p>24 hours a day, 7 days a week.</p></div>
            <div><h3>Visit our office</h3><p>1307 W 6th Street, Suite 220C<br />Corona, CA 92882</p><p>Call to confirm office hours before visiting.</p><a className="page-text-link" href="https://www.google.com/maps/search/?api=1&query=1307+W+6th+Street+Suite+220C+Corona+CA+92882" target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a></div>
          </div>
        </div>
        <section className="contact-message-panel" id="send-message" aria-labelledby="send-message-title">
          <h2 id="send-message-title">Send a message</h2>
          <p className="small text-muted" id="contact-demo-notice">Demo form · Use sample information.</p>
          {success && <div className="alert alert-success" role="status">{success}</div>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} aria-describedby="contact-demo-notice" aria-busy={submitting}>
            <fieldset disabled={submitting}>
              <legend className="visually-hidden">Contact message — all fields required</legend>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label" htmlFor="name">Full name</label><input id="name" name="full_name" className="form-control" autoComplete="name" maxLength={255} required /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="form-control" autoComplete="email" maxLength={254} required /></div>
                <div className="col-12"><label className="form-label" htmlFor="subject">Subject</label><input id="subject" name="subject" className="form-control" maxLength={200} required /></div>
                <div className="col-12"><label className="form-label" htmlFor="message">Message</label><textarea id="message" name="message" className="form-control" rows="5" maxLength={5000} required /></div>
                <div className="col-12"><div className="form-check"><input className="form-check-input" type="checkbox" id="consent" required /><label className="form-check-label" htmlFor="consent">I consent to the collection and processing of the information submitted through this form.</label></div></div>
                <div className="col-12"><button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'}</button></div>
              </div>
            </fieldset>
          </form>
        </section>
      </div>
      <ServiceArea />
    </div>
  )
}
