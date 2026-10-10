import { useReading } from '../context/readingState'
import ThemeToggle from './ThemeToggle'

export default function ReadingTools() {
  const { textSize, setTextSize } = useReading()
  return (
    <div className="reading-tools">
      <div className="container reading-tools__inner">
        <a className="reading-tools__help" href="tel:9516213600">Need help? Call (951) 621-3600</a>
        <details className="reading-tools__options">
          <summary className="reading-tools__toggle">
            Display options
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="reading-tools__controls">
            <div className="reading-size-control" role="group" aria-label="Text size">
              <span>Text size</span>
              <button type="button" aria-pressed={textSize === 'standard'} onClick={() => setTextSize('standard')}>Standard</button>
              <button type="button" aria-pressed={textSize === 'larger'} onClick={() => setTextSize('larger')}>Larger</button>
            </div>
            <ThemeToggle />
          </div>
        </details>
      </div>
    </div>
  )
}
