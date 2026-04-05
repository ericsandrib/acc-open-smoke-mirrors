import type { ChildType } from '@/types/workflow'

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
      { suffix: 'info', title: 'Client Info', formKey: 'kyc-child-info' },
      { suffix: 'documents', title: 'Documents', formKey: 'kyc-child-documents' },
      { suffix: 'results', title: 'KYC Results', formKey: 'kyc-child-results' },
    ],
  },
  'account-opening': {
    childType: 'account-opening',
    idPrefix: 'acct-child',
    displayLabel: 'Open Financial Account',
    subTasks: [
      { suffix: 'account-owners', title: 'Account & owners', formKey: 'acct-child-account-owners' },
      { suffix: 'funding-transfers', title: 'Funding & transfers', formKey: 'acct-child-funding-transfers' },
      { suffix: 'features-services', title: 'Features & services', formKey: 'acct-child-features-services' },
      { suffix: 'documents-review', title: 'Documents, signatures & submit', formKey: 'acct-child-documents-review' },
    ],
  },
}

export function getChildTypeConfig(childType: ChildType): ChildTypeConfig {
  return CHILD_TYPE_CONFIGS[childType]
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
