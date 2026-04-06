import { useTaskData, useChildActionContext } from '@/stores/workflowStore'
import { FileUpload, type FileWithStatus } from '@/components/ui/file-upload'
import { Lock } from 'lucide-react'

export function KycChildDocumentsForm() {
  const ctx = useChildActionContext()
  const child = ctx?.child ?? null
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

  const isLocked = child ? child.status !== 'not_started' : false

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
      {isLocked && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
              Documents have been submitted for compliance verification and are locked.
            </p>
          </div>
        </div>
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
