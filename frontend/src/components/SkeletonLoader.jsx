import './SkeletonLoader.css'

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="skeleton-table">
      <div className="skeleton skeleton-table-header"></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton skeleton-table-row"></div>
      ))}
    </div>
  )
}

export function SkeletonList() {
  return (
    <div className="skeleton-list">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-list-item">
          <div className="skeleton skeleton-avatar"></div>
          <div className="skeleton-list-content">
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text short"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonAppointmentCard() {
  return (
    <div className="skeleton-appointment-card">
      <div className="skeleton-appointment-header">
        <div className="skeleton skeleton-badge"></div>
        <div className="skeleton skeleton-text"></div>
      </div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton-button-group">
        <div className="skeleton skeleton-button small"></div>
        <div className="skeleton skeleton-button small"></div>
      </div>
    </div>
  )
}

export function SkeletonDoctorCard() {
  return (
    <div className="skeleton-doctor-card">
      <div className="skeleton skeleton-avatar large"></div>
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <div className="skeleton skeleton-avatar xlarge"></div>
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="mt-4">
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text short"></div>
      </div>
    </div>
  )
}
