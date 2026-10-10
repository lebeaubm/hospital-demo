import { Link } from 'react-router-dom'

export default function AccountLayout({ title, description, children }) {
  return (
    <div className="auth-page">
      <header className="auth-page__header">
        <img src="/favicon.svg" alt="" width="54" height="54" />
        <p className="page-eyebrow">Peaceloving Home Health</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
      <Link className="page-text-link auth-page__back" to="/team"><span aria-hidden="true">←</span> Back to our team</Link>
    </div>
  )
}
