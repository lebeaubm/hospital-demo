export default function Services() {
  const servicesBanner = 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1800&q=80'

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
    {
      title: 'Medical Social Services',
      description: 'Social workers help patients and families with practical challenges and connect them to community services like delivered meals and transportation.',
    },
    {
      title: 'Dietitian Consult',
      description: 'Diet instructions are usually provided by nurses, with a dietitian available for patients with complex nutritional needs.',
    },
    {
      title: 'Physical Therapy',
      description: 'Certified therapists improve mobility, adjust to mobility aids, and help manage pain.',
    },
    {
      title: 'Occupational Therapy',
      description: 'Helps patients improve daily living activities like eating, bathing, dressing, and toileting.',
    },
    {
      title: 'Speech Therapy',
      description: 'Focused on restoring and enhancing daily living skills related to speech and swallowing.',
    },
    {
      title: 'Home Health Aides',
      description: 'Provide personal care and assist with housekeeping, shopping, and preparing limited meals.',
    },
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
    <div className="pt-1 pb-4">
      <div className="hero-banner-wrap mb-4" style={{ '--hero-height': '461px' }}>
        <img
          src={servicesBanner}
          alt="Healthcare services banner"
          className="hero-banner-image"
          style={{ objectPosition: 'center top' }}
        />
        <div className="hero-overlay">
          <p className="hero-overlay-title">Personalized Clinical Services</p>
          <p className="hero-overlay-subtitle">From skilled nursing to therapy support, delivered where patients feel most comfortable.</p>
        </div>
      </div>
      <p className="section-kicker">Our Programs</p>
      <h1 className="mb-3">Services</h1>
      <p className="lead">Comprehensive home health care services personalized to each patient and family.</p>
      <p className="section-intro">Explore specialty care, coordinated therapy, and support services tailored to patient needs.</p>

      <section>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card h-100 marketing-card">
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
            <div className="card h-100 marketing-card">
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
            <div className="card h-100 marketing-card">
              <div className="card-body">
                <h2 className="h5 card-title">Support & Therapy Services</h2>
                {supportServices.map((service) => (
                  <div key={service.title} className="mb-3">
                    <h3 className="h6 mb-1">{service.title}</h3>
                    <p className="mb-0">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100 marketing-card">
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
