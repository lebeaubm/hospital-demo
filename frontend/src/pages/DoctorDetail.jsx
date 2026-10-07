import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { SkeletonCard } from '../components/SkeletonLoader'
import ErrorAlert from '../components/ErrorAlert'
import PageHeader from '../components/PageHeader'

export default function DoctorDetail() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestRef = useRef(null)

  const fetchDoctor = useCallback(async () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/api/doctors/${id}/`, { signal: controller.signal })
      if (!controller.signal.aborted) setDoctor(data)
    } catch (err) {
      if (!controller.signal.aborted) setError(err)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDoctor()
    return () => requestRef.current?.abort()
  }, [fetchDoctor])

  return (
    <div className="py-4">
      <PageHeader title={doctor?.name || 'Doctor Details'} description={doctor?.specialty || 'Learn more about a doctor’s background and specialty.'} eyebrow="Doctor directory" />
      <Link className="btn btn-link px-0" to="/doctors">
        Back to doctors
      </Link>
      {loading && <SkeletonCard />}
      {error && <ErrorAlert error={error} onRetry={fetchDoctor} />}
      {!loading && !error && doctor && (
        <div className="card shadow-sm">
          <div className="card-body">
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
