import ServiceDetailPage from '../components/ServiceDetailPage'
import servicePrimaryCare from '../assets/service-primary-care.svg'

export default function ServicePrimaryCare() {
  return <ServiceDetailPage title="Primary Care and Wellness Exams" description="Our primary care team focuses on preventive care, routine screenings, and personalized wellness support." image={servicePrimaryCare} imageAlt="Primary care and wellness" paragraphs={["Services include annual exams, chronic condition monitoring, medication review, and care planning to help patients stay healthy and independent.","We coordinate closely with specialists when needed to ensure each patient receives consistent, connected care."]} />
}
