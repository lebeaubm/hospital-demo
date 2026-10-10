import ScrollableTable from './ScrollableTable'
import { assessmentFields } from '../utils/emrWorkspace'

export default function EMRAssessments({ records, onAdd, removed, saving }) {
  return <div className="card"><div className="card-body"><div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3"><h3 className="h5 mb-0">Assessment history</h3><button className="btn btn-primary btn-sm" type="button" disabled={removed || saving} onClick={onAdd}>Record assessment</button></div>
    {!records.length ? <p className="text-muted mb-0">No assessments recorded yet.</p> : <ScrollableTable className="table-responsive" label="Assessment history"><table className="table table-hover table-sm emr-assessment-table"><caption>Recorded observations are kept in the patient chart.</caption><thead><tr><th scope="col">Recorded</th>{assessmentFields.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}<th scope="col">Pain (0–10)</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><th scope="row"><span>{new Date(record.observed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span><small className="d-block text-muted fw-normal">{record.author_name}</small>{record.notes && <details className="small fw-normal mt-2"><summary>Notes</summary><p className="emr-note-text mt-2 mb-0">{record.notes}</p></details>}</th>{assessmentFields.map(([key]) => <td key={key}>{record.findings[key] ?? '—'}</td>)}<td>{record.findings.pain ?? '—'}</td></tr>)}</tbody></table></ScrollableTable>}
  </div></div>
}
