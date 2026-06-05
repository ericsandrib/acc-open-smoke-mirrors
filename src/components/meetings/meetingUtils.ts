import type { Meeting, MeetingVendor, RsvpStatus, MeetingLifecycle } from '@/types/meeting'

export const ZIONS_NAVY = '#0b4f9c'

// "Today" anchor for the POC. Keeps the seed's Live / Today / Upcoming framing stable
// regardless of the real wall-clock date during a demo.
export const TODAY = '2026-06-05'

export function vendorLabel(v?: MeetingVendor): string {
  switch (v) {
    case 'zoom': return 'Zoom'
    case 'teams': return 'Microsoft Teams'
    case 'meet': return 'Google Meet'
    case 'phone': return 'Phone'
    case 'in_person': return 'In person'
    default: return 'Video call'
  }
}

/** Short label used in list meta rows. */
export function vendorShort(v?: MeetingVendor): string {
  if (v === 'in_person') return 'In person'
  if (v === 'phone') return 'Phone'
  return 'Video call'
}

export function isVirtual(v?: MeetingVendor): boolean {
  return v === 'zoom' || v === 'teams' || v === 'meet'
}

export const RSVP_LABEL: Record<RsvpStatus, string> = {
  going: 'Going',
  maybe: 'Maybe',
  declined: 'Declined',
  none: 'No RSVP',
}

/** Left accent-bar color on list cards, by the current advisor's RSVP. */
export function rsvpAccent(rsvp?: RsvpStatus, isAttendee = true): string {
  if (!isAttendee) return 'transparent'
  switch (rsvp) {
    case 'going': return ZIONS_NAVY
    case 'maybe': return '#b9791f' // amber-700-ish
    case 'declined': return '#dc2626' // red-600
    default: return '#cbd5e1' // slate-300
  }
}

export const LIFECYCLE_LABEL: Record<MeetingLifecycle, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  ended_pending: 'Generating…',
  ended_ready: 'Ready',
  historical: 'Historical',
  no_recording: 'No recording',
}

export function isLive(m: Meeting): boolean {
  return m.lifecycle === 'live'
}
export function hasEnded(m: Meeting): boolean {
  return m.lifecycle === 'ended_pending' || m.lifecycle === 'ended_ready' || m.lifecycle === 'historical' || m.lifecycle === 'no_recording'
}
export function aiEligible(m: Meeting): boolean {
  // AI runs only for non-historical meetings that have (or can have) a recording.
  return m.lifecycle !== 'historical' && m.lifecycle !== 'no_recording'
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

/** Day-group bucket label: Today / Tomorrow / weekday+date. */
export function dayGroupLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date(`${TODAY}T00:00:00`)
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((startOfDay.getTime() - today.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

/** Sort key — chronological ascending. */
export function startMs(m: Meeting): number {
  return new Date(m.startTime).getTime()
}

// --- List filters ----------------------------------------------------------

export type DateWindow = 'coming_up' | 'this_week' | 'next_week' | 'last_week'
export const DATE_WINDOW_LABEL: Record<DateWindow, string> = {
  coming_up: 'Coming Up',
  this_week: 'This Week',
  next_week: 'Next Week',
  last_week: 'Last Week',
}

function weekRange(offsetWeeks: number): [number, number] {
  // Week = Sun..Sat relative to TODAY.
  const today = new Date(`${TODAY}T00:00:00`)
  const dow = today.getDay()
  const sun = new Date(today)
  sun.setDate(today.getDate() - dow + offsetWeeks * 7)
  const satEnd = new Date(sun)
  satEnd.setDate(sun.getDate() + 7)
  return [sun.getTime(), satEnd.getTime()]
}

export function inDateWindow(m: Meeting, w: DateWindow): boolean {
  const t = startMs(m)
  const todayStart = new Date(`${TODAY}T00:00:00`).getTime()
  if (w === 'coming_up') return t >= todayStart || isLive(m)
  if (w === 'this_week') { const [a, b] = weekRange(0); return t >= a && t < b }
  if (w === 'next_week') { const [a, b] = weekRange(1); return t >= a && t < b }
  if (w === 'last_week') { const [a, b] = weekRange(-1); return t >= a && t < b }
  return true
}
