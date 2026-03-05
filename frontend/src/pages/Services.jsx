import { Link } from 'react-router-dom'
import servicePrimaryCare from '../assets/service-primary-care.svg'
import serviceCardiology from '../assets/service-cardiology.svg'
import serviceOrthopedics from '../assets/service-orthopedics.svg'
import servicePediatrics from '../assets/service-pediatrics.svg'
import servicesBanner from '../assets/services-banner.svg'

export default function Services() {
  const serviceItems = [
    {
      path: '/services/primary-care',
      title: 'Primary Care and Wellness Exams',
      description: 'Routine checkups, preventive screenings, and personalized wellness planning for all ages.',
      image: servicePrimaryCare,
    },
    {
      path: '/services/cardiology',
      title: 'Cardiology and Heart Health',
      description: 'Heart-focused evaluations and follow-up support to help patients manage cardiovascular conditions.',
      image: serviceCardiology,
    },
    {
      path: '/services/orthopedics',
      title: 'Orthopedics and Sports Medicine',
      description: 'Joint, muscle, and mobility care designed to improve recovery and day-to-day function.',
      image: serviceOrthopedics,
    },
    {
      path: '/services/pediatrics',
      title: 'Pediatrics and Family Care',
      description: 'Compassionate child and family care with guidance for preventive and ongoing health needs.',
      image: servicePediatrics,
    },
  ]

  return (
    <div className="py-4">
      <img
        src={servicesBanner}
        alt="Healthcare services banner"
        className="img-fluid rounded shadow-sm border mb-4"
      />
      <h1 className="mb-3">Services</h1>
      <p className="lead">Comprehensive care tailored to your needs.</p>

      <section>
        <div className="row g-3">
          {serviceItems.map((service) => (
            <div className="col-md-6" key={service.title}>
              <Link to={service.path} className="card h-100 shadow-sm text-decoration-none text-reset">
                <img
                  src={service.image}
                  alt={service.title}
                  className="card-img-top"
                />
                <div className="card-body">
                  <h2 className="h5 card-title">{service.title}</h2>
                  <p className="card-text mb-0">{service.description}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
