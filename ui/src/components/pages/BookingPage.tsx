import { useCallback, useMemo, useState } from 'react'
import { BookingLayout } from '../templates/BookingLayout'
import { Calendar } from '../organisms/Calendar'
import { BookingMatrix } from '../organisms/BookingMatrix'
import type { Selection } from '../organisms/BookingMatrix'
import { BookingFormModal } from '../organisms/BookingFormModal'
import { BookingDetailsModal } from '../organisms/BookingDetailsModal'
import { ComputerDetailsModal } from '../organisms/ComputerDetailsModal'
import { ComputerFormModal } from '../organisms/ComputerFormModal'
import { Legend } from '../molecules/Legend'
import { Spinner } from '../atoms/Spinner'
import { Button } from '../atoms/Button'
import { useBookings } from '../../hooks/useBookings'
import { useDragSelection } from '../../hooks/useDragSelection'
import { usePing } from '../../hooks/usePing'
import { todayISO, formatLongDate } from '../../utils/date'
import { bookingCoversSlot } from '../../utils/time'
import type { Computer, NewBooking } from '../../api/types'

export function BookingPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const {
    computers,
    bookings,
    loading,
    error,
    creating,
    createBooking,
    updateBooking,
    deleteBooking,
    updateComputer,
    addComputer,
    deleteComputer,
  } = useBookings()

  const [modalSelection, setModalSelection] = useState<Selection | null>(null)
  const [modalComputer, setModalComputer] = useState<Computer | null>(null)
  const [detailsComputerId, setDetailsComputerId] = useState<number | null>(
    null,
  )
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null,
  )
  const [addingComputer, setAddingComputer] = useState(false)

  // Read the booking from the live list so it disappears once deleted.
  const selectedBooking =
    bookings.find((b) => b.id === selectedBookingId) ?? null

  // Read details from the live list so edits show immediately after saving.
  const detailsComputer =
    computers.find((c) => c.id === detailsComputerId) ?? null

  // Reachability: ping all PCs on load + every 5 minutes, or on demand.
  const {
    results: pingResults,
    pinging,
    pingOne,
    pingAll,
  } = usePing(computers)

  // Fast lookup of booked slots for the displayed day.
  const bookedSlots = useMemo(() => {
    const set = new Set<string>()
    for (const booking of bookings) {
      for (let h = booking.startHour; h < booking.endHour; h++) {
        if (bookingCoversSlot(booking, selectedDate, h)) {
          set.add(`${booking.computerId}:${h}`)
        }
      }
    }
    return set
  }, [bookings, selectedDate])

  const isSlotBooked = useCallback(
    (computerId: number, hour: number) =>
      bookedSlots.has(`${computerId}:${hour}`),
    [bookedSlots],
  )

  const handleComplete = useCallback(
    (selection: Selection) => {
      const computer =
        computers.find((c) => c.id === selection.computerId) ?? null
      setModalComputer(computer)
      setModalSelection(selection)
    },
    [computers],
  )

  const { selection, onPointerDown, onPointerEnter, clear } = useDragSelection({
    isSlotBooked,
    onComplete: handleComplete,
  })

  function closeModal() {
    setModalSelection(null)
    setModalComputer(null)
    clear()
  }

  async function handleSubmit(payload: NewBooking) {
    await createBooking(payload)
    closeModal()
  }

  // Bookings on the PC shown in the details modal — surfaced before deletion.
  const detailsBookingCount = bookings.filter(
    (b) => b.computerId === detailsComputerId,
  ).length

  return (
    <BookingLayout
      sidebar={
        <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
      }
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {formatLongDate(selectedDate)}
          </h2>
          <p className="text-sm text-slate-500">
            {computers.length} computers · drag across free hours to book
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Status auto-checks every 5 min
            </span>
            <Button
              variant="secondary"
              onClick={() => void pingAll()}
              disabled={pinging.size > 0}
            >
              {pinging.size > 0 ? 'Pinging…' : 'Ping all'}
            </Button>
          </div>
          <Legend />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-slate-400">
          <Spinner /> Loading bookings…
        </div>
      ) : (
        <BookingMatrix
          computers={computers}
          bookings={bookings}
          date={selectedDate}
          selection={selection}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
          onComputerClick={(computer) => setDetailsComputerId(computer.id)}
          onBookingClick={(booking) => setSelectedBookingId(booking.id)}
          onAddComputer={() => setAddingComputer(true)}
          pingResults={pingResults}
          pinging={pinging}
        />
      )}

      <BookingDetailsModal
        open={selectedBooking !== null}
        booking={selectedBooking}
        computerName={
          computers.find((c) => c.id === selectedBooking?.computerId)?.name ?? ''
        }
        allBookings={bookings}
        onClose={() => setSelectedBookingId(null)}
        onUpdate={updateBooking}
        onDelete={deleteBooking}
      />

      <ComputerDetailsModal
        open={detailsComputer !== null}
        computer={detailsComputer}
        bookingCount={detailsBookingCount}
        pingResult={
          detailsComputer ? pingResults[detailsComputer.id] : undefined
        }
        pinging={detailsComputer ? pinging.has(detailsComputer.id) : false}
        onPing={(id) => void pingOne(id)}
        onClose={() => setDetailsComputerId(null)}
        onSave={updateComputer}
        onDelete={deleteComputer}
      />

      <ComputerFormModal
        open={addingComputer}
        onClose={() => setAddingComputer(false)}
        onSubmit={async (payload) => {
          await addComputer(payload)
        }}
      />

      <BookingFormModal
        open={modalSelection !== null}
        computer={modalComputer}
        date={selectedDate}
        selection={modalSelection}
        creating={creating}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </BookingLayout>
  )
}
