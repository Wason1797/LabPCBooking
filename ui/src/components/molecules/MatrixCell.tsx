import type { Booking } from '../../api/types'
import { formatHour, formatHourRange } from '../../utils/time'
import { formatLongDate } from '../../utils/date'

interface MatrixCellProps {
  computerId: number
  hour: number
  booking: Booking | null
  isExtended: boolean
  isSelected: boolean
  onPointerDown: (computerId: number, hour: number) => void
  onPointerEnter: (computerId: number, hour: number) => void
  onBookingClick: (booking: Booking) => void
}

export function MatrixCell({
  computerId,
  hour,
  booking,
  isExtended,
  isSelected,
  onPointerDown,
  onPointerEnter,
  onBookingClick,
}: MatrixCellProps) {
  let stateClass: string
  let title: string

  if (isSelected) {
    stateClass = 'bg-emerald-400'
    title = `Select ${formatHour(hour)}`
  } else if (booking) {
    stateClass = isExtended
      ? 'bg-amber-500 hover:bg-amber-600'
      : 'bg-indigo-500 hover:bg-indigo-600'
    const range =
      booking.startDate === booking.endDate
        ? formatLongDate(booking.startDate)
        : `${formatLongDate(booking.startDate)} → ${formatLongDate(booking.endDate)}`
    title = `${booking.studentName} — ${booking.projectName}\n${range}, ${formatHourRange(booking.startHour, booking.endHour)}`
  } else {
    stateClass = 'bg-white hover:bg-emerald-50'
    title = `${formatHour(hour)} · available`
  }

  return (
    <div
      role="gridcell"
      aria-label={title}
      title={title}
      data-computer={computerId}
      data-hour={hour}
      onPointerDown={(e) => {
        if (booking) return
        e.preventDefault()
        onPointerDown(computerId, hour)
      }}
      onPointerEnter={() => onPointerEnter(computerId, hour)}
      onClick={() => {
        if (booking) onBookingClick(booking)
      }}
      className={`h-9 cursor-pointer border-b border-r border-slate-200 ${stateClass} touch-none select-none`}
    />
  )
}
