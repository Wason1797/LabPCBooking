import { useState } from 'react'
import type { NewComputer } from '../../api/types'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { FormField } from '../molecules/FormField'

interface ComputerFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: NewComputer) => Promise<void>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Errors {
  name?: string
  macAddress?: string
  ipAddress?: string
  osImage?: string
  assignedUser?: string
  assignedUserEmail?: string
  password?: string
}

/**
 * Create form for a new computer. Mounted only while the modal is open (Modal
 * returns null when closed), so the fields reset to empty on every open.
 */
function ComputerForm({
  onClose,
  onSubmit,
}: Omit<ComputerFormModalProps, 'open'>) {
  const [saving, setSaving] = useState(false)
  const [revealPassword, setRevealPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [form, setForm] = useState({
    name: '',
    macAddress: '',
    ipAddress: '',
    osImage: '',
    assignedUser: '',
    assignedUserEmail: '',
    password: '',
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!form.name.trim()) next.name = 'Required'
    if (!form.macAddress.trim()) next.macAddress = 'Required'
    if (!form.ipAddress.trim()) next.ipAddress = 'Required'
    if (!form.osImage.trim()) next.osImage = 'Required'
    if (!form.assignedUser.trim()) next.assignedUser = 'Required'
    if (!form.assignedUserEmail.trim()) next.assignedUserEmail = 'Required'
    else if (!EMAIL_RE.test(form.assignedUserEmail.trim()))
      next.assignedUserEmail = 'Enter a valid email'
    if (!form.password) next.password = 'Required'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = validate()
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        macAddress: form.macAddress.trim(),
        ipAddress: form.ipAddress.trim(),
        osImage: form.osImage.trim(),
        assignedUser: form.assignedUser.trim(),
        assignedUserEmail: form.assignedUserEmail.trim(),
        password: form.password,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Computer name" htmlFor="new-pc-name" error={errors.name}>
        <Input
          id="new-pc-name"
          value={form.name}
          invalid={!!errors.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="PC-13"
          autoFocus
        />
      </FormField>
      <FormField
        label="MAC address"
        htmlFor="new-pc-mac"
        error={errors.macAddress}
      >
        <Input
          id="new-pc-mac"
          value={form.macAddress}
          invalid={!!errors.macAddress}
          onChange={(e) => set('macAddress', e.target.value)}
          placeholder="A4:5E:60:C1:7B:01"
          className="font-mono"
        />
      </FormField>
      <FormField label="IP address" htmlFor="new-pc-ip" error={errors.ipAddress}>
        <Input
          id="new-pc-ip"
          value={form.ipAddress}
          invalid={!!errors.ipAddress}
          onChange={(e) => set('ipAddress', e.target.value)}
          placeholder="10.0.12.34"
          className="font-mono"
        />
      </FormField>
      <FormField label="OS image" htmlFor="new-pc-os" error={errors.osImage}>
        <Input
          id="new-pc-os"
          value={form.osImage}
          invalid={!!errors.osImage}
          onChange={(e) => set('osImage', e.target.value)}
          placeholder="Windows 11 Edu 23H2"
        />
      </FormField>
      <FormField
        label="Assigned user"
        htmlFor="new-pc-user"
        error={errors.assignedUser}
      >
        <Input
          id="new-pc-user"
          value={form.assignedUser}
          invalid={!!errors.assignedUser}
          onChange={(e) => set('assignedUser', e.target.value)}
          placeholder="Lab Admin"
        />
      </FormField>
      <FormField
        label="User email"
        htmlFor="new-pc-email"
        error={errors.assignedUserEmail}
      >
        <Input
          id="new-pc-email"
          type="email"
          value={form.assignedUserEmail}
          invalid={!!errors.assignedUserEmail}
          onChange={(e) => set('assignedUserEmail', e.target.value)}
          placeholder="labadmin@fuas.edu"
        />
      </FormField>
      <FormField
        label="Password"
        htmlFor="new-pc-password"
        error={errors.password}
      >
        <div className="flex gap-2">
          <Input
            id="new-pc-password"
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
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Adding…' : 'Add computer'}
        </Button>
      </div>
    </form>
  )
}

export function ComputerFormModal({
  open,
  onClose,
  onSubmit,
}: ComputerFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Add computer">
      <ComputerForm onClose={onClose} onSubmit={onSubmit} />
    </Modal>
  )
}
