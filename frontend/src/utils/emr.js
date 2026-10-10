export const vitalFields = [
  ['systolic', 'Systolic BP', 'mmHg', 1, 400],
  ['diastolic', 'Diastolic BP', 'mmHg', 1, 300],
  ['pulse', 'Pulse', 'bpm', 1, 350],
  ['respirations', 'Respirations', '/min', 1, 100],
  ['temperature', 'Temperature', '°C', 20, 50],
  ['oxygen', 'Oxygen saturation', '%', 0, 100],
  ['pain', 'Pain score', '/10', 0, 10],
  ['weight', 'Weight', 'kg', 1, 500],
]

export function localDateTime(value = new Date()) {
  const date = new Date(value)
  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function noteEditor(note = null, amendmentOf = null) {
  return {
    id: note?.id || null,
    client_id: note?.client_id || crypto.randomUUID(),
    revision: note?.revision || 1,
    amendment_of: note?.amendment_of || amendmentOf,
    visit_at: localDateTime(note?.visit_at || new Date()),
    assessment: note?.assessment || '', interventions: note?.interventions || '',
    response: note?.response || '', plan: note?.plan || '',
    vitals: Object.fromEntries(vitalFields.map(([key]) => [key, String(note?.vitals?.[key] ?? '')])),
    completed_tasks: [...(note?.completed_tasks || [])],
  }
}

export function notePayload(form, status = 'DRAFT') {
  const visit = new Date(form.visit_at)
  if (!Number.isFinite(visit.getTime())) throw new Error('Enter a valid visit date and time.')
  if (status === 'FINAL' && !form.assessment.trim()) throw new Error('Enter an assessment before finalizing.')
  const vitals = {}
  for (const [key, label, , low, high] of vitalFields) {
    const value = String(form.vitals[key] ?? '').trim()
    if (!value) continue
    const number = Number(value)
    if (!Number.isFinite(number) || number < low || number > high) throw new Error(`${label}: enter a number between ${low} and ${high}.`)
    vitals[key] = number
  }
  return {
    client_id: form.client_id, revision: form.revision,
    amendment_of: form.amendment_of,
    visit_at: visit.toISOString(), assessment: form.assessment.trim(),
    interventions: form.interventions.trim(), response: form.response.trim(),
    plan: form.plan.trim(), vitals, completed_tasks: form.completed_tasks, status,
  }
}
