import { useState } from 'react'
import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown, Clock, FileText, Shield,
  Upload, Eye, FileCheck,
} from 'lucide-react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { cn } from '@/lib/utils'

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
  const reviewState = state.childReviewState
  const docReview = reviewState?.documentReview

  const accountName = child.name
  const registrationType = (childMeta?.registrationType as string) ?? 'N/A'

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

  const docsStep = subTaskData.find((s) => s.suffix === 'documents-review')

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">Document Review</h2>
          <p className="text-sm text-muted-foreground">
            Verify all documents for <strong>{accountName}</strong> ({registrationType}).
            Check completeness, accuracy, and flag any discrepancies.
          </p>
        </div>


        <div className="space-y-3">
          <AccordionSection title="Client Identification" icon={Eye} defaultOpen>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Minimal client information for document context. Sensitive data is masked.
              </p>
              {selectedOwners.length > 0 ? (
                <div className="space-y-2">
                  {selectedOwners.map((owner) => owner && (
                    <div key={owner.id} className="rounded-md border border-border px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{owner.name}</span>
                        {owner.isPrimary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-muted-foreground">
                        {owner.ssn && <span>SSN: ••••{owner.ssn.slice(-4)}</span>}
                        {owner.dob && <span>DOB: {owner.dob}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No owners linked to this account.</p>
              )}
            </div>
          </AccordionSection>

          <AccordionSection title="Uploaded Documents" icon={Upload} defaultOpen>
            {docsStep && Object.keys(docsStep.data).length > 0 ? (
              <dl className="space-y-0">
                {Object.entries(docsStep.data).map(([key, value]) => (
                  <ReviewRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={String(value)} />
                ))}
              </dl>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Document verification list generated based on account type and owners.
                </p>
                <div className="space-y-2">
                  {['New Account Application', 'W-9 / Tax Certification', 'Government-Issued ID', 'Proof of Address'].map((doc) => (
                    <div key={doc} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{doc}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-yellow-100 text-yellow-800 border-yellow-200">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <div className="rounded-md border border-border px-3 py-2 text-sm flex items-center justify-between">
                <span>Advisor Counter-Signature</span>
                <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 border-green-200">Signed</Badge>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="KYC / ID Verification" icon={Shield}>
            {selectedOwners.length > 0 ? (
              <div className="space-y-1">
                {selectedOwners.map((owner) => owner && (
                  <div key={owner.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{owner.name}</span>
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] px-1.5 py-0',
                        owner.kycStatus === 'verified' ? 'bg-green-100 text-green-800' :
                        owner.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-muted text-muted-foreground'
                      )}
                    >
                      {owner.kycStatus === 'verified' ? 'Verified' : owner.kycStatus === 'pending' ? 'In Progress' : 'Not Started'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No owners to verify.</p>
            )}
          </AccordionSection>

          <AccordionSection title="Audit Trail" icon={Clock}>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Submitted by Advisor</span>
                <span>{state.submittedAt ?? 'N/A'}</span>
              </div>
              {docReview?.decidedAt && (
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Document Review {docReview.status === 'igo' ? 'Approved (IGO)' : docReview.status === 'nigo' ? 'Rejected (NIGO)' : 'Pending'}</span>
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
