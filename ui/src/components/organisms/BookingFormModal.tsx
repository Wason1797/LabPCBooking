import { useMemo, useState } from 'react'
import type { Computer, NewBooking } from '../../api/types'
import type { Selection } from './BookingMatrix'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { Badge } from '../atoms/Badge'
import { FormField } from '../molecules/FormField'
import { DateRangeSelect } from '../molecules/DateRangeSelect'
import { formatHourRange } from '../../utils/time'
import {
  addDays,
  eachDayInRange,
  formatLongDate,
  todayISO,
} from '../../utils/date'

interface BookingFormModalProps {
  open: boolean
  computer: Computer | null
  /** The day shown in the matrix; used as the default booking date. */
  date: string
  selection: Selection | null
  creating: boolean
  onClose: () => void
  onSubmit: (booking: NewBooking) => Promise<void>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Errors {
  studentName?: string
  studentEmail?: string
  projectName?: string
}

/**
 * The form body. Mounted only while the modal is open, so its useState
 * initializers reset the fields on every open without a reset effect.
 */
function BookingForm({
  computer,
  date,
  selection,
  creating,
  onClose,
  onSubmit,
}: Omit<BookingFormModalProps, 'open'>) {
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [projectName, setProjectName] = useState('')
  const [extended, setExtended] = useState(false)
  const [startDate, setStartDate] = useState(date)
  const [endDate, setEndDate] = useState(date)
  const [errors, setErrors] = useState<Errors>({})

  // Date dropdown options: today through ~60 days out.
  const dateOptions = useMemo(
    () => eachDayInRange(todayISO(), addDays(todayISO(), 60)),
    [],
  )

  function validate(): Errors {
    const next: Errors = {}
    if (!studentName.trim()) next.studentName = 'Student name is required'
    if (!studentEmail.trim()) next.studentEmail = 'Email is required'
    else if (!EMAIL_RE.test(studentEmail.trim()))
      next.studentEmail = 'Enter a valid email'
    if (!projectName.trim()) next.projectName = 'Project name is required'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!computer || !selection) return
    const found = validate()
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    await onSubmit({
      computerId: computer.id,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      projectName: projectName.trim(),
      startDate: extended ? startDate : date,
      endDate: extended ? endDate : date,
      startHour: selection.startHour,
      endHour: selection.endHour,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Summary of what is being booked */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <Badge className="bg-indigo-100 text-indigo-700">
          {computer?.name ?? '—'}
        </Badge>
        {selection && (
          <Badge className="bg-slate-200 text-slate-700">
            {formatHourRange(selection.startHour, selection.endHour)}
          </Badge>
        )}
        {!extended && (
          <span className="text-slate-500">{formatLongDate(date)}</span>
        )}
      </div>

      <FormField
        label="Student name"
        htmlFor="student-name"
        error={errors.studentName}
      >
        <Input
          id="student-name"
          value={studentName}
          invalid={!!errors.studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Jane Doe"
          autoFocus
        />
      </FormField>

      <FormField
        label="Student email"
        htmlFor="student-email"
        error={errors.studentEmail}
      >
        <Input
          id="student-email"
          type="email"
          value={studentEmail}
          invalid={!!errors.studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          placeholder="jane.doe@students.fuas.edu"
        />
      </FormField>

      <FormField
        label="Project name"
        htmlFor="project-name"
        error={errors.projectName}
      >
        <Input
          id="project-name"
          value={projectName}
          invalid={!!errors.projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g. Machine Learning Lab"
        />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={extended}
          onChange={(e) => {
            setExtended(e.target.checked)
            setStartDate(date)
            setEndDate(date)
          }}
          className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Extended booking (spans multiple days)
      </label>

      {extended && (
        <DateRangeSelect
          options={dateOptions}
          startDate={startDate}
          endDate={endDate}
          onChangeStart={(iso) => {
            setStartDate(iso)
            if (endDate < iso) setEndDate(iso)
          }}
          onChangeEnd={setEndDate}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={creating}>
          {creating ? 'Saving…' : 'Create booking'}
        </Button>
      </div>
    </form>
  )
}

export function BookingFormModal({
  open,
  onClose,
  ...rest
}: BookingFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="New booking">
      <BookingForm onClose={onClose} {...rest} />
    </Modal>
  )
}
