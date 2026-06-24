import { Select } from '../atoms/Select'
import { FormField } from './FormField'
import { formatLongDate } from '../../utils/date'

interface DateRangeSelectProps {
  options: string[]
  startDate: string
  endDate: string
  onChangeStart: (iso: string) => void
  onChangeEnd: (iso: string) => void
}

export function DateRangeSelect({
  options,
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
}: DateRangeSelectProps) {
  // The end date can't precede the start date.
  const endOptions = options.filter((iso) => iso >= startDate)

  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField label="From" htmlFor="start-date">
        <Select
          id="start-date"
          value={startDate}
          onChange={(e) => onChangeStart(e.target.value)}
        >
          {options.map((iso) => (
            <option key={iso} value={iso}>
              {formatLongDate(iso)}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="To" htmlFor="end-date">
        <Select
          id="end-date"
          value={endDate}
          onChange={(e) => onChangeEnd(e.target.value)}
        >
          {endOptions.map((iso) => (
            <option key={iso} value={iso}>
              {formatLongDate(iso)}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  )
}
