interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className = '', label = 'Loading…' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block size-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 ${className}`}
    />
  )
}
