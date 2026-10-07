import ServiceDetailPage from '../components/ServiceDetailPage'
import servicePediatrics from '../assets/service-pediatrics.svg'

export default function ServicePediatrics() {
  return <ServiceDetailPage title="Pediatrics and Family Care" description="Our pediatric and family care services provide compassionate support from infancy through adolescence." image={servicePediatrics} imageAlt="Pediatrics and family care" paragraphs={["We offer wellness visits, developmental guidance, preventive screenings, and follow-up care tailored to children’s changing health needs.","Families receive clear communication, care coordination, and practical guidance for at-home health support."]} />
}
