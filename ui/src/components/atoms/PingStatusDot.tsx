import type { PingResult } from '../../api/types'
import { statusOf, pingLabel } from '../../hooks/usePing'

interface PingStatusDotProps {
  result: PingResult | undefined
  pinging?: boolean
  className?: string
}

const COLOR = {
  online: 'bg-emerald-500',
  offline: 'bg-rose-500',
  unknown: 'bg-slate-300',
}

export function PingStatusDot({
  result,
  pinging = false,
  className = '',
}: PingStatusDotProps) {
  const status = statusOf(result)
  return (
    <span
      title={pinging ? 'Pinging…' : pingLabel(result)}
      className={`inline-block size-2 shrink-0 rounded-full ${COLOR[status]} ${
        pinging ? 'animate-pulse' : ''
      } ${className}`}
    />
  )
}
