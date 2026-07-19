import { useTaskData } from '@/stores/workflowStore'

const SEI_FORM_STATE_KEY = 'seiFields'

/** Bag of SEI form values for one child account, keyed by `SeiField.key`. */
export type SeiFormBag = Record<string, unknown>

export interface SeiFormStateApi {
  data: SeiFormBag
  get(key: string): string
  getMulti(key: string): string[]
  getBool(key: string): boolean
  set(key: string, value: unknown): void
}

/**
 * SEI dynamic-form state lives under `taskData[childId].seiFields`. Unlike the
 * Schwab hook this does not seed person fields on mount (phase 1 — prefill from
 * the shared owner picker is deferred); values are written field-by-field via
 * `set` through the existing SET_TASK_DATA shallow-merge path.
 */
export function useSeiFormState(childId: string): SeiFormStateApi {
  const { data: rawData, updateFields } = useTaskData(childId)
  const formBag = (rawData[SEI_FORM_STATE_KEY] as SeiFormBag | undefined) ?? {}

  return {
    data: formBag,
    get(key) {
      const v = formBag[key]
      return typeof v === 'string' ? v : v == null ? '' : String(v)
    },
    getMulti(key) {
      const v = formBag[key]
      return Array.isArray(v) ? (v as string[]) : []
    },
    getBool(key) {
      return formBag[key] === true
    },
    set(key, value) {
      updateFields({ [SEI_FORM_STATE_KEY]: { ...formBag, [key]: value } })
    },
  }
}
