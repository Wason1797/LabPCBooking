import { useCallback, useEffect, useState } from 'react'
import type { Booking, Computer, NewBooking, NewComputer } from '../api/types'
import * as api from '../api/client'

interface UseBookingsResult {
  computers: Computer[]
  bookings: Booking[]
  loading: boolean
  error: string | null
  creating: boolean
  createBooking: (payload: NewBooking) => Promise<void>
  updateBooking: (
    id: number,
    changes: Partial<Omit<Booking, 'id'>>,
  ) => Promise<void>
  deleteBooking: (id: number) => Promise<void>
  updateComputer: (
    id: number,
    changes: Partial<Omit<Computer, 'id'>>,
  ) => Promise<void>
  addComputer: (payload: NewComputer) => Promise<Computer>
  deleteComputer: (id: number) => Promise<void>
  reload: () => void
}

export function useBookings(): UseBookingsResult {
  const [computers, setComputers] = useState<Computer[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // No setState before the first await, so it's safe to call from an effect.
  const fetchData = useCallback(async () => {
    try {
      const [comps, books] = await Promise.all([
        api.getComputers(),
        api.getBookings(),
      ])
      setComputers(comps)
      setBookings(books)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial data fetch on mount; setState happens only after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData()
  }, [fetchData])

  const reload = useCallback(() => {
    setLoading(true)
    void fetchData()
  }, [fetchData])

  const createBooking = useCallback(async (payload: NewBooking) => {
    setCreating(true)
    setError(null)
    try {
      const created = await api.createBooking(payload)
      setBookings((prev) => [...prev, created])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking')
      throw err
    } finally {
      setCreating(false)
    }
  }, [])

  const updateBooking = useCallback(
    async (id: number, changes: Partial<Omit<Booking, 'id'>>) => {
      const updated = await api.updateBooking(id, changes)
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)))
    },
    [],
  )

  const deleteBooking = useCallback(async (id: number) => {
    await api.deleteBooking(id)
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const updateComputer = useCallback(
    async (id: number, changes: Partial<Omit<Computer, 'id'>>) => {
      const updated = await api.updateComputer(id, changes)
      setComputers((prev) => prev.map((c) => (c.id === id ? updated : c)))
    },
    [],
  )

  const addComputer = useCallback(async (payload: NewComputer) => {
    const created = await api.createComputer(payload)
    setComputers((prev) => [...prev, created])
    return created
  }, [])

  // Removing a PC also drops its bookings, matching the API behaviour.
  const deleteComputer = useCallback(async (id: number) => {
    await api.deleteComputer(id)
    setComputers((prev) => prev.filter((c) => c.id !== id))
    setBookings((prev) => prev.filter((b) => b.computerId !== id))
  }, [])

  return {
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
    reload,
  }
}
