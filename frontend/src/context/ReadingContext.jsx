import { useEffect, useState } from 'react'
import { ReadingContext } from './readingState'

export function ReadingProvider({ children }) {
  const [textSize, setTextSize] = useState(() => {
    try { return localStorage.getItem('reading-size') === 'larger' ? 'larger' : 'standard' }
    catch { return 'standard' }
  })

  useEffect(() => {
    document.documentElement.dataset.readingSize = textSize
    try { localStorage.setItem('reading-size', textSize) }
    catch { /* The selected size still works for this visit. */ }
  }, [textSize])

  return <ReadingContext.Provider value={{ textSize, setTextSize }}>{children}</ReadingContext.Provider>
}
