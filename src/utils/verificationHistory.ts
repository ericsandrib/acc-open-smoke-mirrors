import type { VerificationSnapshot } from '@/types/workflow'

/**
 * Owner "Verification history" is for KYC screening runs only (initial + re-runs).
 * Reviewer dispositions (AML/CIP approve, reject, request info) live on Application Activity.
 */
export function snapshotsForVerificationHistory(
  snapshots?: VerificationSnapshot[],
): VerificationSnapshot[] {
  return (snapshots ?? []).filter((s) => s.eventKind === 'screening_run')
}
