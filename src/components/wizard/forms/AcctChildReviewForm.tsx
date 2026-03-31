import { useWorkflow } from '@/stores/workflowStore'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import type { AccountType } from '@/types/workflow'
import { ClipboardCheck, Clock } from 'lucide-react'

const accountTypeLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  checking: 'Checking',
  savings: 'Savings',
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <dt className="min-w-[140px] text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function AcctChildReviewForm() {
  const { state } = useWorkflow()

  const parsed = parseChildSubTaskId(state.activeTaskId)
  const child = parsed
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === parsed.childId)
    : null

  const detailsData = child ? state.taskData[`${child.id}-details`] ?? {} : {}
  const docsData = child ? state.taskData[`${child.id}-documents`] ?? {} : {}

  const accountType = detailsData.accountType as AccountType | undefined
  const uploadedDocs = (docsData.uploadedDocs as string[]) ?? []
  const accountHolders = (detailsData.accountHolders as string[]) ?? []

  const holderNames = accountHolders
    .map((id) => state.relatedParties.find((p) => p.id === id)?.name)
    .filter(Boolean)

  const hasDetails = !!(detailsData.accountName || accountType)

  return (
    <div className="space-y-6">
      {hasDetails ? (
        <>
          <div className="rounded-lg border border-border p-4 bg-muted/50 space-y-3">
            <p className="text-sm font-semibold">Account Details</p>
            <dl className="space-y-1">
              <ReviewRow label="Account Name" value={detailsData.accountName as string} />
              <ReviewRow
                label="Account Type"
                value={accountType ? accountTypeLabels[accountType] : undefined}
              />
              <ReviewRow label="Custodian" value={detailsData.custodian as string} />
              <ReviewRow label="Beneficiary" value={detailsData.beneficiary as string} />
              {holderNames.length > 0 && (
                <ReviewRow label="Account Holders" value={holderNames.join(', ')} />
              )}
            </dl>
          </div>

          <div className="rounded-lg border border-border p-4 bg-muted/50 space-y-3">
            <p className="text-sm font-semibold">Documents</p>
            {uploadedDocs.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {uploadedDocs.length} document{uploadedDocs.length === 1 ? '' : 's'} uploaded
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Pending Review
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This account opening request is ready for review.
                  Confirm this step to submit the request.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <ClipboardCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Complete the Account Details and Documents steps before reviewing.
          </p>
        </div>
      )}
    </div>
  )
}
