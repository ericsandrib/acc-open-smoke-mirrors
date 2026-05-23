/**
 * Primary advisor onboarding walkthrough (list label is fictional; workflow uses
 * `john-smith-household` in `relationships`).
 */
export const JOHN_SMITH_ONBOARDING_JOURNEY_ID = 'journey-john-smith'
/** Journeys table — matches HO demo rows (e.g. “Hargrove household account opening”). */
export const JOHN_SMITH_ONBOARDING_JOURNEY_NAME = 'Hartley household account opening'
/** Journeys table relationship column (e.g. “Hargrove / Ngo household”). */
export const PRIMARY_ONBOARDING_DEMO_RELATIONSHIP_LABEL = 'Hartley / Owens household'
/** Relationship row loaded when opening {@link JOHN_SMITH_ONBOARDING_JOURNEY_ID}. */
export const PRIMARY_ONBOARDING_DEMO_RELATIONSHIP_ID = 'john-smith-household'

export function isHoDemoServicingJourneyId(journeyId: string | undefined): boolean {
  return Boolean(journeyId?.startsWith('journey-ho-demo-'))
}
