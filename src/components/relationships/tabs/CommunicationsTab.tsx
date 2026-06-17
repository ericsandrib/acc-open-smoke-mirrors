import { useState } from 'react'
import { Calendar, ChevronDown, Mail, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Relationship } from '@/data/relationshipsSeed'

type Communication = {
  id: string
  topic: string
  type: 'Meeting' | 'Email' | 'Ad-Hoc'
  date: string
  contact: string
  assignedTo: string
}

type CreateKind = 'Meeting' | 'Email' | 'Ad-Hoc' | null

function buildCommunications(r: Relationship): Communication[] {
  const head = r.household.split(' ')[0] || r.household
  return [
    {
      id: 'c-1',
      topic: 'Zoom CC Alex Coronado with Eden Davis. EFTPS',
      type: 'Meeting',
      date: 'Apr 16, 2026',
      contact: head,
      assignedTo: r.advisor,
    },
    {
      id: 'c-2',
      topic: 'Fl on 04/16 TLH & holdings',
      type: 'Meeting',
      date: 'Apr 16, 2026',
      contact: head,
      assignedTo: r.advisor,
    },
    {
      id: 'c-3',
      topic: 'F1 on RTC/PR Strategies',
      type: 'Email',
      date: 'Apr 15, 2026',
      contact: head,
      assignedTo: r.advisor,
    },
  ]
}

function TypeIcon({ type }: { type: Communication['type'] }) {
  if (type === 'Meeting')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-foreground/90">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        Meeting
      </span>
    )
  if (type === 'Email')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-foreground/90">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
        Email
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-foreground/90">
      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
      Ad-Hoc
    </span>
  )
}

// ---------- modals ---------------------------------------------------------

function ModalShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16"
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border bg-muted/20 rounded-b-xl">
          {footer}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-foreground mb-1">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function FakeInput({
  value,
  placeholder,
  className,
}: {
  value?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'h-9 w-full rounded-md border border-border bg-white px-3 flex items-center text-sm text-foreground',
        !value && 'text-muted-foreground',
        className,
      )}
    >
      {value || placeholder}
    </div>
  )
}

function FakeSelect({
  value,
  placeholder,
  className,
}: {
  value?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'h-9 w-full rounded-md border border-border bg-white px-3 flex items-center justify-between text-sm',
        !value && 'text-muted-foreground',
        className,
      )}
    >
      <span className={!value ? 'text-muted-foreground' : 'text-foreground'}>
        {value || placeholder}
      </span>
      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
    </div>
  )
}

function CreateMeetingModal({
  r,
  onClose,
}: {
  r: Relationship
  onClose: () => void
}) {
  const head = r.household.split(' ')[0] || r.household
  return (
    <ModalShell
      title="Create Meeting"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8">
            Cancel
          </Button>
          <Button size="sm" className="h-8 bg-foreground text-background hover:bg-foreground/90">
            Save
          </Button>
        </>
      }
    >
      <div className="text-sm font-semibold text-foreground mb-2">
        Meeting Details
      </div>
      <Field label="Meeting Name" required>
        <FakeInput value={`${head} Coronado`} />
      </Field>

      <div className="text-sm font-semibold text-foreground mb-2">Contacts</div>
      <Field label="Contact" required>
        <FakeSelect value={`${head} Coronado`} />
      </Field>
      <Field label="Assigned to" required>
        <FakeSelect value={r.advisor} />
      </Field>

      <div className="text-sm font-semibold text-foreground mb-2 mt-4">Where</div>
      <Field label="Meeting Type">
        <FakeSelect value="Virtual Meeting" />
      </Field>

      <div className="text-sm font-semibold text-foreground mb-2 mt-4">When</div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date">
          <FakeInput value="05/03/2026" />
        </Field>
        <Field label="Start">
          <FakeInput value="3:00 PM" />
        </Field>
        <Field label="End">
          <FakeInput value="3:30 PM" />
        </Field>
      </div>

      <Field label="Additional Details">
        <textarea
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          rows={3}
          placeholder="Notes, agenda, etc."
        />
      </Field>
    </ModalShell>
  )
}

function CreateEmailModal({
  r,
  onClose,
}: {
  r: Relationship
  onClose: () => void
}) {
  const head = r.household.split(' ')[0] || r.household
  return (
    <ModalShell
      title="Create Email"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8">
            Cancel
          </Button>
          <Button size="sm" className="h-8 bg-foreground text-background hover:bg-foreground/90">
            Save
          </Button>
        </>
      }
    >
      <div className="text-sm font-semibold text-foreground mb-2">Contacts</div>
      <Field label="Contact" required>
        <FakeSelect value={`${head} Coronado`} />
      </Field>
      <Field label="Assigned to" required>
        <FakeSelect value={r.advisor} />
      </Field>

      <div className="text-sm font-semibold text-foreground mb-2 mt-2">Details</div>
      <Field label="Subject" required>
        <FakeInput placeholder="Email subject" />
      </Field>
      <Field label="Topic" required>
        <FakeSelect placeholder="Select topic" />
      </Field>

      <div className="text-sm font-semibold text-foreground mb-2 mt-2">When</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <FakeInput value="05/03/2026" />
        </Field>
        <Field label="Time">
          <FakeInput value="3:30 PM" />
        </Field>
      </div>

      <label className="flex items-center gap-2 mt-2 text-sm text-foreground">
        <input type="checkbox" className="h-4 w-4 rounded border-border" />
        Account Bridge Discussed with Client
      </label>
    </ModalShell>
  )
}

function CreateAdHocModal({
  r,
  onClose,
}: {
  r: Relationship
  onClose: () => void
}) {
  const head = r.household.split(' ')[0] || r.household
  return (
    <ModalShell
      title="Create Ad-Hoc Communication"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8">
            Cancel
          </Button>
          <Button size="sm" className="h-8 bg-foreground text-background hover:bg-foreground/90">
            Save
          </Button>
        </>
      }
    >
      <div className="text-sm font-semibold text-foreground mb-2">Contacts</div>
      <Field label="Contact" required>
        <FakeSelect value={`${head} Coronado`} />
      </Field>
      <Field label="Assigned to" required>
        <FakeSelect value={r.advisor} />
      </Field>

      <div className="text-sm font-semibold text-foreground mb-2 mt-2">Details</div>
      <Field label="Topic" required>
        <FakeSelect placeholder="Select topic" />
      </Field>

      <div className="text-sm font-semibold text-foreground mb-2 mt-2">Where</div>
      <Field label="Type">
        <FakeSelect value="Virtual Meeting" />
      </Field>

      <div className="text-sm font-semibold text-foreground mb-2 mt-2">When</div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date">
          <FakeInput value="05/03/2026" />
        </Field>
        <Field label="Start">
          <FakeInput value="3:00 PM" />
        </Field>
        <Field label="End">
          <FakeInput value="3:30 PM" />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          rows={3}
          placeholder="Add a note"
        />
      </Field>
    </ModalShell>
  )
}

// ---------- main tab -------------------------------------------------------

export function CommunicationsTab({ r }: { r: Relationship }) {
  const [open, setOpen] = useState<CreateKind>(null)
  const [showMenu, setShowMenu] = useState(false)
  const comms = buildCommunications(r)

  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">
            Communications
          </h2>
          <span className="text-sm text-muted-foreground">{comms.length}</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            View Meeting Prep Report
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowMenu((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" />
            New Communication
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          {showMenu && (
            <div
              className="absolute right-0 top-9 z-10 w-48 rounded-md border border-border bg-white shadow-md py-1"
              onMouseLeave={() => setShowMenu(false)}
            >
              {(['Meeting', 'Email', 'Ad-Hoc'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setOpen(k)
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-foreground"
                >
                  Create {k}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
        </Button>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="h-8 w-44 rounded-md border border-border bg-white pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-xs text-muted-foreground border-y border-border">
              {['Topic', 'Type', 'Date', 'Contact', 'Assigned to'].map((h) => (
                <th key={h} className="px-5 py-2.5 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comms.map((c) => (
              <tr key={c.id} className="border-b border-border hover:bg-muted/40">
                <td className="px-5 py-3 text-foreground/90">{c.topic}</td>
                <td className="px-5 py-3">
                  <TypeIcon type={c.type} />
                </td>
                <td className="px-5 py-3 text-foreground/90">{c.date}</td>
                <td className="px-5 py-3 text-foreground/90">{c.contact}</td>
                <td className="px-5 py-3 text-foreground/90">{c.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
            5
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </div>
        <div>1-{comms.length} of {comms.length}</div>
      </div>

      {open === 'Meeting' && (
        <CreateMeetingModal r={r} onClose={() => setOpen(null)} />
      )}
      {open === 'Email' && (
        <CreateEmailModal r={r} onClose={() => setOpen(null)} />
      )}
      {open === 'Ad-Hoc' && (
        <CreateAdHocModal r={r} onClose={() => setOpen(null)} />
      )}
    </div>
  )
}
