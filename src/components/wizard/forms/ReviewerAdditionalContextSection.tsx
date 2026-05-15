import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const REVIEWER_ADDITIONAL_CONTEXT_KEY = 'reviewerAdditionalContext'

const titleCls = 'text-base font-semibold leading-snug text-foreground'
const bodyCls = 'text-[14px] text-muted-foreground mt-2 leading-normal'

export function ReviewerAdditionalContextSection({
  value,
  onChange,
  disabled = false,
  idPrefix = 'reviewer-context',
  className,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  idPrefix?: string
  className?: string
}) {
  const textareaId = `${idPrefix}-additional-context`

  return (
    <section
      className={cn('space-y-3 scroll-mt-16 pt-8', className)}
      id={`${idPrefix}-reviewer-context`}
    >
      <h4 className={titleCls}>Additional context for reviewers</h4>
      <p className={bodyCls}>
        Add any notes, explanations, or context that may help reviewers evaluate the uploaded documents.
      </p>
      <div className="space-y-2">
        <Label htmlFor={textareaId} className="sr-only">
          Additional context for reviewers
        </Label>
        <textarea
          id={textareaId}
          className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </section>
  )
}
