/** Demo directory for journey assignee — bulk-assign menu + contact hover card (Basis doc). */

export type JourneyAssigneeRecord = {
  id: string
  name: string
  initials: string
  title: string
  email: string
  phone: string
}

export const JOURNEY_ASSIGNEES: ReadonlyArray<JourneyAssigneeRecord> = [
  {
    id: 'johnathan-doe',
    name: 'Johnathan Doe',
    initials: 'JD',
    title: 'Client Service Specialist',
    email: 'johnathan.doe@example.com',
    phone: '+1 (555) 555-5556',
  },
  {
    id: 'sarah-johnson',
    name: 'Sarah Johnson',
    initials: 'SJ',
    title: 'Client Service Specialist',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 555-5557',
  },
  {
    id: 'michael-johnson',
    name: 'Michael Johnson',
    initials: 'MJ',
    title: 'Client Service Specialist',
    email: 'michael.johnson@example.com',
    phone: '+1 (555) 555-5558',
  },
  {
    id: 'emily-johnstone',
    name: 'Emily Johnstone',
    initials: 'EJ',
    title: 'Client Service Specialist',
    email: 'emily.johnstone@example.com',
    phone: '+1 (555) 555-5559',
  },
  {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    initials: 'SC',
    title: 'Client Service Specialist',
    email: 'sarah.chen@example.com',
    phone: '+1 (555) 555-0110',
  },
  {
    id: 'home-office-review',
    name: 'Home Office Review Team',
    initials: 'HO',
    title: 'Document review',
    email: 'home.office.review@example.com',
    phone: '+1 (555) 555-0199',
  },
]

/** Assign-all popover: advisor-style rows only (excludes system review team). */
export const JOURNEY_BULK_ASSIGN_OPTIONS: ReadonlyArray<JourneyAssigneeRecord> = JOURNEY_ASSIGNEES.filter(
  (a) => a.id !== 'home-office-review',
)

export function getAssigneeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function slugEmailLocalPart(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
  return s.length > 0 ? s : 'advisor'
}

export type ResolvedJourneyAssignee = {
  name: string
  initials: string
  title: string
  email: string
  phone: string
}

export function resolveJourneyAssignee(raw: string | undefined): ResolvedJourneyAssignee | null {
  const trimmed = raw?.trim() ?? ''
  if (trimmed.length === 0 || trimmed === 'Unassigned') return null
  const hit = JOURNEY_ASSIGNEES.find((a) => a.name === trimmed)
  if (hit) {
    return {
      name: hit.name,
      initials: hit.initials,
      title: hit.title,
      email: hit.email,
      phone: hit.phone,
    }
  }
  return {
    name: trimmed,
    initials: getAssigneeInitials(trimmed),
    title: 'Client Service Specialist',
    email: `${slugEmailLocalPart(trimmed)}@example.com`,
    phone: '+1 (555) 555-0100',
  }
}
