export const KYC_CHILD_SUB_TASKS = [
  { suffix: 'info', title: 'Client Info', formKey: 'kyc-child-info' },
  { suffix: 'documents', title: 'Documents', formKey: 'kyc-child-documents' },
  { suffix: 'results', title: 'KYC Results', formKey: 'kyc-child-results' },
] as const

const SUFFIXES = KYC_CHILD_SUB_TASKS.map((s) => s.suffix)

export function parseChildSubTaskId(id: string): { childId: string; suffix: string } | null {
  for (const suffix of SUFFIXES) {
    const ending = `-${suffix}`
    if (id.endsWith(ending)) {
      const childId = id.slice(0, -ending.length)
      if (childId.startsWith('kyc-child-')) {
        return { childId, suffix }
      }
    }
  }
  return null
}

export function getChildSubTaskIds(childId: string): string[] {
  return KYC_CHILD_SUB_TASKS.map((s) => `${childId}-${s.suffix}`)
}

export function getSubTaskByFormKey(formKey: string) {
  return KYC_CHILD_SUB_TASKS.find((s) => s.formKey === formKey) ?? null
}
