import type { WorkflowState } from '@/types/workflow'
import {
  getAllOpenAccountsTasks,
  getOpenAccountsTaskData,
} from '@/utils/openAccountsTaskContext'
import { getOpenAccountsCoreSupportingDocumentSections } from '@/utils/registrationDocuments'
import {
  getChildSubTaskIds,
  getChildTypeConfig,
  getVisibleChildSubTasks,
} from '@/utils/childTaskRegistry'

/** One uploaded (or placeholder) supporting document row for reviewer rails. */
export type JourneySupportingDocRow = {
  /** Stable key for React lists */
  rowKey: string
  /** Key for session-only preview URLs (see supportingDocumentPreviewContext). */
  previewKey: string
  /** `state.taskData` key this row's payload lives under. */
  taskDataOwnerId: string
  /** Where this row was read from (e.g. task title, or child · sub-step). */
  scopeLabel: string
  requirementLabel: string
  fileName: string
  status?: string
  assignedToDisplay: string
}

/** Stable id for matching blob previews registered at upload time (not persisted). */
export function buildSupportingDocumentPreviewKey(
  taskDataOwnerId: string,
  docInstancesFieldKey: string,
  instanceId: string,
): string {
  return `${taskDataOwnerId}::${docInstancesFieldKey}::${instanceId}`
}

type DocInstanceLike = {
  id?: string
  fileName?: string
  status?: string
  assignedTo?: string
}

function buildRequirementLabelMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const doc of getOpenAccountsCoreSupportingDocumentSections()) {
    map.set(doc.id, doc.label)
  }
  return map
}

function partyLabel(state: WorkflowState, partyId: string): string {
  if (!partyId.trim()) return '—'
  const p = state.relatedParties.find((x) => x.id === partyId)
  if (!p) return partyId
  return p.name?.trim() || p.organizationName?.trim() || p.role || partyId
}

function rowsFromTaskData(
  state: WorkflowState,
  data: Record<string, unknown>,
  taskDataOwnerId: string,
  scopeLabel: string,
  labelMap: Map<string, string>,
): JourneySupportingDocRow[] {
  const rows: JourneySupportingDocRow[] = []
  for (const key of Object.keys(data)) {
    if (!key.startsWith('doc-instances-')) continue
    const docTypeId = key.slice('doc-instances-'.length)
    const requirementLabel = labelMap.get(docTypeId) ?? docTypeId
    const raw = data[key]
    if (!Array.isArray(raw)) continue
    for (let i = 0; i < raw.length; i++) {
      const inst = raw[i] as DocInstanceLike
      const id = typeof inst.id === 'string' ? inst.id : `${key}-${i}`
      const fileName = inst.fileName?.trim() || 'No file uploaded'
      const status = typeof inst.status === 'string' ? inst.status : undefined
      const assignedToDisplay = partyLabel(state, inst.assignedTo ?? '')
      const previewKey = buildSupportingDocumentPreviewKey(taskDataOwnerId, key, id)
      rows.push({
        rowKey: `${scopeLabel}::${key}::${id}`,
        previewKey,
        taskDataOwnerId,
        scopeLabel,
        requirementLabel,
        fileName,
        status,
        assignedToDisplay,
      })
    }
  }
  return rows
}

/**
 * Collect supporting-document upload rows from Open Accounts task payloads and,
 * when a child workflow is active, that child and its sub-step `taskData` keys.
 */
export function collectJourneySupportingDocumentRows(state: WorkflowState): JourneySupportingDocRow[] {
  const labelMap = buildRequirementLabelMap()
  const dedupe = new Set<string>()
  const out: JourneySupportingDocRow[] = []

  const pushUnique = (rows: JourneySupportingDocRow[]) => {
    for (const r of rows) {
      if (dedupe.has(r.rowKey)) continue
      dedupe.add(r.rowKey)
      out.push(r)
    }
  }

  for (const t of getAllOpenAccountsTasks(state)) {
    const scope = t.title?.trim() || 'Open Accounts'
    pushUnique(
      rowsFromTaskData(state, getOpenAccountsTaskData(state, t.id), t.id, scope, labelMap),
    )
  }

  if (state.activeChildActionId) {
    const child = state.tasks.flatMap((x) => x.children ?? []).find((c) => c.id === state.activeChildActionId)
    if (child) {
      const childRoot = (state.taskData[child.id] as Record<string, unknown> | undefined) ?? {}
      pushUnique(rowsFromTaskData(state, childRoot, child.id, child.name, labelMap))

      const config = getChildTypeConfig(child.childType)
      const visible = getVisibleChildSubTasks(child.childType, state.demoViewMode, child.status)
      for (const st of visible) {
        const subId = `${child.id}-${st.suffix}`
        const subData = (state.taskData[subId] as Record<string, unknown> | undefined) ?? {}
        const scope = `${child.name} · ${st.title}`
        pushUnique(rowsFromTaskData(state, subData, subId, scope, labelMap))
      }

      // Defensive: any sub-task id from config (including hidden-by-UI steps) if data exists
      for (const id of getChildSubTaskIds(child.id, child.childType)) {
        if (visible.some((v) => `${child.id}-${v.suffix}` === id)) continue
        const subData = (state.taskData[id] as Record<string, unknown> | undefined) ?? {}
        if (Object.keys(subData).some((k) => k.startsWith('doc-instances-'))) {
          const st = config.subTasks.find((s) => id === `${child.id}-${s.suffix}`)
          const scope = st ? `${child.name} · ${st.title}` : `${child.name} · ${id}`
          pushUnique(rowsFromTaskData(state, subData, id, scope, labelMap))
        }
      }
    }
  }

  out.sort((a, b) => {
    const s = a.scopeLabel.localeCompare(b.scopeLabel)
    if (s !== 0) return s
    return a.requirementLabel.localeCompare(b.requirementLabel) || a.fileName.localeCompare(b.fileName)
  })
  return out
}
