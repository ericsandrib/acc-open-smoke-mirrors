import type { ChildReviewState } from '@/types/workflow'

type Cip = NonNullable<ChildReviewState['cipStatus']>

function readInfo(info: Record<string, unknown>, subjectIsEntity: boolean) {
  const s = (k: string) => (typeof info[k] === 'string' ? (info[k] as string).trim() : '')
  const nameOk = subjectIsEntity ? Boolean(s('legalName')) : Boolean(s('firstName') && s('lastName'))
  const tinOk = Boolean(s('taxId'))
  const dobOk = subjectIsEntity ? true : Boolean(s('dob'))
  const addrOk = subjectIsEntity
    ? Boolean(s('registeredStreet') || s('principalStreet'))
    : Boolean(s('legalStreet'))
  return { nameOk, tinOk, dobOk, addrOk, s }
}

export type AdvisorIdentityHeadlineStatus =
  | 'Passed'
  | 'Needs attention'
  | 'Pending verification'
  | 'Unable to verify'

/** Operational issues + remediation steps for advisors (no AML / watchlist language). */
export function buildAdvisorIdentityGuidance(
  cip: Cip | undefined,
  info: Record<string, unknown>,
  subjectIsEntity: boolean,
): { issues: string[]; actions: string[]; headlineStatus: AdvisorIdentityHeadlineStatus } {
  if (!cip || cip.overallStatus === 'pending') {
    return { issues: [], actions: [], headlineStatus: 'Pending verification' }
  }

  if (cip.overallStatus === 'pass') {
    return { issues: [], actions: [], headlineStatus: 'Passed' }
  }

  const { nameOk, tinOk, dobOk, addrOk, s } = readInfo(info, subjectIsEntity)
  const issues: string[] = []
  const actions = new Set<string>()

  if (cip.idVerification === 'fail') {
    if (!nameOk) {
      if (subjectIsEntity) {
        if (!s('legalName')) issues.push('Legal entity name is missing or incomplete.')
        else issues.push('Legal entity name could not be verified against trusted records.')
      } else if (!s('firstName') || !s('lastName')) {
        issues.push('Client name is incomplete or could not be verified.')
      } else {
        issues.push('Name does not match trusted records.')
      }
      if (subjectIsEntity) {
        actions.add('Confirm the legal name against formation documents and the client’s records.')
      } else {
        actions.add('Review the client’s name against their government-issued ID.')
      }
    }

    if (!tinOk) {
      issues.push('SSN or tax ID is missing or could not be verified.')
      actions.add('Confirm the SSN or tax ID with the client.')
    } else if (!nameOk) {
      // Name failed; tax ID present — still prompt to double-check numbers on ID.
      actions.add('Confirm the SSN or tax ID matches the client’s documentation.')
    }
  }

  if (cip.addressMatch === 'fail') {
    if (!addrOk) {
      issues.push(
        subjectIsEntity
          ? 'Registered or principal business address is incomplete or could not be verified.'
          : 'Home address is incomplete or could not be verified.',
      )
    } else {
      issues.push('Address does not match trusted records.')
    }
    actions.add(
      subjectIsEntity
        ? 'Review registered and principal address fields with the client.'
        : 'Review and update the client’s home address.',
    )
  }

  if (!subjectIsEntity && cip.dobMatch === 'fail') {
    if (!dobOk) issues.push('Date of birth is missing or could not be verified.')
    else issues.push('Date of birth could not be verified.')
    actions.add('Confirm the date of birth with the client using official documentation.')
  }

  if (issues.length === 0) {
    issues.push('Unable to verify identity with the details on file.')
    actions.add('Review the profile sections above, then rerun the identity check.')
  } else {
    actions.add('Upload supporting ID documentation if needed.')
  }

  const failCount =
    (cip.idVerification === 'fail' ? 1 : 0) +
    (cip.addressMatch === 'fail' ? 1 : 0) +
    (!subjectIsEntity && cip.dobMatch === 'fail' ? 1 : 0)
  const maxFails = subjectIsEntity ? 2 : 3
  const headlineStatus: 'Needs attention' | 'Unable to verify' =
    failCount >= maxFails && failCount > 0 ? 'Unable to verify' : 'Needs attention'

  return {
    issues,
    actions: [...actions],
    headlineStatus,
  }
}
