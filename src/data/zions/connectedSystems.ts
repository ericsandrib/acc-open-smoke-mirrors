// Connected systems — Zions POC (Spec 007 Phase 8). The "sits above, doesn't replace"
// posture (RFI 2.10). Avantos reads approved data, runs governed workflows, writes
// approved outputs back. Fi-Tek is the linchpin: one connector, two schemas.

export type SystemDomain = 'Wealth' | 'Corporate Trust' | 'Planning' | 'CRM & Documents' | 'Bank'

export interface ConnectedSystem {
  name: string
  domain: SystemDomain
  what: string
  pattern: string
  reads: boolean
  writes: boolean
  note?: string
  /** Linchpin systems get emphasis in the UI. */
  highlight?: boolean
}

export const CONNECTED_SYSTEMS: ConnectedSystem[] = [
  { name: 'Fi-Tek / GWES', domain: 'Wealth', what: 'In-house custody + trust accounting', pattern: 'API / read-replica', reads: true, writes: true, highlight: true, note: 'One connector, two schemas — Wealth (~$7B / ~2K accts) and Corporate Trust (30K+ deal accts).' },
  { name: 'LPL', domain: 'Wealth', what: 'Fee + brokerage custody (~$3B / ~8K accts)', pattern: 'API / forms + e-sign', reads: true, writes: true },
  { name: 'SEI', domain: 'Wealth', what: 'Managed-account platform (favored long-term)', pattern: 'Native API + account-opening', reads: true, writes: true },
  { name: 'eMoney', domain: 'Planning', what: 'Financial planning', pattern: 'API (in production for other clients)', reads: true, writes: false },
  { name: 'Transtar', domain: 'Corporate Trust', what: 'Bond accounting', pattern: 'API (already integrated)', reads: true, writes: false },
  { name: 'Salesforce', domain: 'CRM & Documents', what: 'CRM — relationships & Cases', pattern: 'API read + controlled write-back (Cases)', reads: true, writes: true, highlight: true },
  { name: 'DocuSign', domain: 'CRM & Documents', what: 'e-Signature', pattern: 'Envelope orchestration', reads: true, writes: true },
  { name: 'Box', domain: 'CRM & Documents', what: 'Document storage', pattern: 'API (in production for other clients)', reads: true, writes: true },
  { name: 'Commercial-bank core', domain: 'Bank', what: 'Deposits, loans, credit facilities', pattern: 'Core API / enterprise data plane', reads: true, writes: false, note: 'Bank-owned wealth → a first-party core feed is the unlock for Bank → Wealth signals.' },
]

export const DOMAIN_ORDER: SystemDomain[] = ['Wealth', 'Corporate Trust', 'Planning', 'CRM & Documents', 'Bank']
