export type ReviewReasonOption = { value: string; label: string }

export function getReasonLabels(
  options: readonly ReviewReasonOption[],
  values: string[],
): string {
  return values
    .map((value) => options.find((reason) => reason.value === value)?.label ?? value)
    .filter(Boolean)
    .join('; ')
}

export function formatSelectedReasonCodes(values: string[]): string {
  return values.join(',')
}

export function selectedReasonsInclude(values: string[], code: string): boolean {
  return values.includes(code)
}
