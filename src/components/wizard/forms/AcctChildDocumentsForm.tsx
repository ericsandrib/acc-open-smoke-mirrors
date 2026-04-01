import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { getRequiredDocuments } from '@/utils/accountDocuments'
import type { AccountType } from '@/types/workflow'
import { Upload, CheckCircle2 } from 'lucide-react'

export function AcctChildDocumentsForm() {
  const { state } = useWorkflow()

  const parsed = parseChildSubTaskId(state.activeTaskId)
  const child = parsed
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === parsed.childId)
    : null

  // Get account type from the child's details sub-task data
  const detailsTaskId = child ? `${child.id}-details` : ''
  const detailsData = state.taskData[detailsTaskId] ?? {}
  const accountType = detailsData.accountType as AccountType | undefined

  const taskId = state.activeTaskId
  const { data, updateField } = useTaskData(taskId)

  const requiredDocs = accountType ? getRequiredDocuments([accountType]) : []
  const uploadedDocs = (data.uploadedDocs as string[] | undefined) ?? []

  const toggleDoc = (docId: string) => {
    const next = uploadedDocs.includes(docId)
      ? uploadedDocs.filter((id) => id !== docId)
      : [...uploadedDocs, docId]
    updateField('uploadedDocs', next)
  }

  return (
    <div className="space-y-4">
      {requiredDocs.length > 0 ? (
        <div className="space-y-3">
          {requiredDocs.map((doc) => {
            const isUploaded = uploadedDocs.includes(doc.id)
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => toggleDoc(doc.id)}
                className={`w-full rounded-lg border-2 border-dashed p-4 text-left transition-colors ${
                  isUploaded
                    ? 'border-border-success-primary bg-fill-success-tertiary'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isUploaded ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-text-success-primary shrink-0" />
                  ) : (
                    <Upload className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {doc.label}
                      {isUploaded && (
                        <span className="ml-2 text-xs text-text-success-primary">Uploaded</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                    {!isUploaded && (
                      <p className="text-xs text-muted-foreground/70 mt-1">Click to mark as uploaded</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Complete the Account Details step first to see required documents.
          </p>
        </div>
      )}
    </div>
  )
}
