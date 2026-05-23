/** Sort journey groups newest-first (matches Journeys tab “Sort Created” default). */
export function sortJourneyGroupsByCreated<
  T extends { journeyId: string; createdAt?: string },
>(groups: T[], pinJourneyId?: string): T[] {
  const sorted = [...groups].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
  )
  if (!pinJourneyId) return sorted
  const pinned = sorted.find((g) => g.journeyId === pinJourneyId)
  if (!pinned) return sorted
  return [pinned, ...sorted.filter((g) => g.journeyId !== pinJourneyId)]
}
