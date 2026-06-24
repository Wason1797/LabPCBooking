export interface Computer {
  id: number
  name: string
  /** Network MAC address, e.g. "A4:5E:60:C1:7B:02". */
  macAddress: string
  /** Network IP address used to reach the machine, e.g. "10.0.12.34". */
  ipAddress: string
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
  id: number
  computerId: number
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

/** Payload for creating a computer — server assigns the id. */
export type NewComputer = Omit<Computer, 'id'>

/**
 * Reachability of a single host as returned by the API's /ping endpoint, keyed
 * by IP address in the response object.
 */
export interface HostPing {
  reachable: boolean
  /** Average round-trip latency in ms when reachable, null when unreachable. */
  latencyMs: number | null
}

/** Result of pinging a computer to check whether it is reachable. */
export interface PingResult {
  computerId: number
  online: boolean
  /** Round-trip latency in ms when online, null when offline. */
  latencyMs: number | null
  /** ISO timestamp of when the check ran. */
  checkedAt: string
}
