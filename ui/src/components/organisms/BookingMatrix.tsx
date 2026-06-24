import { useMemo } from 'react'
import type { Booking, Computer, PingResult } from '../../api/types'
import { MatrixCell } from '../molecules/MatrixCell'
import { PingStatusDot } from '../atoms/PingStatusDot'
import { HOURS, formatHour, bookingCoversSlot } from '../../utils/time'

export interface Selection {
  computerId: number
  startHour: number
  endHour: number
}

interface BookingMatrixProps {
  computers: Computer[]
  bookings: Booking[]
  /** The day currently displayed (YYYY-MM-DD). */
  date: string
  selection: Selection | null
  onPointerDown: (computerId: number, hour: number) => void
  onPointerEnter: (computerId: number, hour: number) => void
  onComputerClick: (computer: Computer) => void
  onBookingClick: (booking: Booking) => void
  onAddComputer: () => void
  pingResults: Record<number, PingResult>
  pinging: Set<number>
}

const NAME_COL = '7rem'

export function BookingMatrix({
  computers,
  bookings,
  date,
  selection,
  onPointerDown,
  onPointerEnter,
  onComputerClick,
  onBookingClick,
  onAddComputer,
  pingResults,
  pinging,
}: BookingMatrixProps) {
  // Map "computerId:hour" -> booking covering that slot on the displayed day.
  const slotMap = useMemo(() => {
    const map = new Map<string, Booking>()
    for (const booking of bookings) {
      for (const hour of HOURS) {
        if (bookingCoversSlot(booking, date, hour)) {
          map.set(`${booking.computerId}:${hour}`, booking)
        }
      }
    }
    return map
  }, [bookings, date])

  const gridTemplate = `${NAME_COL} repeat(${HOURS.length}, minmax(2.25rem, 1fr))`

  function isSelected(computerId: number, hour: number) {
    return (
      selection !== null &&
      selection.computerId === computerId &&
      hour >= selection.startHour &&
      hour < selection.endHour
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        role="grid"
        aria-label="Booking matrix"
        className="min-w-[56rem]"
        style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
      >
        {/* Header row */}
        <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50" />
        {HOURS.map((hour) => (
          <div
            key={`h-${hour}`}
            className="border-b border-r border-slate-200 bg-slate-50 py-1 text-center text-[10px] font-medium text-slate-500"
          >
            {formatHour(hour)}
          </div>
        ))}

        {/* Computer rows */}
        {computers.map((computer) => (
          <div key={computer.id} className="contents">
            <button
              type="button"
              onClick={() => onComputerClick(computer)}
              title={`View details for ${computer.name}`}
              className="sticky left-0 z-10 flex items-center gap-1.5 border-b border-r border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PingStatusDot
                result={pingResults[computer.id]}
                pinging={pinging.has(computer.id)}
              />
              {computer.name}
            </button>
            {HOURS.map((hour) => {
              const booking = slotMap.get(`${computer.id}:${hour}`) ?? null
              return (
                <MatrixCell
                  key={`${computer.id}:${hour}`}
                  computerId={computer.id}
                  hour={hour}
                  booking={booking}
                  isExtended={
                    booking !== null && booking.startDate !== booking.endDate
                  }
                  isSelected={isSelected(computer.id, hour)}
                  onPointerDown={onPointerDown}
                  onPointerEnter={onPointerEnter}
                  onBookingClick={onBookingClick}
                />
              )
            })}
          </div>
        ))}

        {/* Trailing row: add a new computer to the lab. */}
        <div className="contents">
          <button
            type="button"
            onClick={onAddComputer}
            title="Add a computer"
            style={{ gridColumn: '1 / -1' }}
            className="flex items-center gap-1.5 border-t border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600"
          >
            <span className="text-base leading-none">+</span> Add PC
          </button>
        </div>
      </div>
    </div>
  )
}
