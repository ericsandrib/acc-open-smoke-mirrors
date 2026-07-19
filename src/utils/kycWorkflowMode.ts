/** How KYC is orchestrated in the onboarding demo. */
export type KycWorkflowMode = 'separate' | 'single-flow'

const STORAGE_KEY = 'kyc-workflow-mode'

export function getPersistedKycWorkflowMode(): KycWorkflowMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'separate') return 'separate'
  if (stored === 'single-flow') return 'single-flow'
  // Stratos default (2026-07-19): KYC runs early as its own per-person workflows.
  // Single-flow (batched at forms-package send) is retained behind the internal
  // Settings toggle to support the one-workflow-vs-two discussion.
  return 'separate'
}

export function persistKycWorkflowMode(mode: KycWorkflowMode): void {
  localStorage.setItem(STORAGE_KEY, mode)
}

export function isSingleFlowKycMode(mode: KycWorkflowMode): boolean {
  return mode === 'single-flow'
}

export function kycWorkflowModeLabel(mode: KycWorkflowMode): string {
  return mode === 'single-flow'
    ? 'Single account workflow (KYC embedded in Account & Owners)'
    : 'Separate KYC and account opening child workflows'
}
