export interface Computer {
  id: string
  name: string
  /** Network MAC address, e.g. "A4:5E:60:C1:7B:02". */
  macAddress: string
  /** Currently deployed OS image, e.g. "Windows 11 Edu 23H2". */
  osImage: string
  /** Name of the user/person assigned to this machine. */
  assignedUser: string
  /** Contact email for the assigned user. */
  assignedUserEmail: string
  /** Local login password for the machine. */
  password: string
}

export interface Booking {
  id: string
  computerId: string
  studentName: string
  studentEmail: string
  projectName: string
  /** Inclusive first day the booking applies to (YYYY-MM-DD, local). */
  startDate: string
  /** Inclusive last day the booking applies to. Equals startDate for single-day bookings. */
  endDate: string
  /** Inclusive first hour slot (0–23). */
  startHour: number
  /** Exclusive end hour slot (1–24). A 09:00–11:00 booking is startHour 9, endHour 11. */
  endHour: number
}

/** Payload for creating a booking — server assigns the id. */
export type NewBooking = Omit<Booking, 'id'>

/** Result of pinging a computer to check whether it is reachable. */
export interface PingResult {
  computerId: string
  online: boolean
  /** Round-trip latency in ms when online, null when offline. */
  latencyMs: number | null
  /** ISO timestamp of when the check ran. */
  checkedAt: string
}
