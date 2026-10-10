import { useEffect, useId, useRef, useState } from 'react'

export default function ScrollableTable({ children, label = 'Information table', className = '', ...props }) {
  const container = useRef(null)
  const hintId = useId()
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const element = container.current
    if (!element) return
    let frame
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setOverflows(element.scrollWidth > element.clientWidth + 1))
    }
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(element)
    if (element.firstElementChild) observer?.observe(element.firstElementChild)
    window.addEventListener('resize', measure)
    measure()
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [children])

  return (
    <div className={`scroll-table-shell ${className.replace(/\btable-responsive\b/g, '')}`} {...props}>
      {overflows && <p className="table-scroll-hint" id={hintId}><span aria-hidden="true">↔</span> Scroll to see more columns.<span className="visually-hidden"> Use the arrow keys when the table is focused.</span></p>}
      <div ref={container} className="table-responsive readable-table" role="region" aria-label={label} aria-describedby={overflows ? hintId : undefined} tabIndex={overflows ? 0 : undefined}>
        {children}
      </div>
    </div>
  )
}
