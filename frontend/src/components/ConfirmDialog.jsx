import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ message, actionLabel, onDecision }) {
  const dialog = useRef(null)
  useEffect(() => {
    const previousFocus = document.activeElement
    const buttons = Array.from(dialog.current.querySelectorAll('button'))
    buttons[0]?.focus()
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); onDecision(false) }
      if (event.key === 'Tab') {
        event.preventDefault()
        const index = buttons.indexOf(document.activeElement)
        buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus()
      }
    }
    document.addEventListener('keydown', handleKey, true)
    return () => { document.removeEventListener('keydown', handleKey, true); if (previousFocus?.isConnected) previousFocus.focus() }
  }, [onDecision])
  return <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 2100 }}><div className="modal-dialog modal-dialog-centered"><div className="modal-content" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message"><div className="modal-body p-4"><h2 className="h5 mb-3" id="confirm-dialog-title">{actionLabel}</h2><p className="mb-0" id="confirm-dialog-message">{message}</p></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => onDecision(false)}>Cancel</button><button type="button" className="btn btn-primary" onClick={() => onDecision(true)}>{actionLabel}</button></div></div></div></div>
}
