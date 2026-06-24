const ITEMS = [
  { label: 'Available', className: 'bg-white border border-slate-300' },
  { label: 'Booked', className: 'bg-indigo-500' },
  { label: 'Extended (multi-day)', className: 'bg-amber-500' },
  { label: 'Selecting', className: 'bg-emerald-400' },
]

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
      {ITEMS.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`inline-block size-3 rounded-sm ${item.className}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
