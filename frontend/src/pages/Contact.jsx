import { useState } from 'react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
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
              <h2 className="h5 mb-3">Leave Us a Message</h2>
              {submitted && (
                <div className="alert alert-success" role="alert">
                  Thank you. Your message has been received.
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <input id="name" className="form-control" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input id="email" type="email" className="form-control" required />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="subject">Subject</label>
                    <input id="subject" className="form-control" required />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="message">Message</label>
                    <textarea id="message" className="form-control" rows="4" required></textarea>
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
                    <button type="submit" className="btn btn-primary">Send Message</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
