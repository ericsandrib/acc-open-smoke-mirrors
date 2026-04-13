import { useTaskData, useChildActionContext, useAdvisorUnlocked } from '@/stores/workflowStore'
import { FileUpload, type FileWithStatus } from '@/components/ui/file-upload'
import { Lock, AlertTriangle, CheckCircle2 } from 'lucide-react'

export function KycChildDocumentsForm() {
  const ctx = useChildActionContext()
  const child = ctx?.child ?? null
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')
  const advisorUnlocked = useAdvisorUnlocked()

  const statusLocked = child ? (child.status === 'awaiting_review' || child.status === 'complete' || child.status === 'rejected') : false
  const isLocked = statusLocked && !advisorUnlocked
  const isApproved = child?.status === 'complete'

  const docs = [
    {
      id: 'gov-id',
      label: 'Government-Issued ID',
      description: 'Upload a passport, driver\'s license, or national ID card',
      hint: 'PDF, JPG, or PNG up to 10 MB',
    },
    {
      id: 'supporting-docs',
      label: 'Supporting Documents',
      description: 'Upload proof of address, utility bills, or other supporting documentation',
      hint: 'PDF, JPG, or PNG up to 10 MB',
    },
  ]

  return (
    <div className="space-y-4">
      {advisorUnlocked && (
        <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
              A reviewer has returned this submission with feedback. Documents are unlocked — update and resubmit.
            </p>
          </div>
        </div>
      )}
      {isLocked && (
        isApproved ? (
          <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-xs font-medium text-green-900 dark:text-green-100">
                This KYC package has been approved. Documents are read-only.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                This submission is under review. Documents are locked and cannot be modified.
              </p>
            </div>
          </div>
        )
      )}
      {docs.map((doc) => {
        const storedFiles = (data[`doc-${doc.id}`] as { name: string; size?: number }[] | undefined) ?? []

        return (
          <FileUpload
            key={doc.id}
            id={`kyc-${taskId}-${doc.id}`}
            label={doc.label}
            subtitle={doc.description}
            hint={doc.hint}
            initialFiles={storedFiles}
            acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
            disabled={isLocked}
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
  )
}
