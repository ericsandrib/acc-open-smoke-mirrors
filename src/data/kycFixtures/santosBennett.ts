import type { PartyKycResult } from '@/types/kycResult'

/** Demo stub — SANTOS BENNETT (RED, watchlist hits). */
export const SANTOS_BENNETT_KYC: PartyKycResult = {
  status: 'Fail',
  last_run_date: '2026-05-22T12:15:03.389Z',
  cip: {
    status: 'Fail',
    last_run_date: '2026-05-22T12:15:03.389Z',
    vendor: 'LEXISNEXIS',
    vendor_product: 'InstantID',
    vendor_order_id: '15O2RED161VK',
    decision: 'RED',
    verified: {
      name: 'SANTOS BENNETT',
      address: '2200 Commerce St, Dallas, TX 75201',
      ssn_matched: true,
      dob_verified: false,
      dob_match_level: 4,
      name_address_ssn_summary: 5,
      comprehensive_verification_index: 30,
    },
    risk_indicators: [
      {
        code: '07',
        description: 'The input phone number is a disconnected number',
        sequence: 1,
      },
    ],
    followup_actions: [],
    flags: {
      address_po_box: true,
      address_cmra: true,
      passport_validated: false,
      found_ssn_count: 1,
      red_flags: true,
    },
    reverse_phone: {
      name: 'TIM TRIP',
      address: '118 Oak Ridge Dr, Dallas, TX 75204',
    },
    phone_of_name_address: '(214) 555-0192',
    chronology_histories: [
      {
        address: '2200 Commerce St, Dallas, TX 75201',
        date_first_seen: '2019-03',
        date_last_seen: '2024-11',
        is_best_address: true,
      },
    ],
  },
  aml: {
    status: 'Fail',
    last_run_date: '2026-05-22T12:15:03.389Z',
    vendor: 'LEXISNEXIS',
    vendor_product: 'InstantID',
    vendor_order_id: '15O2RED161VK',
    watchlist_hits: [
      {
        table: 'OFAC Sanctions',
        record_number: 'OFAC111',
        matched_name: 'SANTOS BENNETT',
        matched_address: '2200 Commerce St, Dallas, TX 75201',
        country: 'US',
        entity_name: null,
        sequence: 1,
      },
      {
        table: 'Foreign Agents Registrations',
        record_number: 'AQI363',
        matched_name: 'SANTOS BENNETT',
        matched_address: '2200 Commerce St, Dallas, TX 75201',
        country: 'US',
        entity_name: null,
        sequence: 2,
      },
    ],
    risk_indicators: [
      {
        code: '32',
        description: 'OFAC match identified',
        sequence: 1,
      },
      {
        code: 'WL',
        description: 'Non-global watchlist match identified',
        sequence: 2,
      },
    ],
  },
}
