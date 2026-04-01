import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { getRequiredDocuments } from '@/utils/accountDocuments'
import type { AccountType } from '@/types/workflow'
import { Upload } from 'lucide-react'
import { FileUpload, type FileWithStatus } from '@/components/ui/file-upload'

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

  return (
    <div className="space-y-4">
      {requiredDocs.length > 0 ? (
        <div className="space-y-4">
          {requiredDocs.map((doc) => {
            const storedFiles = (data[`doc-${doc.id}`] as { name: string; size?: number }[] | undefined) ?? []

            return (
              <FileUpload
                key={doc.id}
                id={`acct-child-${taskId}-${doc.id}`}
                label={doc.label}
                subtitle={doc.description}
                initialFiles={storedFiles}
                onFilesChange={(files: FileWithStatus[]) => {
                  const meta = files.map((f) => ({
                    name: f.file.name,
                    size: f.file.size,
                  }))
                  updateField(`doc-${doc.id}`, meta)
                }}
              />
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
