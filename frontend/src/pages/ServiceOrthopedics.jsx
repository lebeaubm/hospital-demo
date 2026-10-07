import ServiceDetailPage from '../components/ServiceDetailPage'
import serviceOrthopedics from '../assets/service-orthopedics.svg'

export default function ServiceOrthopedics() {
  return <ServiceDetailPage title="Orthopedics and Sports Medicine" description="Our orthopedic and mobility care helps patients recover from injuries and improve daily movement." image={serviceOrthopedics} imageAlt="Orthopedics and sports medicine" paragraphs={["We support joint pain management, rehabilitation coordination, recovery monitoring, and practical strategies to improve strength, balance, and flexibility.","Treatment plans are designed around each patient’s activity level and long-term function goals."]} />
}
