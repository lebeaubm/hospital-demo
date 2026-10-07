import { useReading } from '../context/readingState'
import ThemeToggle from './ThemeToggle'

export default function ReadingTools() {
  const { textSize, setTextSize } = useReading()
  return (
    <div className="reading-tools">
      <div className="container reading-tools__inner">
        <a className="reading-tools__help" href="tel:9516213600">Need help? Call (951) 621-3600</a>
        <div className="reading-tools__controls">
          <div className="reading-size-control" role="group" aria-label="Text size">
            <span>Text size</span>
            <button type="button" aria-pressed={textSize === 'standard'} onClick={() => setTextSize('standard')}>Standard</button>
            <button type="button" aria-pressed={textSize === 'larger'} onClick={() => setTextSize('larger')}>Larger</button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
