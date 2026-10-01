import CareerApplicationForm from '../components/CareerApplicationForm'

export default function Careers() {
  return (
    <div className="py-4">
      <p className="section-kicker">Join Our Team</p>
      <h1 className="mb-3">Careers</h1>
      <p className="lead mb-4">
        Explore our sample online job application, recreated from the original paper form.
      </p>
      <CareerApplicationForm />
    </div>
  )
}
