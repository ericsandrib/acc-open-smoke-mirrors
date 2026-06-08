import type { PartyKycResult } from '@/types/kycResult'

/** Pre-parsed from LexisNexis InstantID — MILDRED ZAPFE (GREEN, no watchlist hits). */
export const MILDRED_ZAPFE_KYC: PartyKycResult = {
  status: 'Pass',
  last_run_date: '2026-05-22T12:15:03.389Z',
  cip: {
    status: 'Pass',
    last_run_date: '2026-05-22T12:15:03.389Z',
    vendor: 'LEXISNEXIS',
    vendor_product: 'InstantID',
    vendor_order_id: '15O2PVC161VK',
    decision: 'GREEN',
    verified: {
      name: 'MILDRED A ZAPFE',
      address: '101 GIBBENS LN APT C, Belpre, OH 45714',
      ssn_matched: true,
      dob_verified: true,
      dob_match_level: 8,
      name_address_ssn_summary: 8,
      comprehensive_verification_index: 10,
    },
    risk_indicators: [
      {
        code: '75',
        description:
          'The input name and address are associated with an unlisted/non-published phone number',
        sequence: 1,
      },
    ],
    followup_actions: [
      {
        code: 'B',
        description:
          'Verify name with Social (via SSN card, DL if applicable, paycheck stub, or other Government Issued ID)',
      },
    ],
    flags: {
      address_po_box: true,
      address_cmra: true,
      passport_validated: false,
      found_ssn_count: 0,
      red_flags: false,
    },
    chronology_histories: [
      {
        address: '101 GIBBENS LN APT C',
        is_best_address: false,
      },
    ],
  },
  aml: {
    status: null,
    last_run_date: '2026-05-22T12:15:03.389Z',
    vendor: 'LEXISNEXIS',
    vendor_product: 'InstantID',
    vendor_order_id: '15O2PVC161VK',
    watchlist_hits: [],
    risk_indicators: [],
  },
}
