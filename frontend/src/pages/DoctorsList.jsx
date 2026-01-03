import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchDoctors = async () => {
      try {
        const { data } = await api.get('/api/doctors/')
        if (isMounted) {
          setDoctors(data)
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load doctors.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDoctors()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="py-4">
      <h1 className="mb-3">Doctors</h1>
      {loading && <p>Loading doctors...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <div className="row g-3">
          {doctors.map((doctor) => (
            <div className="col-md-4" key={doctor.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{doctor.name}</h5>
                  <p className="card-subtitle text-muted mb-2">
                    {doctor.specialty}
                  </p>
                  <p className="card-text flex-grow-1">{doctor.bio}</p>
                  <Link className="btn btn-primary mt-auto" to={`/doctors/${doctor.id}`}>
                    View profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
