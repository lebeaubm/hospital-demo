import { createContext, useContext } from 'react'

export const ReadingContext = createContext(null)

export function useReading() {
  const context = useContext(ReadingContext)
  if (!context) throw new Error('Reading preferences require a ReadingProvider.')
  return context
}
