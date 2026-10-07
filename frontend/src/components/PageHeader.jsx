export default function PageHeader({ title, description, eyebrow, className = '' }) {
  return (
    <header className={`workspace-page-header ${className}`}>
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  )
}
