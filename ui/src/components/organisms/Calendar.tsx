import { useState } from 'react'
import { CalendarDay } from '../molecules/CalendarDay'
import { Button } from '../atoms/Button'
import { fromISODate, toISODate, todayISO } from '../../utils/date'

interface CalendarProps {
  selectedDate: string
  onSelect: (isoDate: string) => void
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function Calendar({ selectedDate, onSelect }: CalendarProps) {
  const selected = fromISODate(selectedDate)
  const [view, setView] = useState({
    year: selected.getFullYear(),
    month: selected.getMonth(),
  })

  const firstOfMonth = new Date(view.year, view.month, 1)
  const startOffset = firstOfMonth.getDay() // 0 = Sunday
  const today = todayISO()

  // 6 weeks * 7 days = 42 cells, starting on the Sunday on/before the 1st.
  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(view.year, view.month, 1 - startOffset + i)
    return {
      iso: toISODate(date),
      day: date.getDate(),
      outside: date.getMonth() !== view.month,
    }
  })

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function goToToday() {
    const now = fromISODate(today)
    setView({ year: now.getFullYear(), month: now.getMonth() })
    onSelect(today)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">
          {MONTHS[view.month]} {view.year}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="flex h-7 items-center justify-center text-xs font-medium text-slate-400"
          >
            {wd}
          </div>
        ))}
        {cells.map((cell) => (
          <CalendarDay
            key={cell.iso}
            day={cell.day}
            isSelected={cell.iso === selectedDate}
            isToday={cell.iso === today}
            isOutsideMonth={cell.outside}
            onClick={() => onSelect(cell.iso)}
          />
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="ghost" className="text-xs" onClick={goToToday}>
          Today
        </Button>
      </div>
    </div>
  )
}
