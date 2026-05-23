import { useState } from 'react'
import { useWorkflow, useChildActionContext, getChildReviewState } from '@/stores/workflowStore'
import type { ChildReviewState, RelatedParty, WorkflowState } from '@/types/workflow'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown, Clock, FileText, Shield,
  Upload, Eye, FileCheck,
} from 'lucide-react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { cn } from '@/lib/utils'
import { getAllOpenAccountsTasks } from '@/utils/openAccountsTaskContext'
import { mergeAccountOpeningDocumentSubTaskData } from '@/utils/accountOpeningDocumentTasks'

const HO_DOC_API_SYNC = 'Custodian document API · batch DOC-2025-4418'

function findKycChildIdForParty(state: WorkflowState, partyId: string, partyName: string): string | undefined {
  const nameNorm = partyName.trim().toLowerCase()
  for (const t of getAllOpenAccountsTasks(state)) {
    for (const c of t.children ?? []) {
      if (c.childType !== 'kyc') continue
      const meta = state.taskData[c.id] as Record<string, unknown> | undefined
      const sid = meta?.kycSubjectPartyId as string | undefined
      if (sid === partyId) return c.id
      if (!sid && c.name.trim().toLowerCase() === nameNorm) return c.id
    }
  }
  return undefined
}

function amlReviewSeverityRank(status: NonNullable<ChildReviewState['amlReview']>['status']): number {
  switch (status) {
    case 'escalated':
      return 0
    case 'flagged':
      return 1
    case 'info_requested':
      return 2
    case 'pending':
      return 3
    case 'cleared':
      return 4
    default:
      return 5
  }
}

function pickWorstAmlReview(
  reviews: NonNullable<ChildReviewState['amlReview']>[],
): NonNullable<ChildReviewState['amlReview']> | null {
  if (reviews.length === 0) return null
  return reviews.reduce((worst, cur) =>
    amlReviewSeverityRank(cur.status) < amlReviewSeverityRank(worst.status) ? cur : worst,
  )
}

function formatAmlReviewLabel(aml: NonNullable<ChildReviewState['amlReview']>): string {
  switch (aml.status) {
    case 'pending':
      return 'Pending AML Review'
    case 'cleared':
      return 'AML Cleared'
    case 'flagged':
      return 'AML Flagged'
    case 'info_requested':
      return 'AML — Information Requested'
    case 'escalated':
      return 'AML Escalated (SAR)'
    default:
      return 'AML Review'
  }
}

function amlReviewBadgeClassName(status: NonNullable<ChildReviewState['amlReview']>['status']): string {
  switch (status) {
    case 'pending':
      return 'border-transparent bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200'
    case 'cleared':
      return 'border-green-200 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200'
    case 'flagged':
    case 'escalated':
      return 'border-red-200 bg-red-50/40 text-red-800 dark:bg-red-950/25 dark:text-red-200'
    case 'info_requested':
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

/** Demo: document intake as if returned from custodian / document API (all verified). */
const HO_DOC_API_CHECKLIST: { name: string; detail: string }[] = [
  { name: 'New Account Application', detail: 'PDF · checksum verified' },
  { name: 'W-9 / Tax Certification', detail: 'eSign completed' },
  { name: 'Government-Issued ID', detail: 'IDology pass · image quality OK' },
  { name: 'Proof of Address', detail: 'Utility bill on file' },
]

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[180px_1fr] gap-2 text-sm py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  )
}

function AccordionSection({
  title,
  icon: Icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-semibold">{title}</span>
            {badge}
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <div className="border border-t-0 border-border rounded-b-lg px-5 py-4 bg-card">
          {children}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

export function ChildHoDocumentViewContent() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()

  if (!ctx) return null

  const { child, config } = ctx
  const childMeta = state.taskData[child.id] as Record<string, unknown> | undefined
  const reviewState = getChildReviewState(state, child.id)
  const docReview = reviewState?.documentReview

  const accountName = child.name
  const registrationType = (childMeta?.registrationType as string) ?? 'Individual — taxable'

  const subTaskData = config.subTasks.map((st) => {
    const subTaskId = `${child.id}-${st.suffix}`
    const data = state.taskData[subTaskId] as Record<string, unknown> | undefined
    return { ...st, subTaskId, data: data ?? {} }
  })

  const ownersStep = subTaskData.find((s) => s.suffix === 'account-owners')
  const owners = (ownersStep?.data?.owners as Array<{ partyId?: string }>) ?? []
  const selectedOwners = owners
    .filter((o) => o.partyId)
    .map((o) => state.relatedParties.find((p) => p.id === o.partyId))
    .filter(Boolean)

  const fallbackOwners =
    selectedOwners.length > 0
      ? selectedOwners
      : state.relatedParties.filter((p) => p.type === 'household_member').slice(0, 3)

  const kycRows =
    fallbackOwners.length > 0
      ? fallbackOwners.map((o) => ({ id: o!.id, name: o!.name }))
      : [{ id: 'demo-owner', name: accountName }]

  const docsData = mergeAccountOpeningDocumentSubTaskData(subTaskData)

  const ownerParties = fallbackOwners.filter(Boolean) as RelatedParty[]

  const accountAml = reviewState?.amlReview
  const perOwner = ownerParties.map((owner) => {
    const kycId = findKycChildIdForParty(state, owner.id, owner.name ?? '')
    const aml = kycId ? getChildReviewState(state, kycId)?.amlReview : undefined
    return { owner, aml }
  })
  const mergedAml: NonNullable<ChildReviewState['amlReview']>[] = []
  if (accountAml?.status) mergedAml.push(accountAml)
  for (const { aml } of perOwner) {
    if (aml?.status) mergedAml.push(aml)
  }
  const householdAmlSnapshot = { worst: pickWorstAmlReview(mergedAml), perOwner }

  return (
    <main className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">Document Review</h2>
          <p className="text-sm text-muted-foreground">
            Verify all documents for <strong>{accountName}</strong> ({registrationType}).
            Check completeness, accuracy, and flag any discrepancies.
          </p>
        </div>

        {householdAmlSnapshot.worst ? (
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">AML screening</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Aggregate AML review status for this account and linked KYC subjects.
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-medium shrink-0 border shadow-none',
                amlReviewBadgeClassName(householdAmlSnapshot.worst.status),
              )}
            >
              {formatAmlReviewLabel(householdAmlSnapshot.worst)}
            </Badge>
          </div>
        ) : null}


        <div className="space-y-3">
          <AccordionSection title="Client Identification" icon={Eye} defaultOpen>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Minimal client information for document context. Sensitive data is masked.
              </p>
              {fallbackOwners.length > 0 ? (
                <div className="space-y-2">
                  {fallbackOwners.map((owner) => owner && (
                    <div key={owner.id} className="rounded-md border border-border px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{owner.name}</span>
                        {owner.isPrimary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-muted-foreground">
                        <span>SSN: {owner.ssn ? `••••${owner.ssn.slice(-4)}` : '••••6789 (on file)'}</span>
                        <span>DOB: {owner.dob ?? '1975-03-15'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-border px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{accountName}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-muted-foreground">
                    <span>SSN: ••••6789 (on file)</span>
                    <span>DOB: 1975-03-15</span>
                  </div>
                </div>
              )}
            </div>
          </AccordionSection>

          <AccordionSection title="Uploaded Documents" icon={Upload} defaultOpen>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{HO_DOC_API_SYNC}</p>
              {Object.keys(docsData).length > 0 ? (
                <dl className="space-y-0">
                  {Object.entries(docsData).map(([key, value]) => (
                    <ReviewRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={String(value)} />
                  ))}
                </dl>
              ) : (
                <div className="space-y-2">
                  {HO_DOC_API_CHECKLIST.map((doc) => (
                    <div key={doc.name} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                      <div className="flex min-w-0 items-start gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">{doc.detail}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 bg-green-100 text-green-800 border-green-200">
                        Verified
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionSection>

          <AccordionSection title="eSign / Signature Status" icon={FileCheck}>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                DocuSign envelope status and signature verification.
              </p>
              <div className="rounded-md border border-border px-3 py-2 text-sm flex items-center justify-between">
                <span>Client Signature</span>
                <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 border-green-200">Signed</Badge>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="KYC / ID Verification" icon={Shield}>
            <div className="space-y-0">
              {kycRows.map((row) => {
                const aml = householdAmlSnapshot.perOwner.find((x) => x.owner.id === row.id)?.aml
                return (
                  <div
                    key={row.id}
                    className="flex flex-col gap-2 py-2 text-sm border-b border-border last:border-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-foreground">{row.name}</span>
                    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                      {aml?.status ? (
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0 border shadow-none', amlReviewBadgeClassName(aml.status))}
                        >
                          {formatAmlReviewLabel(aml)}
                        </Badge>
                      ) : null}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
                        Verified · CIP API
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </AccordionSection>

          <AccordionSection title="Audit Trail" icon={Clock}>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Submitted by Advisor</span>
                <span>{state.submittedAt ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Document package indexed</span>
                <span>{state.submittedAt ?? 'Sync complete'}</span>
              </div>
              {householdAmlSnapshot.worst && (
                <div className="flex items-center justify-between py-1.5 border-b border-border gap-2">
                  <span className="text-muted-foreground">AML screening (aggregate)</span>
                  <span className="flex items-center gap-2 shrink-0 text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] border shadow-none',
                        amlReviewBadgeClassName(householdAmlSnapshot.worst.status),
                      )}
                    >
                      {formatAmlReviewLabel(householdAmlSnapshot.worst)}
                    </Badge>
                    {householdAmlSnapshot.worst.decidedAt ? (
                      <span className="text-foreground tabular-nums">{householdAmlSnapshot.worst.decidedAt}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </div>
              )}
              {docReview?.decidedAt && (
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Document Review {docReview.status === 'igo' ? 'Accepted' : docReview.status === 'nigo' ? 'Rejected' : 'IGO'}</span>
                  <span>{docReview.decidedAt}</span>
                </div>
              )}
              {reviewState?.amlFlagged && (
                <div className="flex items-center justify-between py-1.5 border-b border-border text-amber-700">
                  <span>AML Flag by Advisor</span>
                  <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-700">Flagged</Badge>
                </div>
              )}
            </div>
          </AccordionSection>

          {reviewState?.amlFlagged && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-4 py-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">AML Review Requested</p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
                    The advisor flagged this account for AML/OFAC screening.
                    {reviewState.amlNotes && <> Notes: &ldquo;{reviewState.amlNotes}&rdquo;</>}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
