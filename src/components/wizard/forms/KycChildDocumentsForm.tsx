import { useTaskData, useChildActionContext } from '@/stores/workflowStore'
import { FileUpload, type FileWithStatus } from '@/components/ui/file-upload'

export function KycChildDocumentsForm() {
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField } = useTaskData(taskId || '__no_child__')

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
