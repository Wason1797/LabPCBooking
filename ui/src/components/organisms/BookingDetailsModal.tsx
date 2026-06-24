import { useMemo, useState } from 'react'
import type { Booking } from '../../api/types'
import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { Select } from '../atoms/Select'
import { FormField } from '../molecules/FormField'
import { DateRangeSelect } from '../molecules/DateRangeSelect'
import { HOURS, formatHour, formatHourRange, bookingsOverlap } from '../../utils/time'
import {
  addDays,
  eachDayInRange,
  formatLongDate,
  todayISO,
} from '../../utils/date'

interface BookingDetailsModalProps {
  open: boolean
  booking: Booking | null
  computerName: string
  /** All bookings, used to detect overlaps when editing. */
  allBookings: Booking[]
  onClose: () => void
  onUpdate: (id: string, changes: Partial<Omit<Booking, 'id'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Errors {
  studentName?: string
  studentEmail?: string
  projectName?: string
}

/** Mounted only while the modal is open, so all edit state resets each open. */
function BookingDetails({
  booking,
  computerName,
  allBookings,
  onClose,
  onUpdate,
  onDelete,
}: {
  booking: Booking
  computerName: string
  allBookings: Booking[]
  onClose: () => void
  onUpdate: BookingDetailsModalProps['onUpdate']
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    studentName: booking.studentName,
    studentEmail: booking.studentEmail,
    projectName: booking.projectName,
    startHour: booking.startHour,
    endHour: booking.endHour,
    extended: booking.startDate !== booking.endDate,
    startDate: booking.startDate,
    endDate: booking.endDate,
  })

  // Date options span today..+60 days, widened to include this booking's dates.
  const dateOptions = useMemo(() => {
    const today = todayISO()
    const optStart = booking.startDate < today ? booking.startDate : today
    const horizon = addDays(today, 60)
    const optEnd = booking.endDate > horizon ? booking.endDate : horizon
    return eachDayInRange(optStart, optEnd)
  }, [booking.startDate, booking.endDate])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const dateText =
    booking.startDate === booking.endDate
      ? formatLongDate(booking.startDate)
      : `${formatLongDate(booking.startDate)} → ${formatLongDate(booking.endDate)}`

  const rows: { label: string; value: string }[] = [
    { label: 'Computer', value: computerName },
    { label: 'Student', value: booking.studentName },
    { label: 'Email', value: booking.studentEmail },
    { label: 'Project', value: booking.projectName },
    { label: 'Date', value: dateText },
    {
      label: 'Time',
      value: formatHourRange(booking.startHour, booking.endHour),
    },
  ]

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(booking.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  async function handleSave() {
    const next: Errors = {}
    if (!form.studentName.trim()) next.studentName = 'Required'
    if (!form.studentEmail.trim()) next.studentEmail = 'Required'
    else if (!EMAIL_RE.test(form.studentEmail.trim()))
      next.studentEmail = 'Enter a valid email'
    if (!form.projectName.trim()) next.projectName = 'Required'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length > 0) return

    if (form.endHour <= form.startHour) {
      setFormError('End time must be after start time.')
      return
    }

    const startDate = form.startDate
    const endDate = form.extended ? form.endDate : form.startDate
    if (endDate < startDate) {
      setFormError('End date must be on or after the start date.')
      return
    }

    const candidate = {
      computerId: booking.computerId,
      startDate,
      endDate,
      startHour: form.startHour,
      endHour: form.endHour,
    }
    const conflict = allBookings.some(
      (b) => b.id !== booking.id && bookingsOverlap(candidate, b),
    )
    if (conflict) {
      setFormError('This overlaps another booking on the same computer.')
      return
    }

    setSaving(true)
    try {
      await onUpdate(booking.id, {
        studentName: form.studentName.trim(),
        studentEmail: form.studentEmail.trim(),
        projectName: form.projectName.trim(),
        startHour: form.startHour,
        endHour: form.endHour,
        startDate,
        endDate,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  // ----- Edit mode -----
  if (editing) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Editing booking on{' '}
          <span className="font-medium text-slate-700">{computerName}</span>
        </p>
        <FormField
          label="Student name"
          htmlFor="edit-name"
          error={errors.studentName}
        >
          <Input
            id="edit-name"
            value={form.studentName}
            invalid={!!errors.studentName}
            onChange={(e) => set('studentName', e.target.value)}
            autoFocus
          />
        </FormField>
        <FormField
          label="Student email"
          htmlFor="edit-email"
          error={errors.studentEmail}
        >
          <Input
            id="edit-email"
            type="email"
            value={form.studentEmail}
            invalid={!!errors.studentEmail}
            onChange={(e) => set('studentEmail', e.target.value)}
          />
        </FormField>
        <FormField
          label="Project name"
          htmlFor="edit-project"
          error={errors.projectName}
        >
          <Input
            id="edit-project"
            value={form.projectName}
            invalid={!!errors.projectName}
            onChange={(e) => set('projectName', e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start time" htmlFor="edit-start-hour">
            <Select
              id="edit-start-hour"
              value={form.startHour}
              onChange={(e) => set('startHour', Number(e.target.value))}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="End time" htmlFor="edit-end-hour">
            <Select
              id="edit-end-hour"
              value={form.endHour}
              onChange={(e) => set('endHour', Number(e.target.value))}
            >
              {HOURS.map((h) => h + 1).map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.extended}
            onChange={(e) => {
              set('extended', e.target.checked)
              if (!e.target.checked) set('endDate', form.startDate)
            }}
            className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Extended booking (spans multiple days)
        </label>

        {form.extended ? (
          <DateRangeSelect
            options={dateOptions}
            startDate={form.startDate}
            endDate={form.endDate}
            onChangeStart={(iso) => {
              set('startDate', iso)
              if (form.endDate < iso) set('endDate', iso)
            }}
            onChangeEnd={(iso) => set('endDate', iso)}
          />
        ) : (
          <FormField label="Day" htmlFor="edit-day">
            <Select
              id="edit-day"
              value={form.startDate}
              onChange={(e) => {
                set('startDate', e.target.value)
                set('endDate', e.target.value)
              }}
            >
              {dateOptions.map((iso) => (
                <option key={iso} value={iso}>
                  {formatLongDate(iso)}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {formError && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="secondary"
            onClick={() => setEditing(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    )
  }

  // ----- View mode -----
  return (
    <div className="space-y-4">
      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex gap-4 px-4 py-3">
            <dt className="w-24 shrink-0 text-sm font-medium text-slate-500">
              {label}
            </dt>
            <dd className="text-sm text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>

      {confirming ? (
        <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm text-rose-700">
            Delete this booking? This can’t be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Confirm delete'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between gap-2 pt-1">
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete booking
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => setEditing(true)}>Edit</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function BookingDetailsModal({
  open,
  booking,
  computerName,
  allBookings,
  onClose,
  onUpdate,
  onDelete,
}: BookingDetailsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Booking details">
      {booking && (
        <BookingDetails
          booking={booking}
          computerName={computerName}
          allBookings={allBookings}
          onClose={onClose}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </Modal>
  )
}
