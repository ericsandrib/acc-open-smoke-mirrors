import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import type { KycCipBlock, PartyKycResult } from '@/types/kycResult'

export type SubsystemPassFail = 'Pass' | 'Fail' | 'Pending'
export type VerificationCardStatus = SubsystemPassFail | 'Error' | 'Expired'

export function overallKycPassFailFromKyc(kyc: PartyKycResult): SubsystemPassFail {
  if (kyc.status === 'Pass') return 'Pass'
  if (kyc.status === 'Fail') return 'Fail'
  return 'Pending'
}

export function overallKycCardStatus(kyc: PartyKycResult): VerificationCardStatus {
  if (kyc.status === 'Pass') return 'Pass'
  if (kyc.status === 'Fail') return 'Fail'
  if (kyc.status === 'Error') return 'Error'
  if (kyc.status === 'Expired') return 'Expired'
  return 'Pending'
}

export function cipCardStatus(cip: KycCipBlock): VerificationCardStatus {
  if (cip.status === 'Pass') return 'Pass'
  if (cip.status === 'Fail') return 'Fail'
  if (cip.status === 'Error') return 'Error'
  if (cip.status === 'Expired') return 'Expired'
  return 'Pending'
}

export function amlCardStatus(kyc: PartyKycResult): VerificationCardStatus {
  const { aml } = kyc
  if (aml.status === 'Error') return 'Error'
  if (aml.status === 'Expired') return 'Expired'
  if (!aml.last_run_date) return 'Pending'
  const hits = aml.watchlist_hits?.length ?? 0
  if (hits > 0 || aml.status === 'Fail') return 'Fail'
  return 'Pass'
}

export function overallKycPassFailFromOwner(
  owner?: OwnerKycReviewState,
  party?: RelatedParty,
): SubsystemPassFail {
  if (party?.kyc) return overallKycPassFailFromKyc(party.kyc)
  if (!owner?.autoTriggeredAt) return 'Pending'
  if (owner.amlReview?.status === 'flagged' || owner.amlReview?.status === 'escalated') {
    return 'Fail'
  }
  if (owner.cipStatus?.overallStatus === 'fail') return 'Fail'
  if (owner.amlReview?.status === 'cleared' && owner.cipStatus?.overallStatus === 'pass') {
    return 'Pass'
  }
  if (owner.hoKycReview?.status === 'approved' && owner.amlReview?.status === 'cleared') {
    return 'Pass'
  }
  return 'Pending'
}

export function amlPassFailFromKyc(kyc: PartyKycResult): SubsystemPassFail {
  const hits = kyc.aml.watchlist_hits?.length ?? 0
  if (hits > 0 || kyc.aml.status === 'Fail') return 'Fail'
  return 'Pass'
}

export function cipPassFailFromKyc(kyc: PartyKycResult): SubsystemPassFail {
  return kyc.cip.status === 'Pass' ? 'Pass' : 'Fail'
}

export function amlPassFailFromOwner(owner?: OwnerKycReviewState): SubsystemPassFail {
  const hits = owner?.amlPayloadDemo?.watchlistHits?.length ?? 0
  if (hits > 0) return 'Fail'
  if (owner?.amlReview?.status === 'flagged' || owner?.amlReview?.status === 'escalated') {
    return 'Fail'
  }
  if (owner?.amlReview?.status === 'cleared') return 'Pass'
  return owner?.autoTriggeredAt ? 'Pass' : 'Fail'
}

export function cipPassFailFromOwner(
  owner?: OwnerKycReviewState,
  party?: RelatedParty,
): SubsystemPassFail {
  if (party?.kyc) return cipPassFailFromKyc(party.kyc)
  if (owner?.cipStatus?.overallStatus === 'fail') return 'Fail'
  if (owner?.cipStatus?.overallStatus === 'pass' || owner?.hoKycReview?.status === 'approved') {
    return 'Pass'
  }
  return owner?.autoTriggeredAt ? 'Pass' : 'Fail'
}
