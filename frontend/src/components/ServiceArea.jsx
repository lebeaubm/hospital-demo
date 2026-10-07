import { serviceAreas } from '../data/siteContent'

export default function ServiceArea() {
  return (
    <section className="page-section service-area-section">
      <div className="section-heading">
        <p className="page-eyebrow">Close to home</p>
        <h2>Serving Southern California</h2>
        <p>We serve cities in these six counties. Call to ask about care at your address.</p>
      </div>
      <ul className="coverage-chips" aria-label="Counties served">
        {serviceAreas.map((area) => <li key={area}>{area} County</li>)}
      </ul>
    </section>
  )
}
