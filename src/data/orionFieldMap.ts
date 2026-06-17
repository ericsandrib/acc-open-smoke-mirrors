// Stratos Orion → Avantos field map.
//
// Source: Stratos_Orion_Data_Model 2.xlsx (received 2026-05-11). Every row
// in the spreadsheet's Y/N column is preserved here. The map is the single
// source of truth for three downstream behaviors:
//
//   1. Seed   — we only populate fields where `available = true`.
//   2. UI     — the Household tab and account drawer use `getOrionField()`
//               to decide whether to render a real value, a "-" placeholder
//               (Avantos-tracked but not yet captured), or an <NaField />
//               (explicitly NOT in Stratos's Orion).
//   3. Report — /orion-gaps reads `availability === false` rows and
//               renders a printable table for live client conversations.
//
// Keep entries ordered by tab → section as they appear in the spreadsheet.

export type OrionTab =
  | 'Household'
  | 'Registration'
  | 'Account'
  | 'Portfolio Group'
  | 'Asset (Position)'
  | 'Reference Data'

export interface OrionField {
  tab: OrionTab
  section: string
  /** Field name as it appears in Orion */
  field: string
  /** Whether Stratos's Orion instance has this populated today */
  available: boolean
  /**
   * Where this surfaces (or would surface) in the prototype UI. Empty
   * string for fields we don't currently render anywhere — those still go
   * in the gap report but aren't blockers for the UX.
   */
  uiSurface?: string
  /**
   * For unavailable fields, our best guess at where the data SHOULD come
   * from in production. Used in the gap report.
   */
  suggestedSource?: 'CRM' | 'Manual entry' | 'External integration' | 'Derived'
  /** Optional one-line context for the gap report. */
  note?: string
}

export const ORION_FIELDS: OrionField[] = [
  // ─── Household > General ────────────────────────────────────────────
  { tab: 'Household', section: 'General', field: 'First Name', available: true, uiSurface: 'Household tab • Basic' },
  { tab: 'Household', section: 'General', field: 'Last Name', available: true, uiSurface: 'Household tab • Basic' },
  { tab: 'Household', section: 'General', field: 'Full Name', available: true, uiSurface: 'Relationships list • Header' },
  { tab: 'Household', section: 'General', field: 'Active', available: true, uiSurface: 'Relationships list • Status' },
  { tab: 'Household', section: 'General', field: 'Primary Representative', available: true, uiSurface: 'Relationships list • Advisor' },
  { tab: 'Household', section: 'General', field: 'Statement Delivery', available: true, uiSurface: 'Account drawer' },
  { tab: 'Household', section: 'General', field: 'Video Statement Delivery', available: true, uiSurface: 'Account drawer' },
  { tab: 'Household', section: 'General', field: 'Category', available: true, uiSurface: 'Right rail • Offerings' },
  { tab: 'Household', section: 'General', field: 'ADV Client Category', available: true, uiSurface: 'Account drawer' },
  { tab: 'Household', section: 'General', field: 'Start Date', available: true, uiSurface: 'Detail header • Client since' },
  { tab: 'Household', section: 'General', field: 'SSN/Tax ID', available: true, uiSurface: 'Household tab • Basic' },
  { tab: 'Household', section: 'General', field: 'Report Name', available: false, suggestedSource: 'Manual entry', note: 'Often "Last, First" format for statements; not maintained in Orion.' },
  { tab: 'Household', section: 'General', field: 'Prefix', available: false, suggestedSource: 'CRM', note: 'Mr./Mrs./Dr. — typically lives in CRM contact record.' },
  { tab: 'Household', section: 'General', field: 'Suffix', available: false, suggestedSource: 'CRM', note: 'Jr./Sr./III — CRM contact record.' },
  { tab: 'Household', section: 'General', field: 'Salutation', available: false, suggestedSource: 'CRM', note: 'Preferred greeting for correspondence.' },
  { tab: 'Household', section: 'General', field: 'Gender', available: false, suggestedSource: 'CRM' },
  { tab: 'Household', section: 'General', field: 'DOB', available: true, uiSurface: 'Household tab • Basic' },
  { tab: 'Household', section: 'General', field: 'Age', available: false, suggestedSource: 'Derived', note: 'Derive from DOB at render time — no need to store.' },
  { tab: 'Household', section: 'General', field: 'Qualified Investor', available: false, suggestedSource: 'Manual entry', note: 'Accredited / qualified-purchaser determination; typically set during KYC.' },

  // ─── Household > Address ────────────────────────────────────────────
  { tab: 'Household', section: 'Address', field: 'US Resident', available: true, uiSurface: 'Household tab • Address' },
  { tab: 'Household', section: 'Address', field: 'Address 1', available: true, uiSurface: 'Household tab • Address' },
  { tab: 'Household', section: 'Address', field: 'City', available: true, uiSurface: 'Household tab • Address' },
  { tab: 'Household', section: 'Address', field: 'State', available: true, uiSurface: 'Household tab • Address' },
  { tab: 'Household', section: 'Address', field: 'Zip', available: true, uiSurface: 'Household tab • Address' },
  { tab: 'Household', section: 'Address', field: 'Address 2', available: false, suggestedSource: 'CRM', note: 'Apt/Suite/Unit line — captured on CRM forms.' },
  { tab: 'Household', section: 'Address', field: 'Address 3', available: false, suggestedSource: 'CRM' },
  { tab: 'Household', section: 'Address', field: 'Country', available: false, suggestedSource: 'Manual entry', note: 'Defaults to US given the US Resident flag; needed for non-resident accounts.' },

  // ─── Household > Contact ────────────────────────────────────────────
  { tab: 'Household', section: 'Contact', field: 'Email', available: true, uiSurface: 'Household tab • Contact' },
  { tab: 'Household', section: 'Contact', field: 'Home Phone', available: false, suggestedSource: 'CRM' },
  { tab: 'Household', section: 'Contact', field: 'Work Phone', available: false, suggestedSource: 'CRM' },
  { tab: 'Household', section: 'Contact', field: 'Fax', available: false, suggestedSource: 'CRM', note: 'Rarely needed; skip unless a compliance use-case appears.' },
  { tab: 'Household', section: 'Contact', field: 'Pager', available: false, suggestedSource: 'CRM', note: 'Legacy field; skip.' },
  { tab: 'Household', section: 'Contact', field: 'Other Phone', available: false, suggestedSource: 'CRM' },
  { tab: 'Household', section: 'Contact', field: 'Mobile', available: false, suggestedSource: 'CRM', note: 'Most important phone field — likely a phase-one CRM integration.' },
  { tab: 'Household', section: 'Contact', field: 'Web', available: false, suggestedSource: 'Manual entry' },

  // ─── Registration > General ─────────────────────────────────────────
  { tab: 'Registration', section: 'General', field: 'Household', available: true, uiSurface: 'Account drawer' },
  { tab: 'Registration', section: 'General', field: 'Registration Name', available: true, uiSurface: 'Account drawer' },
  { tab: 'Registration', section: 'General', field: 'Account Type', available: true, uiSurface: 'Financial Accounts table' },
  { tab: 'Registration', section: 'General', field: 'First Name', available: true, uiSurface: 'Household tab' },
  { tab: 'Registration', section: 'General', field: 'SSN/Tax ID', available: true, uiSurface: 'Household tab' },
  { tab: 'Registration', section: 'General', field: 'Last Name', available: true, uiSurface: 'Household tab' },
  { tab: 'Registration', section: 'General', field: 'Active', available: true },
  { tab: 'Registration', section: 'General', field: 'US Resident', available: true, uiSurface: 'Household tab • Address' },
  { tab: 'Registration', section: 'General', field: 'Company', available: false, suggestedSource: 'CRM', note: 'Employer name; lives on the CRM contact record.' },
  { tab: 'Registration', section: 'General', field: 'Prefix', available: false, suggestedSource: 'CRM' },
  { tab: 'Registration', section: 'General', field: 'Job Title', available: false, suggestedSource: 'CRM' },
  { tab: 'Registration', section: 'General', field: 'Suffix', available: false, suggestedSource: 'CRM' },
  { tab: 'Registration', section: 'General', field: 'Target Spend Rate', available: false, suggestedSource: 'Manual entry', note: 'Planning input; typically set in eMoney / RightCapital.' },
  { tab: 'Registration', section: 'General', field: 'Gender', available: false, suggestedSource: 'CRM' },
  { tab: 'Registration', section: 'General', field: 'Target Dollar Amount', available: false, suggestedSource: 'Manual entry', note: 'Retirement / spending target; planning input.' },
  { tab: 'Registration', section: 'General', field: 'DOB', available: true, uiSurface: 'Household tab' },
  { tab: 'Registration', section: 'General', field: 'Target Date', available: false, suggestedSource: 'Manual entry', note: 'Retirement target date; planning input.' },
  { tab: 'Registration', section: 'General', field: 'Age', available: false, suggestedSource: 'Derived' },
  { tab: 'Registration', section: 'General', field: 'DOD', available: false, suggestedSource: 'Manual entry', note: 'Date of death — only on deceased clients; CRM or manual.' },

  // ─── Registration > Audit ───────────────────────────────────────────
  { tab: 'Registration', section: 'Audit', field: 'Edited By', available: true },
  { tab: 'Registration', section: 'Audit', field: 'Created By', available: true },

  // ─── Registration > Suitability ─────────────────────────────────────
  { tab: 'Registration', section: 'Suitability', field: 'Investment Objective', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Suitability', field: 'Time Horizon', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Suitability', field: 'Liquid Net Worth', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Suitability', field: 'Net Worth', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Suitability', field: 'Net Income', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Suitability', field: 'Stock Percent', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Suitability', field: 'Bond Percent', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Suitability', field: 'Investment Knowledge', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Suitability', field: 'Investment Experience', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Suitability', field: 'Return Objective', available: false, suggestedSource: 'Manual entry', note: 'Stated return objective; often inferred from objective + horizon.' },
  { tab: 'Registration', section: 'Suitability', field: 'Net Worth Include Residence', available: false, suggestedSource: 'Manual entry', note: 'Net Worth breakdown; captured in KYC form.' },
  { tab: 'Registration', section: 'Suitability', field: 'Net Worth Exclude Residence', available: false, suggestedSource: 'Manual entry' },
  { tab: 'Registration', section: 'Suitability', field: 'Lifestyle Option', available: false, suggestedSource: 'Manual entry', note: 'Planning input; often "conservative spender" / "moderate" / etc.' },
  { tab: 'Registration', section: 'Suitability', field: 'Suitability Review Completed', available: false, suggestedSource: 'Manual entry', note: 'Compliance attestation; needs a workflow.' },
  { tab: 'Registration', section: 'Suitability', field: 'Completed Date', available: false, suggestedSource: 'Manual entry', note: 'Date of last suitability review.' },

  // ─── Registration > Risk ────────────────────────────────────────────
  { tab: 'Registration', section: 'Risk', field: 'Risk Exposure', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Risk', field: 'Risk Tolerance', available: true, uiSurface: 'Household tab • KYC' },
  { tab: 'Registration', section: 'Risk', field: 'Risk Budget', available: false, suggestedSource: 'External integration', note: 'Typically Riskalyze / Nitrogen score; integration needed.' },

  // ─── Account > General ──────────────────────────────────────────────
  { tab: 'Account', section: 'General', field: 'Registration', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Active', available: true, uiSurface: 'Financial Accounts table' },
  { tab: 'Account', section: 'General', field: 'Account Number', available: true, uiSurface: 'Financial Accounts table' },
  { tab: 'Account', section: 'General', field: 'Discretionary', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Custodial Rep Code', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Fund Family', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Management Style', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'ADV Reportable', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Sub-advisor', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Managed', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Download Source', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Account Status', available: true, uiSurface: 'Financial Accounts table' },
  { tab: 'Account', section: 'General', field: 'Custodian', available: true, uiSurface: 'Financial Accounts table' },
  { tab: 'Account', section: 'General', field: 'Share Class', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Business Line', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Price Hierarchy', available: true, uiSurface: 'Account drawer' },
  { tab: 'Account', section: 'General', field: 'Wrap Managed', available: false, suggestedSource: 'Manual entry', note: 'Wrap-fee program flag.' },
  { tab: 'Account', section: 'General', field: 'Nickname', available: false, suggestedSource: 'Manual entry', note: 'Advisor-facing label; nice-to-have, set in UI.' },
  { tab: 'Account', section: 'General', field: 'Wrap Sponsored', available: false, suggestedSource: 'Manual entry' },
  { tab: 'Account', section: 'General', field: '13f Reportable', available: false, suggestedSource: 'Manual entry', note: 'Regulatory flag for 13F filing.' },
  { tab: 'Account', section: 'General', field: 'AUA Reportable', available: false, suggestedSource: 'Manual entry', note: 'Assets-under-advisement reporting flag.' },
  { tab: 'Account', section: 'General', field: 'Provider', available: false, suggestedSource: 'Manual entry', note: 'Account product provider, distinct from custodian.' },
  { tab: 'Account', section: 'General', field: 'Linked Account', available: false, suggestedSource: 'Derived' },
  { tab: 'Account', section: 'General', field: 'Sweep Account', available: false, suggestedSource: 'External integration', note: 'Cash sweep destination account; custodian feed.' },
  { tab: 'Account', section: 'General', field: 'Position Only Recon', available: false, suggestedSource: 'Manual entry' },
  { tab: 'Account', section: 'General', field: 'Unfunded', available: false, suggestedSource: 'Derived', note: 'Derive from balance = 0 at open time.' },
  { tab: 'Account', section: 'General', field: 'Bundled Fees', available: false, suggestedSource: 'Manual entry' },
  { tab: 'Account', section: 'General', field: 'Risk Score', available: false, suggestedSource: 'External integration', note: 'Riskalyze/Nitrogen score; integration needed.' },
  { tab: 'Account', section: 'General', field: 'Exclude Firm Assets For Composites', available: false, suggestedSource: 'Manual entry' },
  { tab: 'Account', section: 'General', field: 'Outside ID', available: false, suggestedSource: 'CRM', note: 'External system identifier; CRM cross-ref.' },
  { tab: 'Account', section: 'General', field: 'Qualified Plan', available: false, suggestedSource: 'Manual entry', note: 'ERISA-qualified flag.' },

  // ─── Account > Documents ────────────────────────────────────────────
  { tab: 'Account', section: 'Documents', field: 'Include System Generated Documents', available: true, uiSurface: 'Documents tab (TBD)' },
  { tab: 'Account', section: 'Documents', field: 'Document Category', available: true, uiSurface: 'Documents tab (TBD)' },
  { tab: 'Account', section: 'Documents', field: 'Document Description', available: true, uiSurface: 'Documents tab (TBD)' },
  { tab: 'Account', section: 'Documents', field: 'Document Edited By', available: true, uiSurface: 'Documents tab (TBD)' },
  { tab: 'Account', section: 'Documents', field: 'Document Edited Date', available: true, uiSurface: 'Documents tab (TBD)' },

  // ─── Account > Billing > General ────────────────────────────────────
  { tab: 'Account', section: 'Billing > General', field: 'Pay Method', available: true, uiSurface: 'Billing tab • Billable Accounts' },
  { tab: 'Account', section: 'Billing > General', field: 'Fee Schedule', available: true, uiSurface: 'Billing tab • Fee Schedule' },
  { tab: 'Account', section: 'Billing > General', field: 'Payout Schedule', available: true, uiSurface: 'Billing tab • Fee Schedule' },
  { tab: 'Account', section: 'Billing > General', field: 'Billing Status', available: true, uiSurface: 'Billing tab • Billable Accounts' },
  { tab: 'Account', section: 'Billing > General', field: 'Custodial Account Number', available: false, suggestedSource: 'External integration', note: 'Custodian-side account ID; comes from custodian feed.' },
  { tab: 'Account', section: 'Billing > General', field: 'Include In Aggregate', available: false, suggestedSource: 'Manual entry' },
  { tab: 'Account', section: 'Billing > General', field: 'Linked Billing Account', available: false, suggestedSource: 'Manual entry' },

  // ─── Account > Billing > Frequency ──────────────────────────────────
  { tab: 'Account', section: 'Billing > Frequency', field: 'Style', available: true, uiSurface: 'Billing tab • Fee Schedule' },
  { tab: 'Account', section: 'Billing > Frequency', field: 'Frequency', available: true, uiSurface: 'Billing tab • Fee Schedule' },
  { tab: 'Account', section: 'Billing > Frequency', field: 'Cycle Month', available: true, uiSurface: 'Billing tab • Fee Schedule' },
  { tab: 'Account', section: 'Billing > Frequency', field: 'Valuation Method', available: true, uiSurface: 'Billing tab • Fee Schedule' },
  { tab: 'Account', section: 'Billing > Frequency', field: 'Start Date', available: true, uiSurface: 'Billing tab • Fee Schedule' },

  // ─── Account > Billing > Bank ───────────────────────────────────────
  { tab: 'Account', section: 'Billing > Bank', field: 'Bank Name', available: false, suggestedSource: 'Manual entry', note: 'Only for ACH bank-debit payment method; skip for direct-debit accounts.' },
  { tab: 'Account', section: 'Billing > Bank', field: 'ABA Number', available: false, suggestedSource: 'Manual entry' },
  { tab: 'Account', section: 'Billing > Bank', field: 'Bank Account Number', available: false, suggestedSource: 'Manual entry' },
  { tab: 'Account', section: 'Billing > Bank', field: 'Name On Account', available: false, suggestedSource: 'Manual entry' },

  // ─── Account > Billing > Performance Fees ───────────────────────────
  { tab: 'Account', section: 'Billing > Performance Fees', field: 'Performance Billed', available: false, suggestedSource: 'Manual entry', note: 'Only relevant for performance-fee account types.' },
  { tab: 'Account', section: 'Billing > Performance Fees', field: 'Fee Schedule', available: false, suggestedSource: 'Manual entry' },

  // ─── Portfolio Group ────────────────────────────────────────────────
  { tab: 'Portfolio Group', section: 'Account Assignments', field: '(tree of assigned accounts)', available: true },
  { tab: 'Portfolio Group', section: 'Maintain Groups For', field: 'Reporting', available: true },
  { tab: 'Portfolio Group', section: 'Maintain Groups For', field: 'Composite', available: true },
  { tab: 'Portfolio Group', section: 'Maintain Groups For', field: 'Trading', available: true },

  // ─── Asset (Position) ───────────────────────────────────────────────
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Asset ID', available: true, uiSurface: 'Investments tab (future)' },
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Name', available: true, uiSurface: 'Investments tab (future)' },
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Account Number', available: true, uiSurface: 'Investments tab (future)' },
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Ticker', available: true, uiSurface: 'Investments tab (future)' },
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Shares', available: true, uiSurface: 'Investments tab (future)' },
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Value', available: true, uiSurface: 'Investments tab (future)' },
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Price', available: true, uiSurface: 'Investments tab (future)' },
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Managed', available: true, uiSurface: 'Investments tab (future)' },
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Asset Class', available: true, uiSurface: 'Investments tab (future)' },
  { tab: 'Asset (Position)', section: 'List Grid', field: 'Custodial Cash', available: true, uiSurface: 'Financial Accounts table' },

  // ─── Reference Data ────────────────────────────────────────────────
  { tab: 'Reference Data', section: 'Lists', field: 'Custodians', available: true },
  { tab: 'Reference Data', section: 'Lists', field: 'Mgmt Styles', available: true },
  { tab: 'Reference Data', section: 'Lists', field: 'Account Types', available: true },
  { tab: 'Reference Data', section: 'Lists', field: 'Fee Schedules', available: true },
  { tab: 'Reference Data', section: 'Lists', field: 'Payout Schedules', available: true },
  { tab: 'Reference Data', section: 'Lists', field: 'Sub-advisors', available: true },
  { tab: 'Reference Data', section: 'Lists', field: 'Reps', available: true },
  { tab: 'Reference Data', section: 'Lists', field: 'Download Sources', available: true },
]

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Look up whether a specific Orion field is available in Stratos's instance.
 * Falls back to `true` if we don't have the field mapped (assume Avantos has it).
 */
export function isOrionAvailable(tab: OrionTab, field: string): boolean {
  const row = ORION_FIELDS.find(
    (r) => r.tab === tab && r.field.toLowerCase() === field.toLowerCase(),
  )
  return row?.available ?? true
}

/** Get the full field record. */
export function getOrionField(tab: OrionTab, field: string): OrionField | undefined {
  return ORION_FIELDS.find(
    (r) => r.tab === tab && r.field.toLowerCase() === field.toLowerCase(),
  )
}

/** All unavailable fields grouped by tab — drives the gap report page. */
export function getOrionGaps(): Record<OrionTab, OrionField[]> {
  const out: Partial<Record<OrionTab, OrionField[]>> = {}
  for (const f of ORION_FIELDS) {
    if (f.available) continue
    if (!out[f.tab]) out[f.tab] = []
    out[f.tab]!.push(f)
  }
  return out as Record<OrionTab, OrionField[]>
}

/** Summary counts for the report header. */
export function getOrionSummary() {
  const total = ORION_FIELDS.length
  const available = ORION_FIELDS.filter((f) => f.available).length
  const missing = total - available
  const byTab: Record<string, { total: number; available: number; missing: number }> = {}
  for (const f of ORION_FIELDS) {
    const t = f.tab
    if (!byTab[t]) byTab[t] = { total: 0, available: 0, missing: 0 }
    byTab[t].total++
    if (f.available) byTab[t].available++
    else byTab[t].missing++
  }
  return { total, available, missing, byTab }
}
