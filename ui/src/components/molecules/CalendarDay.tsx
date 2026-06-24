interface CalendarDayProps {
  day: number
  isSelected: boolean
  isToday: boolean
  isOutsideMonth: boolean
  onClick: () => void
}

export function CalendarDay({
  day,
  isSelected,
  isToday,
  isOutsideMonth,
  onClick,
}: CalendarDayProps) {
  const base =
    'flex size-9 items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600'

  const state = isSelected
    ? 'bg-indigo-600 font-semibold text-white hover:bg-indigo-700'
    : isOutsideMonth
      ? 'text-slate-300 hover:bg-slate-100'
      : isToday
        ? 'font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50'
        : 'text-slate-700 hover:bg-slate-100'

  return (
    <button type="button" onClick={onClick} className={`${base} ${state}`}>
      {day}
    </button>
  )
}
