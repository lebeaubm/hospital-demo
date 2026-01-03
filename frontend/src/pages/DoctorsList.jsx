import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import Loading from '../components/Loading'
import ErrorAlert from '../components/ErrorAlert'

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation] = useState('')
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1
  })

  const specialties = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'Internal Medicine',
    'Family Medicine'
  ]

  const fetchDoctors = async (page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (specialty) params.append('specialty', specialty)
      if (location) params.append('location', location)
      params.append('page', page)

      const { data } = await api.get(`/api/doctors/?${params.toString()}`)
      
      setDoctors(data.results)
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: page
      })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors(1)
  }, [search, specialty, location])

  const handleNextPage = () => {
    if (pagination.next) {
      fetchDoctors(pagination.currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (pagination.previous) {
      fetchDoctors(pagination.currentPage - 1)
    }
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
  }

  const handleReset = () => {
    setSearch('')
    setSpecialty('')
    setLocation('')
  }

  const totalPages = Math.ceil(pagination.count / 10)

  return (
    <div className="py-4">
      <h1 className="mb-4">Doctors</h1>
      
      {/* Search and Filter Controls */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="search">Search</label>
              <input
                className="form-control"
                id="search"
                type="text"
                placeholder="Search by name or specialty..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="specialty">Specialty</label>
              <select
                className="form-select"
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">All Specialties</option>
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="location">Location</label>
              <input
                className="form-control"
                id="location"
                type="text"
                placeholder="City or region..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">&nbsp;</label>
              <button
                className="btn btn-secondary w-100"
                onClick={handleReset}
                type="button"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {!loading && !error && (
        <div className="mb-3 text-muted">
          Showing {doctors.length} of {pagination.count} doctors
          {pagination.count > 10 && ` (Page ${pagination.currentPage} of ${totalPages})`}
        </div>
      )}

      {/* Loading State */}
      {loading && <Loading message="Loading doctors..." />}

      {/* Error State */}
      {error && <ErrorAlert error={error} onRetry={() => fetchDoctors(pagination.currentPage)} />}

      {/* Doctors Grid */}
      {!loading && !error && (
        <>
          {doctors.length === 0 ? (
            <div className="alert alert-info">
              No doctors found matching your criteria. Try adjusting your filters.
            </div>
          ) : (
            <div className="row g-3">
              {doctors.map((doctor) => (
                <div className="col-md-4" key={doctor.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{doctor.name}</h5>
                      <p className="card-subtitle text-muted mb-2">
                        {doctor.specialty}
                      </p>
                      {doctor.location && (
                        <p className="text-muted small mb-2">
                          <i className="bi bi-geo-alt"></i> {doctor.location}
                        </p>
                      )}
                      <p className="card-text flex-grow-1">{doctor.bio}</p>
                      <p className="text-muted small mb-2">
                        {doctor.years_experience} years experience
                      </p>
                      <Link
                        className="btn btn-primary mt-auto"
                        to={`/doctors/${doctor.id}`}
                      >
                        View profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.count > 10 && (
            <div className="d-flex justify-content-center align-items-center mt-4 gap-2">
              <button
                className="btn btn-outline-primary"
                onClick={handlePreviousPage}
                disabled={!pagination.previous}
                type="button"
              >
                Previous
              </button>
              <span className="text-muted">
                Page {pagination.currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline-primary"
                onClick={handleNextPage}
                disabled={!pagination.next}
                type="button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
