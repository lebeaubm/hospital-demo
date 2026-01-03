import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'

export default function DoctorDetail() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchDoctor = async () => {
      try {
        const { data } = await api.get(`/api/doctors/${id}/`)
        if (isMounted) {
          setDoctor(data)
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load doctor details.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDoctor()

    return () => {
      isMounted = false
    }
  }, [id])

  return (
    <div className="py-4">
      <Link className="btn btn-link px-0" to="/doctors">
        Back to doctors
      </Link>
      {loading && <p>Loading doctor...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
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
