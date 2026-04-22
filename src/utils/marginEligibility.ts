import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'

/**
 * Pershing Open/Update Accounts: margin is not valid when preliminary.accountType is T (retirement) or C (COD/bank deposit),
 * for bank custody, or for excluded registration categories. Internal registration ids map to the same business rules as
 * Pershing registration codes (e.g. 529*, RET*, IAC* family).
 */
const MARGIN_INELIGIBLE_REGISTRATION_TYPES = new Set<RegistrationType>([
  'IRA',
  'ROTH_IRA',
  'SEP_IRA',
  'SIMPLE_5304_IRA',
  'INHERITED_IRA',
  'INHERITED_ROTH_IRA',
  'GUARDIAN_IRA',
  'UTMA_UGMA',
  'GUARDIAN',
  '529_ON_PLATFORM',
  '529_OFF_PLATFORM',
  'CORP_PENSION_PROFIT_SHARING_401K',
  'NON_QUALIFIED_DEFERRED_COMP',
  'INDIVIDUAL_401K_ASCENSUS',
  'THIRD_PARTY_CUSTODIAN_ERISA_QRP',
  'CORESTONE_CHECKING',
  'VUL_OFF_PLATFORM',
])

/** Pershing preliminary.accountType T — tax-advantaged / retirement product group. */
function isRetirementLikeProduct(product: AccountType): boolean {
  return product === 'ira' || product === 'roth_ira' || product === '401k'
}

/** Pershing preliminary.accountType C — cash on deposit / bank-style product group. */
function isCashOnDepositLikeProduct(product: AccountType): boolean {
  return product === 'checking' || product === 'savings'
}

export interface MarginEligibilityContext {
  registrationType: RegistrationType | null | undefined
  /** Resolved product for the account (registration default or explicit override on the account child). */
  productAccountType: AccountType | null | undefined
  /** When true, margin is not offered (Pershing bank custody). Stored on account-opening child task data. */
  isBankCustody?: boolean
}

export function getMarginEligibility(ctx: MarginEligibilityContext): {
  eligible: boolean
  disabledReason: string | null
} {
  if (ctx.isBankCustody === true) {
    return {
      eligible: false,
      disabledReason:
        'Margin is not allowed for bank custody accounts under the Pershing API.',
    }
  }

  const product = ctx.productAccountType ?? 'brokerage'
  if (isRetirementLikeProduct(product) || isCashOnDepositLikeProduct(product)) {
    return {
      eligible: false,
      disabledReason:
        'Margin is not applicable when the account product is retirement (T) or bank deposit / COD-style (C).',
    }
  }

  const reg = ctx.registrationType
  if (reg && MARGIN_INELIGIBLE_REGISTRATION_TYPES.has(reg)) {
    return {
      eligible: false,
      disabledReason:
        'Margin is not allowed for this registration type under the Pershing API.',
    }
  }

  return { eligible: true, disabledReason: null }
}
