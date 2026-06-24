import { useCallback, useEffect, useState } from 'react'
import type { Booking, Computer, NewBooking } from '../api/types'
import * as api from '../api/mockApi'

interface UseBookingsResult {
  computers: Computer[]
  bookings: Booking[]
  loading: boolean
  error: string | null
  creating: boolean
  createBooking: (payload: NewBooking) => Promise<void>
  updateBooking: (
    id: string,
    changes: Partial<Omit<Booking, 'id'>>,
  ) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
  updateComputer: (
    id: string,
    changes: Partial<Omit<Computer, 'id'>>,
  ) => Promise<void>
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
    async (id: string, changes: Partial<Omit<Booking, 'id'>>) => {
      const updated = await api.updateBooking(id, changes)
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)))
    },
    [],
  )

  const deleteBooking = useCallback(async (id: string) => {
    await api.deleteBooking(id)
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const updateComputer = useCallback(
    async (id: string, changes: Partial<Omit<Computer, 'id'>>) => {
      const updated = await api.updateComputer(id, changes)
      setComputers((prev) => prev.map((c) => (c.id === id ? updated : c)))
    },
    [],
  )

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
    reload,
  }
}
