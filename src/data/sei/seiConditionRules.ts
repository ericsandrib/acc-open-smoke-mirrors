/**
 * SEI "Visible When" rule interpreter.
 *
 * The registry stores each conditional field's visibility rule as prose (103
 * distinct strings). Rather than hand-encode 1,085 cells, this module interprets
 * the rule text into a predicate over a small set of DRIVER fields (read from
 * the live form-state bag) plus firm/system flags. Unrecognized rules default to
 * VISIBLE — the Hidden status already removes form-irrelevant fields; the
 * conditional layer only *additionally* hides when a recognized rule says so.
 *
 * Driver values are read from the same bag the form writes to, keyed by the
 * driver field's `SeiField.key`, located once by display label.
 */
import { SEI_FIELDS, type SeiField, type SeiFormLetter } from './seiRegistry'

export type SeiState = Record<string, unknown>

export interface SeiEvalContext {
  state: SeiState
  letter: SeiFormLetter
}

export interface SeiVisibility {
  visible: boolean
  /** True when the field should render read-only (Display Only / Read Only). */
  readOnly: boolean
}

/* ───────────────────────────── driver lookup ───────────────────────────── */

function keyForLabel(label: string): string | undefined {
  return SEI_FIELDS.find((x) => x.field === label)?.key
}

/** Real registry fields whose values gate other fields. */
const DRIVERS = {
  typeOfOwner: keyForLabel('Type of Owner'),
  taxpayerIdType: keyForLabel('Taxpayer ID Type'),
  typeOfTrust: keyForLabel('Type of Trust'),
  maritalStatus: keyForLabel('Marital Status') ?? keyForLabel('Account Owner Marital Status'),
  feePaymentMethod: keyForLabel('Fee Payment Method'),
  fundingMethod: keyForLabel('Funding Method'),
  distributionMethod: keyForLabel('Distribution Method'),
  investmentProgram: keyForLabel('Investment Program'),
  forFurtherCredit: keyForLabel('For Further Credit'),
  sendStatementThirdParty: keyForLabel('Send Statement to Third Party'),
  consolidate: keyForLabel('Consolidate With Existing Account Chain'),
  exemptFatca: keyForLabel('Exempt from FATCA Withholding'),
  useLegalAddress: keyForLabel('Use Legal Address'),
  includeSpecialFunding: keyForLabel('Include Special Funding Instructions'),
  includeDca: keyForLabel('Include Dollar Cost Average (DCA)'),
  dcaStartsOn: keyForLabel('DCA Starts On'),
  scheduleBy: keyForLabel('Schedule By'),
  accountType: keyForLabel('Account Type'),
  frequency: keyForLabel('Account Statement Frequency'),
} as const

/**
 * Engine-managed toggles for the §11 Related-Party Selection — these party
 * detail blocks ("Shown only if user adds this party type via §11a") have no
 * single driver field, so the engine renders an add/remove switch per block.
 */
export const SEI_PARTY_TOGGLES = {
  addTrustee: '__sei_addTrustee',
  addCustodian: '__sei_addCustodian',
  addEmployer: '__sei_addEmployer',
} as const

function str(state: SeiState, key: string | undefined): string {
  if (!key) return ''
  const v = state[key]
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

/** A toggle/checkbox driver is "on" when true / 'Yes' / 'true'. */
function on(state: SeiState, key: string | undefined): boolean {
  if (!key) return false
  const v = state[key]
  return v === true || v === 'Yes' || v === 'yes' || v === 'true'
}

const JOINT_FORMS: ReadonlySet<SeiFormLetter> = new Set<SeiFormLetter>(['F', 'G'])

/* ─────────────────────── firm / system flag defaults ───────────────────── */
const FLAGS = {
  custodianAllowESign: false, // "visible when custodianAllowESign = false" → visible
  tiersSelected: false, // fee tiers appear only after a tiered schedule is chosen
  showInvestCash: true,
  displayResiduals: false,
  showPortfolioName: true,
  showEndDate: false,
  isCreateMode: true, // new transfer / new fee group → create/search controls shown
} as const

/* ──────────────────────────── rule interpreter ──────────────────────────── */

function ruleToPredicate(rule: string, field: SeiField): (ctx: SeiEvalContext) => boolean {
  const r = rule.toLowerCase()
  const section = field.section.toLowerCase()

  // 1. Always-on conditionals.
  if (
    r.startsWith('visible and required') ||
    r.includes('always shown') ||
    r.includes('always visible') ||
    r.includes('shown for all individuals') ||
    r.includes('defaulted to')
  ) {
    return () => true
  }

  // 2. §11a-added related-party blocks (Trustee / Custodian / Employer).
  if (r.includes('user adds this party type') || r.includes('related party selection')) {
    if (section.includes('trustee')) return ({ state }) => on(state, SEI_PARTY_TOGGLES.addTrustee)
    if (section.includes('custodian')) return ({ state }) => on(state, SEI_PARTY_TOGGLES.addCustodian)
    if (section.includes('employer')) return ({ state }) => on(state, SEI_PARTY_TOGGLES.addEmployer)
    return () => false
  }

  // 3. Type of Owner (forms C / G).
  if (r.includes('type of owner = trust') || r.includes('accountownertypeid = trust')) {
    return ({ state }) => /trust/i.test(str(state, DRIVERS.typeOfOwner))
  }
  if (r.includes('accountownertypeid = individual adult')) {
    return ({ state }) => /individual adult|individual \(adult\)/i.test(str(state, DRIVERS.typeOfOwner))
  }
  if (r.includes('accountownertypeid = minor') || (section.includes('custodian') && r.includes('minor'))) {
    return ({ state }) => /minor/i.test(str(state, DRIVERS.typeOfOwner))
  }

  // 4. Joint owners.
  if (r.includes('displayjoint') || r.includes('joint account type selected') || r.includes('joint/secondary owners')) {
    return ({ letter }) => JOINT_FORMS.has(letter)
  }

  // 5. Fee Payment Method.
  if (r.includes('fee payment method = per fee schedule')) {
    return ({ state }) => /per fee schedule/i.test(str(state, DRIVERS.feePaymentMethod))
  }
  if (r.includes('fee payment method = per flat rate')) {
    return ({ state }) => /per flat rate/i.test(str(state, DRIVERS.feePaymentMethod))
  }
  if (r.includes('fee payment method = add to existing')) {
    return ({ state }) => /add to existing/i.test(str(state, DRIVERS.feePaymentMethod))
  }
  if (r.includes('tiers exist') || r.includes('showtiers') || r.includes('with tiers')) {
    return () => FLAGS.tiersSelected
  }

  // 6. For Further Credit (wire details).
  if (r.includes('for further credit = yes') || r.includes('forfurthercreditenable=true') || r.includes('showforfurthercredit=true')) {
    return ({ state }) => on(state, DRIVERS.forFurtherCredit)
  }
  if (r.includes('for further credit = no') || r.includes('forfurthercreditenable=false')) {
    return ({ state }) => !on(state, DRIVERS.forFurtherCredit)
  }

  // 7. Statements → third party.
  if (r.includes('third party') || r.includes('thirdparty')) {
    return ({ state }) => on(state, DRIVERS.sendStatementThirdParty)
  }

  // 8. Consolidation chain.
  if (r.includes('consolidate = yes') || r.includes('addtoaccountchain=true')) {
    return ({ state }) => on(state, DRIVERS.consolidate)
  }
  if (r.includes('account chain has been selected')) {
    // read-only echo after a chain is chosen — not part of the create flow
    return () => false
  }

  // 9. FATCA exemption — the dependent fields stay visible (disabled when exempt = No).
  if (r.includes('exempt from fatca')) return () => true

  // 10. Investment program.
  if (r.includes('dfs') || r.includes('chnw')) {
    return ({ state }) => {
      const p = str(state, DRIVERS.investmentProgram).toUpperCase()
      return !(p.includes('DFS') || p.includes('CHNW'))
    }
  }
  if (r.includes('only for managed accounts') || r.includes('managed accounts')) {
    return ({ state }) => /managed/i.test(str(state, DRIVERS.investmentProgram))
  }
  if (r.includes('mutual fund accounts')) {
    return ({ state }) => /mutual fund/i.test(str(state, DRIVERS.investmentProgram))
  }

  // 11. DCA + recurring frequency.
  if (r.includes('dca feature is enabled') || r.includes('dollar cost averaging')) {
    return ({ state }) => on(state, DRIVERS.includeDca)
  }
  if (r.includes('dca starts on = specific date')) {
    return ({ state }) => /specific date/i.test(str(state, DRIVERS.dcaStartsOn))
  }
  if (r.includes('schedule by = total sum')) {
    return ({ state }) => /total sum/i.test(str(state, DRIVERS.scheduleBy))
  }
  if (r.includes('schedule by = fixed contribution')) {
    return ({ state }) => /fixed contribution/i.test(str(state, DRIVERS.scheduleBy))
  }
  if (r.includes('frequency is weekly, monthly, or quarterly') || r.includes('(recurring)')) {
    return ({ state }) => /weekly|monthly|quarterly/i.test(str(state, DRIVERS.frequency)) || on(state, DRIVERS.includeDca)
  }
  if (r.includes('special funding instructions = yes') || r.includes('include special funding')) {
    return ({ state }) => on(state, DRIVERS.includeSpecialFunding)
  }

  // 12. "Other" account type free text.
  if (r.includes('"other" is selected') || r.includes('other is selected from account type')) {
    return ({ state }) => /other/i.test(str(state, DRIVERS.accountType))
  }

  // 13. Mailing fields shown when "Use Legal Address" unchecked.
  if (r.includes('use legal address is unchecked')) {
    return ({ state }) => !on(state, DRIVERS.useLegalAddress)
  }

  // 14. Trust taxpayer-id-type → grantor fields (form H).
  if (r.includes('trusttaxpayeridtype = individual') || (section.includes('grantor') && r.includes('ssn'))) {
    return ({ state }) => /ssn|individual/i.test(str(state, DRIVERS.taxpayerIdType))
  }

  // 15. Entity-detail Type = Organization / Individual — default visible.
  if (r.includes('type = organization') || r.includes('type = individual')) return () => true

  // 16. IRA contribution / non-IRA after-tax — status already gates the form.
  if (r.includes('traditional ira, roth ira') || r.includes('contributiontype') || r.includes('not ira type') || r.includes('not taxqualified')) {
    return () => true
  }

  // 17. Create/search-mode controls → visible (create mode).
  if (r.includes('create mode') || r.includes('create/search mode') || r.includes('choose/search mode') || r.includes('no accounts added')) {
    return () => FLAGS.isCreateMode
  }
  if (r.includes('after existing fee group entity is selected')) return () => false

  // 18. Firm/system flags.
  if (r.includes('custodianallowesign = false')) return () => !FLAGS.custodianAllowESign
  if (r.includes('showportfolioname')) return () => FLAGS.showPortfolioName
  if (r.includes('showinvestcash')) return () => FLAGS.showInvestCash
  if (r.includes('displayresiduals')) return () => FLAGS.displayResiduals
  if (r.includes('showenddate')) return () => FLAGS.showEndDate

  // Default: visible (do not over-hide).
  return () => true
}

const predicateCache = new Map<string, (ctx: SeiEvalContext) => boolean>()

function getPredicate(field: SeiField, letter: SeiFormLetter): (ctx: SeiEvalContext) => boolean {
  const rule = field.visibleWhenByForm[letter] ?? ''
  const sectionKind = /trustee/i.test(field.section)
    ? 't'
    : /custodian/i.test(field.section)
      ? 'c'
      : /employer/i.test(field.section)
        ? 'e'
        : '_'
  const cacheKey = `${sectionKind}::${rule}`
  let pred = predicateCache.get(cacheKey)
  if (!pred) {
    pred = ruleToPredicate(rule, field)
    predicateCache.set(cacheKey, pred)
  }
  return pred
}

/** Evaluate a field's visibility + read-only state for a form + current values. */
export function evaluateField(field: SeiField, ctx: SeiEvalContext): SeiVisibility {
  const status = field.statusByForm[ctx.letter]
  const readOnly =
    status === 'Display Only' ||
    status === 'Conditional - Display Only' ||
    status === 'Conditional - Read Only'

  if (status === 'Hidden') return { visible: false, readOnly }
  if (status === 'Required' || status === 'Optional' || status === 'Display Only') {
    return { visible: true, readOnly }
  }
  const pred = getPredicate(field, ctx.letter)
  return { visible: pred(ctx), readOnly }
}
