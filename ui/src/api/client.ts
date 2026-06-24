import type {
  Booking,
  Computer,
  HostPing,
  NewBooking,
  NewComputer,
} from './types'

/**
 * HTTP client for the PC Booking API. The base URL defaults to the API exposed
 * by docker-compose on :8000 and can be overridden with VITE_API_URL at build
 * time. The backend enables permissive CORS, so the browser talks to it
 * directly.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Request failed: ${res.status} ${res.statusText}${
        detail ? ` — ${detail}` : ''
      }`,
    )
  }
  // 204 No Content (deletes) carries no body to parse.
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function getComputers(): Promise<Computer[]> {
  return request<Computer[]>('/computers')
}

export function getBookings(): Promise<Booking[]> {
  return request<Booking[]>('/bookings')
}

export function createBooking(payload: NewBooking): Promise<Booking> {
  return request<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateBooking(
  id: number,
  changes: Partial<Omit<Booking, 'id'>>,
): Promise<Booking> {
  return request<Booking>(`/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export function deleteBooking(id: number): Promise<void> {
  return request<void>(`/bookings/${id}`, { method: 'DELETE' })
}

export function createComputer(payload: NewComputer): Promise<Computer> {
  return request<Computer>('/computers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateComputer(
  id: number,
  changes: Partial<Omit<Computer, 'id'>>,
): Promise<Computer> {
  return request<Computer>(`/computers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

/**
 * Delete a computer. The API cascades the delete to all of its bookings (see
 * the bookings.computer_id ON DELETE CASCADE foreign key).
 */
export function deleteComputer(id: number): Promise<void> {
  return request<void>(`/computers/${id}`, { method: 'DELETE' })
}

/**
 * Check reachability of a batch of hosts. Returns an object keyed by IP, each
 * value carrying whether the host responded and its average latency.
 */
export function pingHosts(ips: string[]): Promise<Record<string, HostPing>> {
  return request<Record<string, HostPing>>('/ping', {
    method: 'POST',
    body: JSON.stringify({ ips }),
  })
}
