import {
  useWorkflow,
  useTaskData,
  useChildActionContext,
  useAdvisorFormsEditable,
  useAdvisorResubmitEligible,
} from '@/stores/workflowStore'
import { useMemo } from 'react'
import {
  DocumentUploadInstancesTable,
  type DocumentUploadInstance,
} from '@/components/wizard/forms/DocumentUploadInstancesTable'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  getOpenAccountsCoreSupportingDocumentSections,
  getDocSubTypes,
  type DocumentRequirementWithSubTypes,
} from '@/utils/registrationDocuments'
import { defaultSupportingDocumentStatus, nextStatusAfterUpload } from '@/utils/supportingDocuments'

export function KycChildDocumentsForm() {
  const ctx = useChildActionContext()
  const child = ctx?.child ?? null
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')
  const { state } = useWorkflow()
  const advisorFormsEditable = useAdvisorFormsEditable()
  const advisorResubmitEligible = useAdvisorResubmitEligible()
  const childMeta = child ? (state.taskData[child.id] as Record<string, unknown> | undefined) ?? {} : {}
  const isEntity = childMeta.kycSubjectType === 'entity'
  const isAdvisorView = state.demoViewMode === 'advisor'

  const statusLocked = child ? (child.status === 'awaiting_review' || child.status === 'complete' || child.status === 'rejected') : false
  const isApproved = child?.status === 'complete'
  const isLocked = isApproved || (isAdvisorView && statusLocked && !advisorFormsEditable)

  const docs = useMemo<DocumentRequirementWithSubTypes[]>(
    () => getOpenAccountsCoreSupportingDocumentSections(),
    [],
  )
  const assignmentOptions = useMemo(
    () =>
      state.relatedParties
        .filter((p) => !p.isHidden && (p.type === 'household_member' || p.type === 'related_organization'))
        .map((p) => ({
          id: p.id,
          name: `${p.name}${p.type === 'related_organization' ? ' (Legal entity)' : ' (Individual)'}`,
        })),
    [state.relatedParties],
  )
  const defaultAssignedTo = ''

  const updateDocInstances = (docId: string, next: DocumentUploadInstance[]) => {
    updateField(`doc-instances-${docId}`, next)
    updateField(
      `doc-${docId}`,
      next
        .filter((d) => Boolean(d.fileName))
        .map((d) => ({ name: d.fileName!, assignedTo: d.assignedTo, subType: d.subType })),
    )
  }

  const uploadForInstance = (docId: string, instanceId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const prior = ((data[`doc-instances-${docId}`] as DocumentUploadInstance[] | undefined) ?? [])
        .find((d) => d.id === instanceId)
      const instances = ((data[`doc-instances-${docId}`] as DocumentUploadInstance[] | undefined) ?? []).map((d) =>
        d.id === instanceId
          ? { ...d, fileName: file.name, status: nextStatusAfterUpload(prior?.status) }
          : d,
      )
      updateDocInstances(docId, instances)
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      <div id="kyc-docs-overview" className="scroll-mt-16" />
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Supporting Documents</h3>
        <p className="text-sm text-muted-foreground">
          Supporting documents are optional unless requested during review. Firm and custodian-generated forms are handled in <span className="font-medium text-foreground">Envelopes</span>.
        </p>
      </div>
      {advisorResubmitEligible && (
        <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
              A reviewer has returned this submission with feedback. Documents are unlocked — update and resubmit.
            </p>
          </div>
        </div>
      )}
      {isLocked && isApproved && (
        <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-xs font-medium text-green-900 dark:text-green-100">
              This KYC package has been approved. Documents are read-only.
            </p>
          </div>
        </div>
      )}
      {docs.map((doc) => {
        const instances = (data[`doc-instances-${doc.id}`] as DocumentUploadInstance[] | undefined) ?? []
        const nextAssignees = assignmentOptions

        return (
          <div key={doc.id} id={`kyc-doc-${doc.id}`} className="scroll-mt-16">
            <DocumentUploadInstancesTable
              docLabel={doc.label}
              docDescription={doc.description}
              instances={instances}
              subTypes={getDocSubTypes(doc.id)}
              assignees={nextAssignees}
              lockAssignedWhenPresent={false}
              disabled={isLocked}
              emptyMessage="No documents added yet."
              onAdd={() =>
                updateDocInstances(doc.id, [
                  ...instances,
                  {
                    id: `kyc-doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    docTypeId: doc.id,
                    assignedTo: defaultAssignedTo,
                    status: defaultSupportingDocumentStatus(),
                  },
                ])
              }
              onRemove={(instanceId) => updateDocInstances(doc.id, instances.filter((i) => i.id !== instanceId))}
              onUpload={(instanceId) => uploadForInstance(doc.id, instanceId)}
              onUpdate={(instanceId, updates) =>
                updateDocInstances(
                  doc.id,
                  instances.map((i) => (i.id === instanceId ? { ...i, ...updates } : i)),
                )
              }
            />
          </div>
        )
      })}
    </div>
  )
}
