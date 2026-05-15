import { JOHN_SMITH_ONBOARDING_JOURNEY_ID } from '@/data/defaultOnboardingJourney'

const STORAGE_KEY = 'demo-last-created-journey-id'

export function readLastCreatedJourneyId(): string {
  if (typeof window === 'undefined') return JOHN_SMITH_ONBOARDING_JOURNEY_ID
  return localStorage.getItem(STORAGE_KEY) ?? JOHN_SMITH_ONBOARDING_JOURNEY_ID
}

export function writeLastCreatedJourneyId(journeyId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, journeyId)
}
