import { MILDRED_ZAPFE_KYC } from '@/data/kycFixtures/mildredZapfe'
import { SANTOS_BENNETT_KYC } from '@/data/kycFixtures/santosBennett'
import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import type { PartyKycResult } from '@/types/kycResult'

function isDemoFailParty(party: RelatedParty, suppressDemoFlag?: boolean): boolean {
  if (suppressDemoFlag) return false
  if (party.demoForceFlagAml) return true
  if (party.id === 'member-2') return true
  const fullName = `${party.firstName ?? ''} ${party.lastName ?? ''}`.trim().toLowerCase()
  return fullName === 'jane smith'
}

/** Resolve demo InstantID fixture: John / default → pass, Jane / flagged → fail. */
export function resolveKycFixtureForParty(
  party: RelatedParty,
  options?: { suppressDemoFlag?: boolean; ranAt?: string },
): PartyKycResult {
  const base = isDemoFailParty(party, options?.suppressDemoFlag)
    ? SANTOS_BENNETT_KYC
    : MILDRED_ZAPFE_KYC
  const ranAt = options?.ranAt ?? new Date().toISOString()
  return {
    ...base,
    last_run_date: ranAt,
    cip: {
      ...base.cip,
      last_run_date: ranAt,
      flags: { ...base.cip.flags },
      verified: { ...base.cip.verified },
      risk_indicators: [...base.cip.risk_indicators],
      followup_actions: [...base.cip.followup_actions],
      chronology_histories: [...base.cip.chronology_histories],
    },
    aml: {
      ...base.aml,
      last_run_date: ranAt,
      watchlist_hits: [...(base.aml.watchlist_hits ?? [])],
      risk_indicators: [...(base.aml.risk_indicators ?? [])],
    },
  }
}

function defaultOwnerCipFromKyc(kyc: PartyKycResult): OwnerKycReviewState['cipStatus'] {
  const pass = kyc.cip.status === 'Pass'
  const fail = kyc.cip.status === 'Fail'
  const match = pass ? ('pass' as const) : fail ? ('fail' as const) : ('pending' as const)
  return {
    idVerification: match,
    addressMatch: match,
    dobMatch: kyc.cip.verified.dob_verified ? 'pass' : fail ? 'fail' : 'pending',
    overallStatus: pass ? 'pass' : fail ? 'fail' : 'pending',
  }
}

/** Align legacy owner review state with fixture for workflow chips and phases. */
export function ownerReviewPatchFromKycFixture(
  kyc: PartyKycResult,
  options?: { reRunReason?: string; runBy?: string; isReRun?: boolean },
): Partial<OwnerKycReviewState> {
  const pass = kyc.status === 'Pass'
  const amlHits = kyc.aml.watchlist_hits ?? []
  const ofacCount = amlHits.filter((h) => h.table.toLowerCase().includes('ofac')).length

  return {
    autoTriggeredAt: kyc.last_run_date,
    kycVerificationLastCheckedAt: kyc.last_run_date,
    kycVerificationResultSummary: pass
      ? 'Identity verification passed (automated).'
      : 'Automated screening returned potential matches — pending AML review.',
    cipStatus: defaultOwnerCipFromKyc(kyc),
    amlReview: pass
      ? { status: 'cleared', decidedAt: kyc.last_run_date, approvalReason: 'Automated screening — no hits' }
      : { status: 'flagged', decidedAt: kyc.last_run_date },
    hoKycReview: pass
      ? { status: 'approved', decidedAt: kyc.last_run_date }
      : { status: 'pending' },
    amlPayloadDemo: {
      ofacMatches: ofacCount,
      watchlistHits: amlHits.map((h) => `${h.table} (${h.record_number})`),
      summary: pass
        ? 'Automated screening completed — no OFAC / PEP / watchlist hits.'
        : 'Watchlist matches require AML team review.',
    },
    cipPayloadDemo: {
      identityProvider: 'LexisNexis InstantID',
      mismatches:
        kyc.cip.status === 'Fail'
          ? ['Vendor decision RED — identity verification failed']
          : [],
    },
    reusableVerifiedKyc: pass,
    provider: 'LexisNexis InstantID',
    runType: options?.isReRun ? 'Re-run' : 'Automated',
    triggerSource: options?.isReRun ? 'Manual re-run' : 'Forms package sent to client',
    lastReRunBy: options?.isReRun ? options.runBy : undefined,
    reRunReason: options?.reRunReason,
  }
}

export function partyHasAmlWatchlistHits(party: RelatedParty): boolean {
  return (party.kyc?.aml.watchlist_hits?.length ?? 0) > 0
}
