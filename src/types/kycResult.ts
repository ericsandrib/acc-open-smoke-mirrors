/** LexisNexis InstantID KYC result stored on {@link RelatedParty.kyc} (demo). */

export type KycVendorStatus = 'Pass' | 'Fail' | 'Expired' | 'Error'
export type KycVendorDecision = 'GREEN' | 'YELLOW' | 'RED'

export interface KycRiskIndicator {
  code: string
  description: string
  sequence: number
}

export interface KycFollowupAction {
  code: string
  description: string
}

export interface KycWatchlistHit {
  table: string
  record_number: string
  matched_name: string
  matched_address: string
  country: string
  entity_name: string | null
  sequence: number
}

export interface KycChronologyHistory {
  address: string
  phone?: string
  date_first_seen?: string
  date_last_seen?: string
  is_best_address: boolean
}

export interface KycCipBlock {
  status: KycVendorStatus
  last_run_date: string
  vendor: 'LEXISNEXIS'
  vendor_product: 'InstantID'
  vendor_order_id: string
  decision: KycVendorDecision
  verified: {
    name: string
    address: string
    ssn_matched: boolean
    dob_verified: boolean
    dob_match_level: number
    name_address_ssn_summary: number
    comprehensive_verification_index: number
  }
  risk_indicators: KycRiskIndicator[]
  followup_actions: KycFollowupAction[]
  flags: {
    address_po_box: boolean
    address_cmra: boolean
    passport_validated: boolean
    found_ssn_count: number
    red_flags: boolean
    /** Specific red-flag detail when returned by vendor; otherwise UI falls back to generic copy. */
    red_flags_detail?: string | null
  }
  ssn_info?: {
    valid: string
    issued_location: string
    issued_start_date: string
    issued_end_date: string
  }
  reverse_phone?: {
    name: string
    address: string
  }
  phone_of_name_address?: string
  chronology_histories: KycChronologyHistory[]
}

export interface KycAmlBlock {
  status: KycVendorStatus | null
  last_run_date: string | null
  vendor: 'LEXISNEXIS' | null
  vendor_product: 'InstantID' | null
  vendor_order_id: string | null
  watchlist_hits: KycWatchlistHit[]
  risk_indicators: KycRiskIndicator[]
}

export interface PartyKycResult {
  status: KycVendorStatus
  last_run_date: string
  cip: KycCipBlock
  aml: KycAmlBlock
}
