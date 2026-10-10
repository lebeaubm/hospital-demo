export function doctorListFromResponse(data) {
  const doctors = Array.isArray(data) ? data : data?.results
  if (!Array.isArray(doctors) || doctors.some(doctor => !doctor || !Number.isInteger(doctor.id) || doctor.id < 1)) {
    throw new Error('The available doctors could not be loaded. Please try again.')
  }
  return doctors
}

export function prepareAppointmentRequest(form, doctors, now = Date.now()) {
  if (!doctors.some(doctor => String(doctor.id) === String(form.doctor))) {
    throw new Error('Please select an available doctor before submitting.')
  }
  const requestedTime = new Date(form.requested_start).getTime()
  if (!Number.isFinite(requestedTime) || requestedTime <= now) {
    throw new Error('Please choose a future appointment date and time.')
  }
  const reason = form.reason.trim()
  if (!reason || reason.length > 255) {
    throw new Error('Please enter a reason for the visit using 255 characters or fewer.')
  }
  const notes = form.patient_notes.trim()
  if (notes.length > 5000) {
    throw new Error('Please keep additional notes to 5,000 characters or fewer.')
  }
  return {
    doctor: Number(form.doctor),
    requested_start: new Date(requestedTime).toISOString(),
    reason,
    patient_notes: notes,
  }
}
