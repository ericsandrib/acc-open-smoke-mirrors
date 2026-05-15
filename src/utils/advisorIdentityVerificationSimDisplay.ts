import type { AdvisorIdentityDemoSimulation, ChildReviewState } from '@/types/workflow'

type Cip = NonNullable<ChildReviewState['cipStatus']>

export type AdvisorIdentitySimDisplay = {
  statusLabel: 'Passed' | 'Needs Attention' | 'Pending Verification' | 'Unable to Verify'
  issues: string[]
  actions: string[]
  cipStatus: Cip
  /** Shown under “Result” when overall pass. */
  resultSummary: string | null
  /** Shown when verification is still pending. */
  pendingBlurb: string | null
}

const passAll: Cip = {
  idVerification: 'pass',
  addressMatch: 'pass',
  dobMatch: 'pass',
  overallStatus: 'pass',
}

const pendingAll: Cip = {
  idVerification: 'pending',
  addressMatch: 'pending',
  dobMatch: 'pending',
  overallStatus: 'pending',
}

/** Canned advisor identity card copy for dev/demo simulations (does not read client task data). */
export function getAdvisorIdentitySimDisplay(
  sim: AdvisorIdentityDemoSimulation,
  subjectIsEntity: boolean,
): AdvisorIdentitySimDisplay {
  const rerun = 'Confirm with the client and rerun verification.'

  switch (sim) {
    case 'address_mismatch':
      return {
        statusLabel: 'Needs Attention',
        issues: [
          subjectIsEntity
            ? 'Registered or principal address does not match trusted records.'
            : 'Address does not match trusted records.',
        ],
        actions: [
          subjectIsEntity
            ? 'Review registered and principal address information with the client.'
            : 'Review the client’s address information.',
          rerun,
        ],
        cipStatus: {
          idVerification: 'pass',
          addressMatch: 'fail',
          dobMatch: 'pass',
          overallStatus: 'fail',
        },
        resultSummary: null,
        pendingBlurb: null,
      }
    case 'dob_mismatch':
      return {
        statusLabel: 'Needs Attention',
        issues: [
          subjectIsEntity
            ? 'Key date information could not be verified.'
            : 'Date of birth could not be verified.',
        ],
        actions: [
          'Confirm the date of birth with the client using official documentation.',
          rerun,
        ],
        cipStatus: {
          idVerification: 'pass',
          addressMatch: 'pass',
          dobMatch: 'fail',
          overallStatus: 'fail',
        },
        resultSummary: null,
        pendingBlurb: null,
      }
    case 'name_mismatch':
      return {
        statusLabel: 'Needs Attention',
        issues: [
          subjectIsEntity
            ? 'Legal entity name does not match trusted records.'
            : 'Name does not match trusted records.',
        ],
        actions: [
          subjectIsEntity
            ? 'Review the legal name against formation documents and the client’s records.'
            : 'Review the client’s name against their government-issued ID.',
          rerun,
        ],
        cipStatus: {
          idVerification: 'fail',
          addressMatch: 'pass',
          dobMatch: 'pass',
          overallStatus: 'fail',
        },
        resultSummary: null,
        pendingBlurb: null,
      }
    case 'tin_mismatch':
      return {
        statusLabel: 'Needs Attention',
        issues: ['SSN or tax ID does not match trusted records.'],
        actions: ['Confirm the SSN or tax ID with the client using official documentation.', rerun],
        cipStatus: {
          idVerification: 'fail',
          addressMatch: 'pass',
          dobMatch: 'pass',
          overallStatus: 'fail',
        },
        resultSummary: null,
        pendingBlurb: null,
      }
    case 'unable_to_verify':
      return {
        statusLabel: 'Unable to Verify',
        issues: ['Unable to verify identity with the details on file.'],
        actions: [
          'Review name, address, and tax ID with the client.',
          'Upload supporting ID documentation if needed.',
          rerun,
        ],
        cipStatus: {
          idVerification: 'fail',
          addressMatch: 'fail',
          dobMatch: subjectIsEntity ? 'pass' : 'fail',
          overallStatus: 'fail',
        },
        resultSummary: null,
        pendingBlurb: null,
      }
    case 'verification_pending':
      return {
        statusLabel: 'Pending Verification',
        issues: [],
        actions: [],
        cipStatus: pendingAll,
        resultSummary: null,
        pendingBlurb: 'Results are not ready yet. Check again shortly.',
      }
  }
}

export function advisorIdentitySimPassDisplay(): AdvisorIdentitySimDisplay {
  return {
    statusLabel: 'Passed',
    issues: [],
    actions: [],
    cipStatus: passAll,
    resultSummary: 'Identity successfully verified.',
    pendingBlurb: null,
  }
}
