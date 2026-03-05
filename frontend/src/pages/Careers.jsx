import { useState } from 'react'
import { api } from '../api/client'

export default function Careers() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setSuccess(false)
    setError('')

    try {
      const form = event.currentTarget
      const formData = new FormData()
      formData.append('full_name', form.full_name.value)
      formData.append('email', form.email.value)
      formData.append('phone_number', form.phone_number.value)
      formData.append('position', form.position.value)
      formData.append('cover_letter', form.cover_letter.value)

      const resumeFile = form.resume?.files?.[0]
      if (resumeFile && resumeFile.size > 0) {
        formData.append('resume', resumeFile)
      }

      await api.post('/api/careers/applications/', formData)
      setSuccess(true)
      form.reset()
    } catch (err) {
      const apiError = err.response?.data
      if (apiError && typeof apiError === 'object') {
        const firstError = Object.values(apiError)?.[0]
        if (Array.isArray(firstError)) {
          setError(firstError[0])
        } else if (typeof firstError === 'string') {
          setError(firstError)
        } else {
          setError('Failed to submit application.')
        }
      } else if (!err.response) {
        setError('Cannot reach the server. Please try again in a moment.')
      } else {
        setError('Failed to submit application.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4">
      <h1 className="mb-3">Careers</h1>
      <p className="lead mb-4">
        Complete the form below to apply. You can upload your resume directly.
      </p>

      <div className="card shadow-sm">
        <div className="card-body">
          <h2 className="h5 mb-3">Application Form</h2>

          {success && (
            <div className="alert alert-success" role="alert">
              Application submitted successfully.
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="full_name">Full Name</label>
                <input id="full_name" name="full_name" className="form-control" required />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" className="form-control" required />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="phone_number">Phone Number</label>
                <input id="phone_number" name="phone_number" className="form-control" />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="position">Position Applying For</label>
                <input id="position" name="position" className="form-control" required />
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="cover_letter">Cover Letter</label>
                <textarea id="cover_letter" name="cover_letter" className="form-control" rows="5"></textarea>
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="resume">Resume (PDF, DOC, DOCX) - Optional</label>
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  className="form-control"
                  accept=".pdf,.doc,.docx"
                />
              </div>

              <div className="col-12">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
