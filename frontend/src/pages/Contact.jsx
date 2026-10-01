import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

const fieldLabels = {
  full_name: 'Full Name',
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
      setSuccess('Your sample message has been saved for administrator review.')
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
    <div className="py-4">
      <p className="section-kicker">Contact</p>
      <h1 className="mb-2">Get in Touch</h1>
      <p className="lead mb-4">We care for your loved ones and are available 24 hours a day, 7 days a week.</p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card marketing-card h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Contact Information</h2>
              <p className="mb-2"><strong>Phone:</strong> <a href="tel:9516213600">(951) 621-3600</a></p>
              <p className="mb-2"><strong>Fax:</strong> (951) 621-3606</p>
              <p className="mb-3"><strong>Address:</strong> 1307 W 6th Street, Suite 220C, Corona, CA 92882</p>
              <hr />
              <h3 className="h6 mb-2">Office Hours</h3>
              <p className="mb-1">24 Hours a Day</p>
              <p className="mb-0">7 Days a Week</p>
              <hr />
              <h3 className="h6 mb-2">Counties Served</h3>
              <p className="mb-0">Ventura, Los Angeles, Orange, San Bernardino, Riverside, and San Diego.</p>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card marketing-card">
            <div className="card-body">
              <h2 className="h5 mb-3">Leave a Sample Message</h2>
              <div className="alert alert-info" id="contact-demo-notice">
                This demo form saves sample messages for administrator review. Use made-up contact details and avoid personal or medical information.
              </div>
              {success && <div className="alert alert-success" role="status">{success}</div>}
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <form onSubmit={handleSubmit} aria-describedby="contact-demo-notice" aria-busy={submitting}>
                <fieldset disabled={submitting}>
                  <legend className="visually-hidden">Sample contact message</legend>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="name">Full Name</label>
                      <input id="name" name="full_name" className="form-control" maxLength={255} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="email">Email</label>
                      <input id="email" name="email" type="email" className="form-control" maxLength={254} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="subject">Subject</label>
                      <input id="subject" name="subject" className="form-control" maxLength={200} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="message">Message</label>
                      <textarea id="message" name="message" className="form-control" rows="4" maxLength={5000} required></textarea>
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="consent" required />
                        <label className="form-check-label" htmlFor="consent">
                          I consent to the collection and processing of the information submitted through this form.
                        </label>
                      </div>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving Sample Message…' : 'Save Sample Message'}
                      </button>
                    </div>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
