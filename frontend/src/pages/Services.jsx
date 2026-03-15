import servicesBanner from '../assets/services-banner.svg'

export default function Services() {
  const specialtyServices = [
    'I.V. Therapy/Injections',
    'TPN/Enteral Feedings',
    'Ostomy Care',
    'Blood Draws',
    'Wound Care/Wound Vac',
    'Diabetes Education',
    'Glucometer Blood Sugar Monitoring',
    'Preparation/Administration of Insulin',
    'Foley Catheter Maintenance and Care',
    'Central Line Maintenance and Care',
    'Tracheotomy Maintenance and Care',
    'Geriatric Care',
    'Ventilator-Dependent Clients',
  ]

  const supportServices = [
    'Medical Social Services',
    'Dietitian Consult',
    'Physical Therapy',
    'Occupational Therapy',
    'Speech Therapy',
    'Home Health Aides',
  ]

  const arrangementServices = [
    'Laboratory Services',
    'Pharmaceutical Services',
    'Respiratory Treatment',
    'Medical Equipment and Supplies',
  ]

  const insuranceAccepted = [
    'Medicare',
    'Medi-Cal',
    'Workers Compensation',
    'Private Insurance',
    'Private Payment',
    'CCS',
    'Regional Center',
  ]

  return (
    <div className="py-4">
      <img
        src={servicesBanner}
        alt="Healthcare services banner"
        className="img-fluid rounded shadow-sm border mb-4"
      />
      <h1 className="mb-3">Services</h1>
      <p className="lead">Comprehensive home health care services personalized to each patient and family.</p>

      <section>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="h5 card-title">Specialty Services</h2>
                <ul className="mb-0 ps-3">
                  {specialtyServices.map((service) => (
                    <li key={service}>{service}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="h5 card-title">Professional Nursing Services</h2>
                <p className="card-text mb-3">
                  Skilled Registered Nurses (R.N.) and Licensed Vocational Nurses (L.V.N.) provide
                  vital services as directed by the physician, assess treatment needs, deliver care,
                  and report on patient health status to support optimal outcomes.
                </p>
                <h3 className="h6">Pediatric Services</h3>
                <p className="card-text mb-0">
                  In-home skilled nursing for Synagis administration to help prevent severe RSV disease.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="h5 card-title">Support & Therapy Services</h2>
                <ul className="mb-0 ps-3">
                  {supportServices.map((service) => (
                    <li key={service}>{service}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="h5 card-title">Services by Arrangement</h2>
                <ul className="mb-3 ps-3">
                  {arrangementServices.map((service) => (
                    <li key={service}>{service}</li>
                  ))}
                </ul>
                <h3 className="h6">Insurance Accepted</h3>
                <p className="mb-0">{insuranceAccepted.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
