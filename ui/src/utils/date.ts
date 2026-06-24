/** Convert a Date to a local "YYYY-MM-DD" string (no timezone shift). */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse a "YYYY-MM-DD" string into a local Date at midnight. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, days: number): string {
  const date = fromISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** Inclusive list of ISO dates from start to end. Empty if end < start. */
export function eachDayInRange(startISO: string, endISO: string): string[] {
  const days: string[] = []
  let cursor = startISO
  while (cursor <= endISO) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

/** e.g. "Thu, Jun 18, 2026" */
export function formatLongDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** e.g. "14:05" — local time from a full ISO timestamp. */
export function formatTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** e.g. "Jun 18" */
export function formatShortDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
