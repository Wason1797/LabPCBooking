import type { Booking } from '../api/types'

/** The lab operates around the clock: 24 one-hour slots, 0..23. */
export const HOURS: number[] = Array.from({ length: 24 }, (_, h) => h)

/** Format an hour slot as "HH:00" (e.g. 9 -> "09:00", 24 -> "24:00"). */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

/** Human label for an hour range, e.g. "09:00 – 11:00". */
export function formatHourRange(startHour: number, endHour: number): string {
  return `${formatHour(startHour)} – ${formatHour(endHour)}`
}

/** Does a booking cover the given local date? (date within [startDate, endDate]) */
export function bookingCoversDate(booking: Booking, isoDate: string): boolean {
  return booking.startDate <= isoDate && isoDate <= booking.endDate
}

/** Does a booking occupy the given hour slot on the given date? */
export function bookingCoversSlot(
  booking: Booking,
  isoDate: string,
  hour: number,
): boolean {
  return (
    bookingCoversDate(booking, isoDate) &&
    hour >= booking.startHour &&
    hour < booking.endHour
  )
}

/** True if hour ranges [aStart,aEnd) and [bStart,bEnd) overlap. */
export function hourRangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

type Span = Pick<
  Booking,
  'computerId' | 'startDate' | 'endDate' | 'startHour' | 'endHour'
>

/**
 * True if two bookings occupy the same computer on overlapping days AND
 * overlapping hours — i.e. they conflict.
 */
export function bookingsOverlap(a: Span, b: Span): boolean {
  if (a.computerId !== b.computerId) return false
  const datesIntersect = a.startDate <= b.endDate && b.startDate <= a.endDate
  return (
    datesIntersect &&
    hourRangesOverlap(a.startHour, a.endHour, b.startHour, b.endHour)
  )
}
