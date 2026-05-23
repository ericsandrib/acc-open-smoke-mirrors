/** How KYC is orchestrated in the onboarding demo. */
export type KycWorkflowMode = 'separate' | 'single-flow'

const STORAGE_KEY = 'kyc-workflow-mode'

export function getPersistedKycWorkflowMode(): KycWorkflowMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'separate') return 'separate'
  if (stored === 'single-flow') return 'single-flow'
  return 'single-flow'
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
