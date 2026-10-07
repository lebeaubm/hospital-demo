export default function PageHero({ eyebrow, title, description, image, imageAlt, children }) {
  return (
    <header className={`page-hero${image ? ' page-hero--split' : ''}`}>
      <div className="page-hero__copy">
        <p className="page-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-lead">{description}</p>}
        {children && <div className="page-actions">{children}</div>}
      </div>
      {image && <img className="page-hero__image" src={image} alt={imageAlt} decoding="async" />}
    </header>
  )
}
