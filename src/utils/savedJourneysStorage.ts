import type { Journey } from '@/types/servicing'

const SAVED_ONBOARDING_JOURNEYS_KEY = 'demo-saved-onboarding-journeys'

/** Snapshots taken when starting a new journey (Compose “Start”) — survive page refresh. */
export function readSavedOnboardingJourneys(): Journey[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(SAVED_ONBOARDING_JOURNEYS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Journey[]) : []
  } catch {
    return []
  }
}

export function writeSavedOnboardingJourneys(journeys: Journey[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SAVED_ONBOARDING_JOURNEYS_KEY, JSON.stringify(journeys))
  } catch {
    // ignore quota / private mode
  }
}
