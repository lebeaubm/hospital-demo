import ServiceDetailPage from '../components/ServiceDetailPage'
import serviceCardiology from '../assets/service-cardiology.svg'

export default function ServiceCardiology() {
  return <ServiceDetailPage title="Cardiology and Heart Health" description="Our heart health services support patients with cardiovascular risk factors and existing cardiac conditions." image={serviceCardiology} imageAlt="Cardiology and heart health" paragraphs={["Care includes blood pressure and cholesterol monitoring, follow-up evaluations, medication management, and lifestyle guidance tailored to each patient’s needs.","We work with patients and families to improve long-term outcomes and reduce avoidable complications."]} />
}
