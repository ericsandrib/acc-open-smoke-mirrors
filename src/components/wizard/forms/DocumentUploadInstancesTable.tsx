import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Paperclip, Plus, Trash2, Upload, X } from 'lucide-react'

export interface DocumentUploadInstance {
  id: string
  docTypeId: string
  assignedTo: string
  fileName?: string
  subType?: string
}

type SelectOption = {
  value: string
  label: string
}

type AssigneeOption = {
  id: string
  name: string
}

interface DocumentUploadInstancesTableProps {
  docLabel: string
  docDescription?: string
  instances: DocumentUploadInstance[]
  subTypes: SelectOption[]
  assignees: AssigneeOption[]
  emptyMessage: string
  disabled?: boolean
  lockAssignedWhenPresent?: boolean
  onAdd: () => void
  onRemove: (instanceId: string) => void
  onUpload: (instanceId: string) => void
  onUpdate: (instanceId: string, updates: Partial<DocumentUploadInstance>) => void
}

export function DocumentUploadInstancesTable({
  docLabel,
  docDescription,
  instances,
  subTypes,
  assignees,
  emptyMessage,
  disabled = false,
  lockAssignedWhenPresent = true,
  onAdd,
  onRemove,
  onUpload,
  onUpdate,
}: DocumentUploadInstancesTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{docLabel}</p>
          {docDescription ? <p className="text-xs text-muted-foreground">{docDescription}</p> : null}
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onAdd} disabled={disabled}>
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>

      {instances.length > 0 ? (
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs w-[36%]">
                Specification
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs w-[11rem] max-w-[11rem]">
                Assigned To
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">File</th>
              <th className="w-[40px]" />
            </tr>
          </thead>
          <tbody>
            {instances.map((inst, idx) => {
              const assigneeName = assignees.find((a) => a.id === inst.assignedTo)?.name
              return (
                <tr key={inst.id} className={idx < instances.length - 1 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2.5 min-w-0 align-top w-[36%] max-w-[36%] overflow-hidden">
                    {subTypes.length > 0 ? (
                      <Select
                        value={inst.subType ?? ''}
                        onValueChange={(v) => onUpdate(inst.id, { subType: v })}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-xs w-full max-w-full min-w-0">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {subTypes.map((st) => (
                            <SelectItem key={st.value} value={st.value}>
                              {st.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex min-w-0 max-w-full cursor-default items-center h-8 px-3 rounded-md border border-border bg-muted/30">
                        <span className="text-xs text-foreground truncate min-w-0" title={docLabel}>
                          {docLabel}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-2.5 w-[11rem] max-w-[11rem] align-top">
                    {lockAssignedWhenPresent && inst.assignedTo && assigneeName ? (
                      <div className="flex min-w-0 items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-muted/30">
                        <span className="text-xs text-foreground truncate min-w-0" title={assigneeName}>
                          {assigneeName}
                        </span>
                      </div>
                    ) : (
                      <Select
                        value={inst.assignedTo}
                        onValueChange={(v) => onUpdate(inst.id, { assignedTo: v })}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-xs w-full max-w-full min-w-0">
                          <SelectValue placeholder="Assign to..." />
                        </SelectTrigger>
                        <SelectContent>
                          {assignees.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    {inst.fileName ? (
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-foreground truncate max-w-[180px]">{inst.fileName}</span>
                        <button
                          type="button"
                          onClick={() => onUpdate(inst.id, { fileName: undefined })}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          disabled={disabled}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5 text-muted-foreground"
                        onClick={() => onUpload(inst.id)}
                        disabled={disabled}
                      >
                        <Upload className="h-3 w-3" />
                        Upload
                      </Button>
                    )}
                  </td>

                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      onClick={() => onRemove(inst.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      disabled={disabled}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}
