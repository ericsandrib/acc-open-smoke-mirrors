import type { AccountWorkflowPhase, ChildType, TaskStatus, WorkflowState } from '@/types/workflow'
import { OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY } from '@/utils/openAccountsTaskContext'
import { getPersistedHideKycChildWorkflows } from '@/utils/hideKycChildWorkflows'

export interface SubTaskDefinition {
  suffix: string
  title: string
  formKey: string
}

export interface ChildTypeConfig {
  childType: ChildType
  idPrefix: string
  displayLabel: string
  subTasks: readonly SubTaskDefinition[]
}

const CHILD_TYPE_CONFIGS: Record<ChildType, ChildTypeConfig> = {
  'kyc': {
    childType: 'kyc',
    idPrefix: 'kyc-child',
    displayLabel: 'KYC Review',
    subTasks: [
      { suffix: 'info', title: 'Client Verification Information', formKey: 'kyc-child-info' },
      { suffix: 'documents', title: 'Supporting Documents', formKey: 'kyc-child-documents' },
    ],
  },
  'account-opening': {
    childType: 'account-opening',
    idPrefix: 'acct-child',
    displayLabel: 'Open Financial Account',
    subTasks: [
      { suffix: 'account-owners', title: 'Account & Owners', formKey: 'acct-child-account-owners' },
      { suffix: 'funding-transfers', title: 'Funding & Asset Movement', formKey: 'acct-child-funding-transfers' },
      { suffix: 'features-services', title: 'Account Features & Services', formKey: 'acct-child-features-services' },
      { suffix: 'cip-review', title: 'CIP Verification & Review', formKey: 'acct-child-cip-review' },
      { suffix: 'aml-review', title: 'AML Screening & Review', formKey: 'acct-child-aml-review' },
      { suffix: 'forms-package', title: 'Forms Package', formKey: 'acct-child-forms-package' },
      { suffix: 'supporting-documents', title: 'Supporting Documents', formKey: 'acct-child-supporting-documents' },
    ],
  },
  'funding-line': {
    childType: 'funding-line',
    idPrefix: 'funding-line-child',
    displayLabel: 'Funding & Asset Movement',
    subTasks: [
      {
        suffix: 'setup',
        title: 'Funding & Asset Movement Details',
        formKey: 'funding-line-child-setup',
      },
    ],
  },
  'feature-service-line': {
    childType: 'feature-service-line',
    idPrefix: 'feature-service-line-child',
    displayLabel: 'Account Feature & Service',
    subTasks: [
      {
        suffix: 'setup',
        title: 'Feature & Service Details',
        formKey: 'feature-service-line-child-setup',
      },
    ],
  },
}

/** AML compliance console: review-oriented navigation (not advisor onboarding steps). */
const KYC_AML_REVIEW_SUBTASKS: readonly SubTaskDefinition[] = [
  { suffix: 'info', title: 'Client Profile', formKey: 'kyc-child-aml-subject-profile' },
  { suffix: 'documents', title: 'Supporting Documents', formKey: 'kyc-child-aml-documents' },
  { suffix: 'aml-review', title: 'AML Review', formKey: 'kyc-child-aml-review' },
]

const AML_EXTRA_SUBTASK_SUFFIXES: readonly SubTaskDefinition[] = [
  { suffix: 'aml-review', title: 'AML Review', formKey: 'kyc-child-aml-review' },
  /** @deprecated Legacy suffix — maps to AML Review */
  { suffix: 'aml-results', title: 'AML Review', formKey: 'kyc-child-aml-review' },
]

/** @deprecated Combined Documents step — parse only for persisted child sub-task ids. */
const LEGACY_ACCOUNT_OPENING_DOCUMENTS_SUBTASK: SubTaskDefinition = {
  suffix: 'documents-review',
  title: 'Documents',
  formKey: 'acct-child-documents-review',
}

export function getChildTypeConfig(childType: ChildType): ChildTypeConfig {
  return CHILD_TYPE_CONFIGS[childType]
}

/** HO document-review reviewer demo modes (includes principal/doc lanes mapped for KYC children). */
export function isHoKycReviewerDemoView(
  demoViewMode: WorkflowState['demoViewMode'] | undefined,
): boolean {
  return demoViewMode === 'ho-kyc' || demoViewMode === 'ho-documents' || demoViewMode === 'ho-principal'
}

/** Parent Open Accounts task — CIP supporting uploads live on KYC child workflows. */
export function isParentOpenAccountsSupportingDocumentsEnabled(): boolean {
  return false
}

export interface VisibleSubTaskOptions {
  /** Single-flow account workflow phase for the child — controls AML/CIP review task visibility. */
  accountWorkflowPhase?: AccountWorkflowPhase
  /** Parent open-accounts task — annuity-order path only exposes Account & Owners. */
  parentOpenAccountsFormKey?: string
}

/**
 * Single-flow account-opening: AML Review / CIP Review are role-scoped review tasks.
 * Visible only when "Hide KYC child workflows" is enabled AND the viewer is in the matching review role.
 * Workflow-state transitions are surfaced through the bottom-left Application Status card, not by
 * exposing these tasks to advisors.
 */
function isAccountOpeningReviewTaskVisible(
  sub: SubTaskDefinition,
  demoViewMode: WorkflowState['demoViewMode'],
  _phase: AccountWorkflowPhase | undefined,
): boolean {
  if (!getPersistedHideKycChildWorkflows()) return false
  if (sub.suffix === 'aml-review') {
    return demoViewMode === 'aml'
  }
  if (sub.suffix === 'cip-review') {
    return demoViewMode === 'ho-documents' || demoViewMode === 'ho-kyc'
  }
  return true
}

export function getVisibleChildSubTasks(
  childType: ChildType,
  demoViewMode: WorkflowState['demoViewMode'],
  _childStatus?: TaskStatus,
  options?: VisibleSubTaskOptions,
): readonly SubTaskDefinition[] {
  if (childType === 'kyc' && demoViewMode === 'aml') {
    return KYC_AML_REVIEW_SUBTASKS
  }
  const all = CHILD_TYPE_CONFIGS[childType].subTasks
  if (childType === 'kyc' && demoViewMode === 'ho-principal') {
    return all.filter((s) => s.suffix !== 'documents')
  }
  if (childType === 'account-opening') {
    if (options?.parentOpenAccountsFormKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY) {
      return all.filter((s) => s.suffix === 'account-owners')
    }
    if (demoViewMode === 'aml') {
      return all.filter((s) => s.suffix === 'aml-review' || s.suffix === 'supporting-documents')
    }
    return all.filter((s) => {
      if (s.suffix === 'supporting-documents' && demoViewMode === 'ho-principal') {
        return false
      }
      if (s.suffix !== 'aml-review' && s.suffix !== 'cip-review') return true
      return isAccountOpeningReviewTaskVisible(s, demoViewMode, options?.accountWorkflowPhase)
    })
  }
  return all
}

/** Stable sidebar / header label for a sub-task across advisor and reviewer views. */
export function getSubTaskDisplayTitle(
  childType: ChildType,
  subTask: SubTaskDefinition,
  demoViewMode: WorkflowState['demoViewMode'],
): string {
  if (childType === 'kyc' && demoViewMode === 'aml') {
    const aml = KYC_AML_REVIEW_SUBTASKS.find((s) => s.suffix === subTask.suffix)
    if (aml) return aml.title
  }
  return subTask.title
}

/** Sub-step index for a child type + form key (e.g. switching siblings on the same step). */
export function getSubTaskIndexByFormKey(
  childType: ChildType,
  formKey: string,
  demoViewMode?: WorkflowState['demoViewMode'],
): number {
  if (childType === 'kyc' && formKey === 'kyc-child-cip-results') {
    return CHILD_TYPE_CONFIGS.kyc.subTasks.findIndex((s) => s.formKey === 'kyc-child-info')
  }
  const visible =
    demoViewMode != null
      ? getVisibleChildSubTasks(childType, demoViewMode)
      : getVisibleChildSubTasks(childType, 'advisor')
  const idx = visible.findIndex((s) => s.formKey === formKey)
  if (idx >= 0) return idx
  if (childType === 'kyc' && formKey === 'kyc-child-aml-review') {
    return KYC_AML_REVIEW_SUBTASKS.findIndex((s) => s.suffix === 'aml-review')
  }
  return 0
}

export function getChildSubTaskIds(childId: string, childType: ChildType): string[] {
  const config = CHILD_TYPE_CONFIGS[childType]
  return config.subTasks.map((s) => `${childId}-${s.suffix}`)
}

export function parseChildSubTaskId(
  id: string,
): { childId: string; suffix: string; childType: ChildType; config: ChildTypeConfig } | null {
  const flattened: { config: ChildTypeConfig; sub: SubTaskDefinition }[] = []
  for (const config of Object.values(CHILD_TYPE_CONFIGS)) {
    for (const sub of config.subTasks) {
      flattened.push({ config, sub })
    }
    if (config.childType === 'kyc') {
      for (const sub of AML_EXTRA_SUBTASK_SUFFIXES) {
        flattened.push({ config, sub })
      }
    }
    if (config.childType === 'account-opening') {
      flattened.push({ config, sub: LEGACY_ACCOUNT_OPENING_DOCUMENTS_SUBTASK })
    }
  }
  flattened.sort((a, b) => b.sub.suffix.length - a.sub.suffix.length)

  for (const { config, sub } of flattened) {
    const ending = `-${sub.suffix}`
    if (id.endsWith(ending)) {
      const childId = id.slice(0, -ending.length)
      if (childId.startsWith(`${config.idPrefix}-`)) {
        return { childId, suffix: sub.suffix, childType: config.childType, config }
      }
    }
  }
  // Legacy: "CIP Results" was a separate KYC sub-step; verification now lives on Client Verification Information.
  if (id.endsWith('-cip-results')) {
    const childId = id.slice(0, -'-cip-results'.length)
    if (childId.startsWith(`${CHILD_TYPE_CONFIGS.kyc.idPrefix}-`)) {
      const config = CHILD_TYPE_CONFIGS.kyc
      const sub = config.subTasks.find((s) => s.suffix === 'info')
      if (sub) return { childId, suffix: sub.suffix, childType: 'kyc', config }
    }
  }
  return null
}

export function getSubTaskByFormKey(formKey: string): SubTaskDefinition | null {
  for (const config of Object.values(CHILD_TYPE_CONFIGS)) {
    const found = config.subTasks.find((s) => s.formKey === formKey)
    if (found) return found
  }
  for (const sub of KYC_AML_REVIEW_SUBTASKS) {
    if (sub.formKey === formKey) return sub
  }
  if (formKey === 'kyc-child-cip-results') {
    return CHILD_TYPE_CONFIGS.kyc.subTasks.find((s) => s.formKey === 'kyc-child-info') ?? null
  }
  return null
}

/** Label when exiting a funding-line or feature-service-line drill-in back to the account-opening hub step. */
export function resumeDrillInBackLabel(subTaskIndex: number): string {
  const fundingIdx = getSubTaskIndexByFormKey('account-opening', 'acct-child-funding-transfers')
  const featuresIdx = getSubTaskIndexByFormKey('account-opening', 'acct-child-features-services')
  if (subTaskIndex === fundingIdx) return 'Back to funding & asset movement'
  if (subTaskIndex === featuresIdx) return 'Back to account features & services'
  return 'Back to account'
}
