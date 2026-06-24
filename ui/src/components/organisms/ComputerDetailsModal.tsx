import { useState } from 'react'
import type { Computer, PingResult } from '../../api/types'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { PingStatusDot } from '../atoms/PingStatusDot'
import { pingLabel } from '../../hooks/usePing'
import { FormField } from '../molecules/FormField'

interface ComputerDetailsModalProps {
  open: boolean
  computer: Computer | null
  pingResult: PingResult | undefined
  pinging: boolean
  onPing: (id: string) => void
  onClose: () => void
  onSave: (
    id: string,
    changes: Partial<Omit<Computer, 'id'>>,
  ) => Promise<void>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Errors {
  name?: string
  macAddress?: string
  osImage?: string
  assignedUser?: string
  assignedUserEmail?: string
  password?: string
}

const FIELDS: { key: keyof Computer; label: string }[] = [
  { key: 'name', label: 'Computer name' },
  { key: 'macAddress', label: 'MAC address' },
  { key: 'osImage', label: 'OS image' },
  { key: 'assignedUser', label: 'Assigned user' },
  { key: 'assignedUserEmail', label: 'User email' },
]

/** Mounted only while the modal is open, so field state resets on each open. */
function ComputerDetails({
  computer,
  pingResult,
  pinging,
  onPing,
  onClose,
  onSave,
}: {
  computer: Computer
  pingResult: PingResult | undefined
  pinging: boolean
  onPing: (id: string) => void
  onClose: () => void
  onSave: ComputerDetailsModalProps['onSave']
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [revealPassword, setRevealPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [form, setForm] = useState({
    name: computer.name,
    macAddress: computer.macAddress,
    osImage: computer.osImage,
    assignedUser: computer.assignedUser,
    assignedUserEmail: computer.assignedUserEmail,
    password: computer.password,
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!form.name.trim()) next.name = 'Required'
    if (!form.macAddress.trim()) next.macAddress = 'Required'
    if (!form.osImage.trim()) next.osImage = 'Required'
    if (!form.assignedUser.trim()) next.assignedUser = 'Required'
    if (!form.assignedUserEmail.trim())
      next.assignedUserEmail = 'Required'
    else if (!EMAIL_RE.test(form.assignedUserEmail.trim()))
      next.assignedUserEmail = 'Enter a valid email'
    if (!form.password) next.password = 'Required'
    return next
  }

  async function handleSave() {
    const found = validate()
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    setSaving(true)
    try {
      await onSave(computer.id, {
        name: form.name.trim(),
        macAddress: form.macAddress.trim(),
        osImage: form.osImage.trim(),
        assignedUser: form.assignedUser.trim(),
        assignedUserEmail: form.assignedUserEmail.trim(),
        password: form.password,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    // Restore the form to the saved values and leave edit mode.
    setForm({
      name: computer.name,
      macAddress: computer.macAddress,
      osImage: computer.osImage,
      assignedUser: computer.assignedUser,
      assignedUserEmail: computer.assignedUserEmail,
      password: computer.password,
    })
    setErrors({})
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <PingStatusDot result={pingResult} pinging={pinging} />
            {pinging ? 'Pinging…' : pingLabel(pingResult)}
          </span>
          <Button
            variant="secondary"
            onClick={() => onPing(computer.id)}
            disabled={pinging}
          >
            {pinging ? 'Pinging…' : 'Ping now'}
          </Button>
        </div>
        <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="flex gap-4 px-4 py-3">
              <dt className="w-32 shrink-0 text-sm font-medium text-slate-500">
                {label}
              </dt>
              <dd
                className={`text-sm text-slate-800 ${
                  key === 'macAddress' ? 'font-mono' : ''
                }`}
              >
                {computer[key]}
              </dd>
            </div>
          ))}
          <div className="flex gap-4 px-4 py-3">
            <dt className="w-32 shrink-0 text-sm font-medium text-slate-500">
              Password
            </dt>
            <dd className="flex items-center gap-2 text-sm text-slate-800">
              <span className="font-mono">
                {revealPassword ? computer.password : '••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setRevealPassword((v) => !v)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                {revealPassword ? 'Hide' : 'Show'}
              </button>
            </dd>
          </div>
        </dl>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => setEditing(true)}>Edit</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FormField label="Computer name" htmlFor="pc-name" error={errors.name}>
        <Input
          id="pc-name"
          value={form.name}
          invalid={!!errors.name}
          onChange={(e) => set('name', e.target.value)}
          autoFocus
        />
      </FormField>
      <FormField label="MAC address" htmlFor="pc-mac" error={errors.macAddress}>
        <Input
          id="pc-mac"
          value={form.macAddress}
          invalid={!!errors.macAddress}
          onChange={(e) => set('macAddress', e.target.value)}
          placeholder="A4:5E:60:C1:7B:01"
          className="font-mono"
        />
      </FormField>
      <FormField label="OS image" htmlFor="pc-os" error={errors.osImage}>
        <Input
          id="pc-os"
          value={form.osImage}
          invalid={!!errors.osImage}
          onChange={(e) => set('osImage', e.target.value)}
          placeholder="Windows 11 Edu 23H2"
        />
      </FormField>
      <FormField
        label="Assigned user"
        htmlFor="pc-user"
        error={errors.assignedUser}
      >
        <Input
          id="pc-user"
          value={form.assignedUser}
          invalid={!!errors.assignedUser}
          onChange={(e) => set('assignedUser', e.target.value)}
        />
      </FormField>
      <FormField
        label="User email"
        htmlFor="pc-email"
        error={errors.assignedUserEmail}
      >
        <Input
          id="pc-email"
          type="email"
          value={form.assignedUserEmail}
          invalid={!!errors.assignedUserEmail}
          onChange={(e) => set('assignedUserEmail', e.target.value)}
        />
      </FormField>
      <FormField label="Password" htmlFor="pc-password" error={errors.password}>
        <div className="flex gap-2">
          <Input
            id="pc-password"
            type={revealPassword ? 'text' : 'password'}
            value={form.password}
            invalid={!!errors.password}
            onChange={(e) => set('password', e.target.value)}
            className="font-mono"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRevealPassword((v) => !v)}
          >
            {revealPassword ? 'Hide' : 'Show'}
          </Button>
        </div>
      </FormField>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={cancelEdit} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

export function ComputerDetailsModal({
  open,
  computer,
  pingResult,
  pinging,
  onPing,
  onClose,
  onSave,
}: ComputerDetailsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={computer ? computer.name : 'Computer details'}
    >
      {computer && (
        <ComputerDetails
          computer={computer}
          pingResult={pingResult}
          pinging={pinging}
          onPing={onPing}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  )
}
