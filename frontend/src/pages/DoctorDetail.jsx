import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { SkeletonCard } from '../components/SkeletonLoader'
import ErrorAlert from '../components/ErrorAlert'

export default function DoctorDetail() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDoctor = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/api/doctors/${id}/`)
      setDoctor(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctor()
  }, [id])

  return (
    <div className="py-4">
      <Link className="btn btn-link px-0" to="/doctors">
        Back to doctors
      </Link>
      {loading && <SkeletonCard />}
      {error && <ErrorAlert error={error} onRetry={fetchDoctor} />}
      {!loading && !error && doctor && (
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="card-title">{doctor.name}</h2>
            <h6 className="text-muted">{doctor.specialty}</h6>
            <p className="mt-3">{doctor.bio}</p>
            <p className="mb-0">
              <strong>Experience:</strong> {doctor.years_experience} years
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
