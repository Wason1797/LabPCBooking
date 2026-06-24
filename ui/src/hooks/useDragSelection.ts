import { useCallback, useEffect, useRef, useState } from 'react'
import type { Selection } from '../components/organisms/BookingMatrix'

interface UseDragSelectionOptions {
  /** Whether a given slot is already booked (and therefore not selectable). */
  isSlotBooked: (computerId: number, hour: number) => boolean
  /** Called with the final selection when the drag ends. */
  onComplete: (selection: Selection) => void
}

interface UseDragSelectionResult {
  selection: Selection | null
  onPointerDown: (computerId: number, hour: number) => void
  onPointerEnter: (computerId: number, hour: number) => void
  clear: () => void
}

/**
 * Pointer-based drag selection of a contiguous range of free hours within a
 * single computer row. Selection is clamped so it never crosses a booked slot.
 */
export function useDragSelection({
  isSlotBooked,
  onComplete,
}: UseDragSelectionOptions): UseDragSelectionResult {
  const [selection, setSelection] = useState<Selection | null>(null)
  const dragging = useRef(false)
  const anchor = useRef<{ computerId: number; hour: number } | null>(null)

  const clear = useCallback(() => {
    dragging.current = false
    anchor.current = null
    setSelection(null)
  }, [])

  const onPointerDown = useCallback(
    (computerId: number, hour: number) => {
      if (isSlotBooked(computerId, hour)) return
      dragging.current = true
      anchor.current = { computerId, hour }
      setSelection({ computerId, startHour: hour, endHour: hour + 1 })
    },
    [isSlotBooked],
  )

  const onPointerEnter = useCallback(
    (computerId: number, hour: number) => {
      if (!dragging.current || !anchor.current) return
      if (computerId !== anchor.current.computerId) return // stay in one row

      const a = anchor.current.hour
      // Extend from the anchor toward the hovered hour, stopping before any
      // booked slot so the selection is always a free, contiguous block.
      let lo = a
      let hi = a
      if (hour >= a) {
        for (let h = a; h <= hour; h++) {
          if (isSlotBooked(computerId, h)) break
          hi = h
        }
      } else {
        for (let h = a; h >= hour; h--) {
          if (isSlotBooked(computerId, h)) break
          lo = h
        }
      }
      setSelection({ computerId, startHour: lo, endHour: hi + 1 })
    },
    [isSlotBooked],
  )

  useEffect(() => {
    function handleUp() {
      if (!dragging.current) return
      dragging.current = false
      anchor.current = null
      setSelection((current) => {
        if (current) onComplete(current)
        return current
      })
    }
    window.addEventListener('pointerup', handleUp)
    return () => window.removeEventListener('pointerup', handleUp)
  }, [onComplete])

  return { selection, onPointerDown, onPointerEnter, clear }
}
