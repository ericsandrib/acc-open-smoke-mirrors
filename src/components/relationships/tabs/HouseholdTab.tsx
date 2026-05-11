import { useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  Copy,
  Eye,
  ExternalLink,
  FileText,
  Home,
  Mail,
  Pencil,
  Plus,
  Star,
  User,
  X,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Relationship } from '@/data/relationshipsSeed'
import { NaField } from '@/components/orion/NaField'
import { useOrionProfile } from '@/db/queries/relationships'

type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface Contact {
  id: string
  name: string
  firstName: string
  middleName: string
  lastName: string
  initials: string
  role: 'Client' | 'Spouse' | 'Trustee' | 'Beneficiary'
  age?: number
  isPrimary: boolean
  isClient: boolean
  avatarTone: 'purple' | 'slate'
  // Detail fields
  status: 'Active' | 'Inactive'
  preferredName: string
  dob: string
  ssn: string
  ssnLast4: string
  phoneLabel: string
  phone: string
  emailLabel: string
  email: string
  address: string
  employer: string
  jobTitle: string
}

function buildContacts(r: Relationship): Contact[] {
  const parts = r.household.replace(/^The\s+/, '').split(/\s+/)
  const firstName = parts[0] ?? 'Client'
  const lastName = parts[parts.length - 1] ?? 'Family'
  const primaryInitials = (
    (firstName[0] ?? '?') + (lastName[0] ?? '?')
  ).toUpperCase()

  return [
    {
      id: 'c-primary',
      name: `${firstName} ${lastName}`,
      firstName,
      middleName: 'None',
      lastName,
      initials: primaryInitials,
      role: 'Client',
      age: 25,
      isPrimary: true,
      isClient: true,
      avatarTone: 'purple',
      status: 'Active',
      preferredName: firstName,
      dob: '2/24/2001',
      ssn: '•••-••-4043',
      ssnLast4: '4043',
      phoneLabel: 'Phone (Mobile Phone)',
      phone: '(393) 938-7409',
      emailLabel: 'Email (Personal)',
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
      address: '123 Main St, Queen Creek, AZ 85142',
      employer: '-',
      jobTitle: '-',
    },
    {
      id: 'c-spouse',
      name: `Kristie ${lastName}`,
      firstName: 'Kristie',
      middleName: 'None',
      lastName,
      initials: ('K' + (lastName[0] ?? '?')).toUpperCase(),
      role: 'Spouse',
      isPrimary: false,
      isClient: false,
      avatarTone: 'slate',
      status: 'Active',
      preferredName: 'Kristie',
      dob: '6/14/1979',
      ssn: '•••-••-2218',
      ssnLast4: '2218',
      phoneLabel: 'Phone (Mobile Phone)',
      phone: '(393) 938-2210',
      emailLabel: 'Email (Personal)',
      email: `kristie.${lastName.toLowerCase()}@gmail.com`,
      address: '123 Main St, Queen Creek, AZ 85142',
      employer: '-',
      jobTitle: '-',
    },
  ]
}

function Avatar({
  initials,
  tone,
  size = 36,
}: {
  initials: string
  tone: 'purple' | 'slate'
  size?: number
}) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 font-medium tracking-wide',
        tone === 'purple'
          ? 'bg-purple-700 text-white'
          : 'bg-muted text-foreground/70',
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

function ContactsList({
  contacts,
  selectedId,
  onSelect,
}: {
  contacts: Contact[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Contacts</h3>
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Edit contacts"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Add contact"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground">
        Household
      </div>

      <ul>
        {contacts.map((c) => {
          const active = c.id === selectedId
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  active
                    ? 'bg-purple-50/60'
                    : 'hover:bg-muted/40',
                )}
              >
                <Avatar initials={c.initials} tone={c.avatarTone} />
                <div className="leading-tight min-w-0">
                  <div className="text-sm text-foreground truncate">
                    {c.name}
                  </div>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                    {c.isClient && (
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    )}
                    {c.role}
                    {typeof c.age === 'number' ? ` · ${c.age}` : ''}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FieldRow({
  label,
  children,
  trailing,
}: {
  label: string
  children: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[200px_1fr_auto] items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
      <div className="flex items-center gap-1">{trailing}</div>
    </div>
  )
}

function IconBtn({
  label,
  children,
  onClick,
}: {
  label: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
    >
      {children}
    </button>
  )
}

function ContactDetail({
  contact,
  onViewDetails,
}: {
  contact: Contact
  onViewDetails: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <Avatar
          initials={contact.initials}
          tone={contact.avatarTone}
          size={48}
        />
        <div className="leading-tight">
          <h2 className="text-xl font-semibold text-foreground">
            {contact.name}
          </h2>
          <div className="text-sm text-muted-foreground inline-flex items-center gap-1 mt-0.5">
            {contact.isPrimary ? (
              <Star className="h-3.5 w-3.5 text-muted-foreground" />
            ) : null}
            {contact.isPrimary ? 'Primary' : contact.role}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onViewDetails}
        >
          View details
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Basic Information */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Basic Information
        </h3>
        <dl className="rounded-xl border border-border bg-white">
          <FieldRow label="Status">
            <span className="text-foreground">{contact.status}</span>
          </FieldRow>
          <FieldRow label="Preferred Name">
            {contact.preferredName}
          </FieldRow>
          <FieldRow
            label="DOB"
            trailing={
              <IconBtn label="Copy DOB">
                <Copy className="h-3.5 w-3.5" />
              </IconBtn>
            }
          >
            {contact.dob}
          </FieldRow>
          <FieldRow label="Age">{contact.age ?? '—'}</FieldRow>
          <FieldRow
            label="SSN"
            trailing={
              <>
                <IconBtn label="Show SSN">
                  <Eye className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Copy SSN">
                  <Copy className="h-3.5 w-3.5" />
                </IconBtn>
              </>
            }
          >
            <span className="tabular-nums">{contact.ssn}</span>
          </FieldRow>
        </dl>
      </section>

      {/* Contact Information */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Contact Information
        </h3>
        <dl className="rounded-xl border border-border bg-white">
          <FieldRow
            label={contact.phoneLabel}
            trailing={
              <IconBtn label="Copy phone">
                <Copy className="h-3.5 w-3.5" />
              </IconBtn>
            }
          >
            <a
              href={`tel:${contact.phone}`}
              className="text-foreground underline underline-offset-2 decoration-muted-foreground/40 hover:decoration-foreground"
            >
              {contact.phone}
            </a>
          </FieldRow>
          <FieldRow
            label={contact.emailLabel}
            trailing={
              <IconBtn label="Copy email">
                <Copy className="h-3.5 w-3.5" />
              </IconBtn>
            }
          >
            <a
              href={`mailto:${contact.email}`}
              className="text-foreground"
            >
              {contact.email}
            </a>
          </FieldRow>
          <FieldRow label="Mailing Address">
            {contact.address}
          </FieldRow>
        </dl>
      </section>
    </div>
  )
}

// --- View Details modal ---------------------------------------------------

const DETAILS_SECTIONS: { label: string; Icon: IconType }[] = [
  { label: 'Basic', Icon: User },
  { label: 'Contact', Icon: Mail },
  { label: 'Address', Icon: Home },
  { label: 'Employment', Icon: Briefcase },
  { label: 'Know Your Client', Icon: FileText },
]

type DetailsSection = (typeof DETAILS_SECTIONS)[number]['label']

function DetailsRow({
  label,
  value,
  trailing,
}: {
  label: string
  value: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[260px_1fr_auto] items-center gap-3 py-3 border-b border-border last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value || '-'}</dd>
      <div className="flex items-center gap-1">{trailing}</div>
    </div>
  )
}

function BasicSection({ contact }: { contact: Contact }) {
  return (
    <dl>
      <DetailsRow label="First Name" value={contact.firstName} />
      <DetailsRow label="Middle Name" value={contact.middleName} />
      <DetailsRow label="Last Name" value={contact.lastName} />
      <DetailsRow label="Preferred Name" value={contact.preferredName} />
      <DetailsRow label="Verbal Password" value={<NaField compact />} />
      <DetailsRow
        label="SSN"
        value={<span className="tabular-nums">{contact.ssn}</span>}
        trailing={
          <>
            <IconBtn label="Show SSN">
              <Eye className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label="Copy SSN">
              <Copy className="h-3.5 w-3.5" />
            </IconBtn>
          </>
        }
      />
      <DetailsRow label="Date of Birth" value={contact.dob} />
      <DetailsRow label="Age" value={contact.age ?? '-'} />
      <DetailsRow label="RMD Required?" value={<NaField compact />} />
      <DetailsRow label="Gender" value={<NaField compact />} />
      <DetailsRow label="Contact Marketing Salutation" value={<NaField compact />} />
      <DetailsRow label="Maiden Name" value={<NaField compact />} />
      <DetailsRow label="Officer/Director of a Public Company" value={<NaField compact />} />
      <DetailsRow label="Subject to Security Restrictions?" value={<NaField compact />} />
      <DetailsRow label="Description" value={<NaField compact />} />
      <DetailsRow label="Status" value={contact.status} />
    </dl>
  )
}

function ContactSection({ contact }: { contact: Contact }) {
  return (
    <dl>
      <DetailsRow label={contact.phoneLabel} value={contact.phone} />
      <DetailsRow label="Home Phone" value={<NaField compact />} />
      <DetailsRow label="Work Phone" value={<NaField compact />} />
      <DetailsRow label="Mobile" value={<NaField compact />} />
      <DetailsRow label={contact.emailLabel} value={contact.email} />
      <DetailsRow label="Work Email" value={<NaField compact />} />
    </dl>
  )
}

function AddressSection({ contact }: { contact: Contact }) {
  return (
    <dl>
      <DetailsRow label="Mailing Address" value={contact.address} />
      <DetailsRow label="Billing Address" value={<NaField compact />} />
      <DetailsRow label="Shipping Address" value={<NaField compact />} />
      <DetailsRow label="Other Address" value={<NaField compact />} />
      <DetailsRow label="Preferred Address" value="Mailing" />
    </dl>
  )
}

function EmploymentSection({ contact }: { contact: Contact }) {
  return (
    <dl>
      <DetailsRow label="Employer" value={contact.employer} />
      <DetailsRow label="Job Title" value={contact.jobTitle} />
      <DetailsRow label="Annual Income" value={<NaField compact />} />
      <DetailsRow label="Years Employed" value={<NaField compact />} />
      <DetailsRow label="Source of Income" value={<NaField compact />} />
    </dl>
  )
}

function KycSection({ r }: { r: Relationship }) {
  const { data: orion } = useOrionProfile(r.id)
  // Format helpers for the Orion-derived numbers.
  const money = (n: unknown) =>
    typeof n === 'number'
      ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
      : '-'
  const pct = (n: unknown) => (typeof n === 'number' ? `${n}%` : '-')

  return (
    <dl>
      {/* Available in Orion */}
      <DetailsRow label="Investment Objective" value={(orion?.investmentObjective as string) ?? '-'} />
      <DetailsRow label="Time Horizon" value={(orion?.timeHorizon as string) ?? '-'} />
      <DetailsRow label="Risk Exposure" value={(orion?.riskExposure as string) ?? '-'} />
      <DetailsRow label="Risk Tolerance" value={(orion?.riskTolerance as string) ?? '-'} />
      <DetailsRow label="Liquid Net Worth" value={money(orion?.liquidNetWorth)} />
      <DetailsRow label="Net Worth" value={money(orion?.netWorth)} />
      <DetailsRow label="Net Income" value={money(orion?.netIncome)} />
      <DetailsRow label="Stock %" value={pct(orion?.stockPercent)} />
      <DetailsRow label="Bond %" value={pct(orion?.bondPercent)} />
      <DetailsRow label="Investment Knowledge" value={(orion?.investmentKnowledge as string) ?? '-'} />
      <DetailsRow label="Investment Experience" value={(orion?.investmentExperience as string) ?? '-'} />
      {/* Not in Orion — flagged */}
      <DetailsRow label="KYC Date" value={<NaField compact />} />
      <DetailsRow label="KYC Status" value={<NaField compact />} />
      <DetailsRow label="Drivers License Number" value={<NaField compact />} />
      <DetailsRow label="Date of Death" value={<NaField compact />} />
      <DetailsRow label="Marital Status" value={<NaField compact />} />
      <DetailsRow label="Wedding Anniversary" value={<NaField compact />} />
      <DetailsRow label="Risk Budget" value={<NaField compact label="Not in Stratos Orion — Riskalyze/Nitrogen?" />} />
      <DetailsRow label="Return Objective" value={<NaField compact />} />
      <DetailsRow label="Lifestyle Option" value={<NaField compact />} />
      <DetailsRow label="Suitability Review Completed" value={<NaField compact />} />
      <DetailsRow label="Net Worth (Excl. Residence)" value={<NaField compact />} />
      <DetailsRow label="Qualified Investor" value={<NaField compact />} />
      <DetailsRow label="Tax Bracket" value={<NaField compact />} />
      <DetailsRow label="Financial Interests" value={<NaField compact />} />
      <DetailsRow label="Personal Interests" value={<NaField compact />} />
    </dl>
  )
}

function ContactDetailsModal({
  contact,
  r,
  onClose,
}: {
  contact: Contact
  r: Relationship
  onClose: () => void
}) {
  const [section, setSection] = useState<DetailsSection>('Basic')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative h-full w-full max-w-[1200px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {contact.name}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Body: sidebar + content */}
        <div className="flex-1 flex min-h-0">
          <aside className="w-[260px] shrink-0 border-r border-border p-3 overflow-y-auto">
            <nav className="flex flex-col gap-0.5">
              {DETAILS_SECTIONS.map(({ label, Icon }) => {
                const active = section === label
                return (
                  <button
                    key={label}
                    onClick={() => setSection(label)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left transition-colors',
                      active
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-foreground/80 hover:bg-muted/60',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                )
              })}
            </nav>
          </aside>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {section}
            </h3>
            {section === 'Basic' && <BasicSection contact={contact} />}
            {section === 'Contact' && <ContactSection contact={contact} />}
            {section === 'Address' && <AddressSection contact={contact} />}
            {section === 'Employment' && <EmploymentSection contact={contact} />}
            {section === 'Know Your Client' && <KycSection r={r} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HouseholdTab({ r }: { r: Relationship }) {
  const contacts = useMemo(() => buildContacts(r), [r])
  const [selectedId, setSelectedId] = useState<string>(contacts[0]?.id ?? '')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const selected =
    contacts.find((c) => c.id === selectedId) ?? contacts[0]

  if (!selected) return null

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
        <ContactsList
          contacts={contacts}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />
        <ContactDetail
          contact={selected}
          onViewDetails={() => setDetailsOpen(true)}
        />
      </div>
      {detailsOpen && (
        <ContactDetailsModal
          contact={selected}
          r={r}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </>
  )
}
