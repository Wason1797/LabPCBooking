import { useCallback, useEffect, useState } from 'react'
import type { PingResult } from '../api/types'
import * as api from '../api/mockApi'
import { formatTime } from '../utils/date'

const FIVE_MINUTES = 5 * 60 * 1000

export type PingStatus = 'online' | 'offline' | 'unknown'

interface UsePingResult {
  results: Record<string, PingResult>
  /** Computer ids with a ping currently in flight. */
  pinging: Set<string>
  pingOne: (id: string) => Promise<void>
  pingAll: () => Promise<void>
}

/**
 * Tracks reachability of the given computers. Pings them all once on mount and
 * then automatically every 5 minutes; individual machines can also be pinged
 * on demand via pingOne (or all of them via pingAll).
 */
export function usePing(computerIds: string[]): UsePingResult {
  const [results, setResults] = useState<Record<string, PingResult>>({})
  const [pinging, setPinging] = useState<Set<string>>(new Set())

  const pingOne = useCallback(async (id: string) => {
    setPinging((prev) => new Set(prev).add(id))
    try {
      const result = await api.pingComputer(id)
      setResults((prev) => ({ ...prev, [id]: result }))
    } finally {
      setPinging((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [])

  const pingMany = useCallback(
    async (ids: string[]) => {
      await Promise.all(ids.map((id) => pingOne(id)))
    },
    [pingOne],
  )

  // Stable string key so the effect only re-runs when the id set changes.
  const idsKey = computerIds.join(',')

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : []
    if (!ids.length) return
    void pingMany(ids)
    const timer = setInterval(() => void pingMany(ids), FIVE_MINUTES)
    return () => clearInterval(timer)
  }, [idsKey, pingMany])

  // Public on-demand "ping everything" using the current id list.
  const pingAll = useCallback(
    () => pingMany(computerIds),
    [pingMany, computerIds],
  )

  return { results, pinging, pingOne, pingAll }
}

export function statusOf(result: PingResult | undefined): PingStatus {
  if (!result) return 'unknown'
  return result.online ? 'online' : 'offline'
}

/** Human label for a ping result, e.g. for a tooltip or status line. */
export function pingLabel(result: PingResult | undefined): string {
  if (!result) return 'Status unknown — not pinged yet'
  if (result.online) {
    return `Online · ${result.latencyMs} ms · checked ${formatTime(result.checkedAt)}`
  }
  return `Offline · checked ${formatTime(result.checkedAt)}`
}
