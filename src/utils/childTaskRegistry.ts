import type { ChildType, WorkflowState } from '@/types/workflow'

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
      { suffix: 'info', title: 'Client Information', formKey: 'kyc-child-info' },
      { suffix: 'documents', title: 'Documents', formKey: 'kyc-child-documents' },
    ],
  },
  'account-opening': {
    childType: 'account-opening',
    idPrefix: 'acct-child',
    displayLabel: 'Open Financial Account',
    subTasks: [
      { suffix: 'account-owners', title: 'Account & owners', formKey: 'acct-child-account-owners' },
      { suffix: 'funding-transfers', title: 'Funding & asset movement', formKey: 'acct-child-funding-transfers' },
      { suffix: 'features-services', title: 'Account features & services', formKey: 'acct-child-features-services' },
      { suffix: 'documents-review', title: 'Documents', formKey: 'acct-child-documents-review' },
    ],
  },
  'funding-line': {
    childType: 'funding-line',
    idPrefix: 'funding-line-child',
    displayLabel: 'Funding & asset movement',
    subTasks: [
      {
        suffix: 'setup',
        title: 'Funding & asset movement details',
        formKey: 'funding-line-child-setup',
      },
    ],
  },
  'feature-service-line': {
    childType: 'feature-service-line',
    idPrefix: 'feature-service-line-child',
    displayLabel: 'Account feature & service',
    subTasks: [
      {
        suffix: 'setup',
        title: 'Feature & service details',
        formKey: 'feature-service-line-child-setup',
      },
    ],
  },
}

export function getChildTypeConfig(childType: ChildType): ChildTypeConfig {
  return CHILD_TYPE_CONFIGS[childType]
}

/** Sidebar / header label for a sub-task; AML view renames the KYC info step for reviewers. */
export function getSubTaskDisplayTitle(
  childType: ChildType,
  subTask: SubTaskDefinition,
  demoViewMode: WorkflowState['demoViewMode'],
): string {
  if (childType === 'kyc' && subTask.formKey === 'kyc-child-info' && demoViewMode === 'aml') {
    return 'AML Team Review'
  }
  return subTask.title
}

/** Sub-step index for a child type + form key (e.g. switching siblings on the same step). */
export function getSubTaskIndexByFormKey(childType: ChildType, formKey: string): number {
  const idx = CHILD_TYPE_CONFIGS[childType].subTasks.findIndex((s) => s.formKey === formKey)
  return idx >= 0 ? idx : 0
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
  return null
}

export function getSubTaskByFormKey(formKey: string): SubTaskDefinition | null {
  for (const config of Object.values(CHILD_TYPE_CONFIGS)) {
    const found = config.subTasks.find((s) => s.formKey === formKey)
    if (found) return found
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
