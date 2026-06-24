import type { Booking, Computer, NewBooking, PingResult } from './types'

/**
 * Mock API backed by static JSON files served from /mock.
 * Newly created bookings are kept in an in-memory store for the session, so
 * swapping in a real backend later means changing only this file.
 */

const LATENCY_MS = 350

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

let computersCache: Computer[] | null = null
let bookingsStore: Booking[] | null = null

async function loadComputers(): Promise<Computer[]> {
  if (!computersCache) {
    const res = await fetch('/mock/computers.json')
    if (!res.ok) throw new Error('Failed to load computers')
    computersCache = (await res.json()) as Computer[]
  }
  return computersCache
}

async function loadBookings(): Promise<Booking[]> {
  if (!bookingsStore) {
    const res = await fetch('/mock/bookings.json')
    if (!res.ok) throw new Error('Failed to load bookings')
    bookingsStore = (await res.json()) as Booking[]
  }
  return bookingsStore
}

export async function getComputers(): Promise<Computer[]> {
  const computers = await loadComputers()
  return delay([...computers])
}

export async function getBookings(): Promise<Booking[]> {
  const bookings = await loadBookings()
  return delay([...bookings])
}

let nextId = 1
function generateId(): string {
  return `bk-new-${nextId++}-${performance.now().toFixed(0)}`
}

export async function createBooking(payload: NewBooking): Promise<Booking> {
  const bookings = await loadBookings()
  const booking: Booking = { ...payload, id: generateId() }
  bookings.push(booking)
  return delay(booking)
}

export async function updateBooking(
  id: string,
  changes: Partial<Omit<Booking, 'id'>>,
): Promise<Booking> {
  const bookings = await loadBookings()
  const index = bookings.findIndex((b) => b.id === id)
  if (index === -1) throw new Error(`Unknown booking: ${id}`)
  const updated = { ...bookings[index], ...changes }
  bookings[index] = updated
  return delay(updated)
}

export async function deleteBooking(id: string): Promise<void> {
  const bookings = await loadBookings()
  const index = bookings.findIndex((b) => b.id === id)
  if (index !== -1) bookings.splice(index, 1)
  return delay(undefined)
}

/**
 * Mock of pinging a computer. The real API would use the machine's network
 * details (MAC/IP) to send an actual ICMP/wake request; here we simulate a
 * round-trip with a randomized reachable/unreachable result.
 */
export async function pingComputer(id: string): Promise<PingResult> {
  const computers = await loadComputers()
  if (!computers.some((c) => c.id === id)) {
    throw new Error(`Unknown computer: ${id}`)
  }
  // Simulate the network round-trip taking a variable amount of time.
  const rtt = 200 + Math.random() * 500
  await new Promise((resolve) => setTimeout(resolve, rtt))

  const online = Math.random() > 0.2 // ~80% reachable
  return {
    computerId: id,
    online,
    latencyMs: online ? Math.round(4 + Math.random() * 56) : null,
    checkedAt: new Date().toISOString(),
  }
}

export async function updateComputer(
  id: string,
  changes: Partial<Omit<Computer, 'id'>>,
): Promise<Computer> {
  const computers = await loadComputers()
  const index = computers.findIndex((c) => c.id === id)
  if (index === -1) throw new Error(`Unknown computer: ${id}`)
  const updated = { ...computers[index], ...changes }
  computers[index] = updated
  return delay(updated)
}
