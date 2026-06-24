import { useCallback, useEffect, useRef, useState } from 'react'
import type { PingResult } from '../api/types'
import * as api from '../api/client'
import { formatTime } from '../utils/date'

const FIVE_MINUTES = 5 * 60 * 1000

export type PingStatus = 'online' | 'offline' | 'unknown'

/** The minimum a computer needs for a reachability check: an id and an IP. */
export interface PingTarget {
  id: number
  ipAddress: string
}

interface UsePingResult {
  results: Record<number, PingResult>
  /** Computer ids with a ping currently in flight. */
  pinging: Set<number>
  pingOne: (id: number) => Promise<void>
  pingAll: () => Promise<void>
}

/**
 * Tracks reachability of the given computers via the API's /ping endpoint.
 * Pings them all in a single batch on mount and then every 5 minutes; the
 * on-demand pingOne checks a single machine, and pingAll re-checks them all.
 */
export function usePing(computers: PingTarget[]): UsePingResult {
  const [results, setResults] = useState<Record<number, PingResult>>({})
  const [pinging, setPinging] = useState<Set<number>>(new Set())

  // Latest targets, read by the callbacks/interval without making them re-bind.
  // Synced in an effect (not during render) so a single ping can always resolve
  // an id to its current IP. Declared before the ping effect so it runs first.
  const targetsRef = useRef(computers)
  useEffect(() => {
    targetsRef.current = computers
  })

  const markPinging = useCallback((ids: number[], inFlight: boolean) => {
    setPinging((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (inFlight) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }, [])

  // Core: ping a set of targets with one /ping call and fold the IP-keyed
  // response back into per-computer results.
  const runPing = useCallback(
    async (targets: PingTarget[]) => {
      const valid = targets.filter((t) => t.ipAddress)
      if (valid.length === 0) return
      const ids = valid.map((t) => t.id)
      markPinging(ids, true)
      try {
        const byIp = await api.pingHosts(valid.map((t) => t.ipAddress))
        const checkedAt = new Date().toISOString()
        setResults((prev) => {
          const next = { ...prev }
          for (const t of valid) {
            const host = byIp[t.ipAddress]
            next[t.id] = {
              computerId: t.id,
              online: host?.reachable ?? false,
              latencyMs:
                host && host.latencyMs != null
                  ? Math.round(host.latencyMs)
                  : null,
              checkedAt,
            }
          }
          return next
        })
      } catch (err) {
        // Leave previous statuses intact if the check itself failed.
        console.error('Ping request failed', err)
      } finally {
        markPinging(ids, false)
      }
    },
    [markPinging],
  )

  // On-demand single-machine check for the details-modal button.
  const pingOne = useCallback(
    async (id: number) => {
      const target = targetsRef.current.find((t) => t.id === id)
      if (target) await runPing([target])
    },
    [runPing],
  )

  // On-demand "ping everything", in one batched call.
  const pingAll = useCallback(() => runPing(targetsRef.current), [runPing])

  // Stable key so the effect only re-runs when the target set (id or IP)
  // actually changes, not on every render.
  const targetsKey = computers.map((c) => `${c.id}:${c.ipAddress}`).join(',')

  useEffect(() => {
    if (targetsRef.current.length === 0) return
    void runPing(targetsRef.current)
    const timer = setInterval(() => void runPing(targetsRef.current), FIVE_MINUTES)
    return () => clearInterval(timer)
  }, [targetsKey, runPing])

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
