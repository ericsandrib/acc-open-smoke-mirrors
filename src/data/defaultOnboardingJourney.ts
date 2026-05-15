/** Primary advisor onboarding demo — matches `relationships` John Smith household. */
export const JOHN_SMITH_ONBOARDING_JOURNEY_ID = 'journey-john-smith'
export const JOHN_SMITH_ONBOARDING_JOURNEY_NAME = 'John Smith Onboarding'

export function isHoDemoServicingJourneyId(journeyId: string | undefined): boolean {
  return Boolean(journeyId?.startsWith('journey-ho-demo-'))
}
