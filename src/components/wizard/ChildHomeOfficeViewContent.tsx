import { useState } from 'react'
import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Clock, Users, FileText, CreditCard, Shield, Banknote, Settings2, AlertTriangle, CheckCircle2 } from 'lucide-react'
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

export function ChildHomeOfficeViewContent() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()

  if (!ctx) return null

  const { child, config } = ctx
  const childMeta = state.taskData[child.id] as Record<string, unknown> | undefined

  const accountName = child.name
  const registrationType = (childMeta?.registrationType as string) ?? 'N/A'
  const accountNumber = (childMeta?.accountNumber as string) ?? ''
  const shortName = (childMeta?.shortName as string) ?? ''

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

  const fundingStep = subTaskData.find((s) => s.suffix === 'funding-transfers')
  const featuresStep = subTaskData.find((s) => s.suffix === 'features-services')
  const docsStep = subTaskData.find((s) => s.suffix === 'documents-review')

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">Home Office Review</h2>
          <p className="text-sm text-muted-foreground">
            Account opening submission for <strong>{accountName}</strong> — received at {state.submittedAt ?? 'N/A'}. Expand each section to review.
          </p>
        </div>

        {(() => {
          const decision = state.childReviewDecision
          const reviewData = state.taskData[`${child.id}-review`] as Record<string, unknown> | undefined

          if (decision?.outcome === 'rejected') {
            return (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Submission Rejected
                    </p>
                    <p className="text-xs text-red-800/80 dark:text-red-200/70">
                      This account opening has been rejected and sent back to the advisor for resolution.
                    </p>
                    {reviewData?.rejectionReason ? (
                      <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2 space-y-1">
                        <p className="text-xs text-red-900 dark:text-red-100">
                          <span className="font-semibold">Reason:</span> {String(reviewData.rejectionReason)}
                        </p>
                        {reviewData.rejectionFeedback ? (
                          <p className="text-xs text-red-800/90 dark:text-red-200/80">
                            <span className="font-semibold">Feedback:</span> {String(reviewData.rejectionFeedback)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <p className="text-xs text-red-700/70 dark:text-red-300/60 mt-1">
                      Rejected at {decision.decidedAt}
                    </p>
                  </div>
                </div>
              </div>
            )
          }

          if (decision?.outcome === 'approved') {
            return (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/40 px-4 py-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Approved</p>
                    <p className="text-xs text-green-800/80 dark:text-green-200/70">
                      This account opening has been approved and is being processed. Approved at {decision.decidedAt}.
                    </p>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/60 dark:bg-yellow-950/40 px-4 py-3">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pending Review</p>
                  <p className="text-xs text-yellow-800/80 dark:text-yellow-200/70">
                    This account opening submission requires your approval. Review each section and approve or reject at the bottom.
                  </p>
                </div>
              </div>
            </div>
          )
        })()}

        <div className="space-y-3">
          <AccordionSection title="Account Details" icon={CreditCard} defaultOpen>
            <dl className="space-y-0">
              <ReviewRow label="Account Name" value={accountName} />
              <ReviewRow label="Registration Type" value={registrationType} />
              <ReviewRow label="Account Number" value={accountNumber} />
              <ReviewRow label="Short Name" value={shortName} />
            </dl>
          </AccordionSection>

          <AccordionSection
            title={`Owners & Participants (${selectedOwners.length})`}
            icon={Users}
            badge={selectedOwners.length > 0 ? (
              <Badge variant="secondary" className="text-[10px]">
                {selectedOwners.length} {selectedOwners.length === 1 ? 'owner' : 'owners'}
              </Badge>
            ) : undefined}
          >
            {selectedOwners.length > 0 ? (
              <div className="space-y-2">
                {selectedOwners.map((owner) => owner && (
                  <div key={owner.id} className="py-2 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{owner.name}</span>
                      {owner.isPrimary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>}
                      {owner.kycStatus && (
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0',
                            owner.kycStatus === 'verified' ? 'bg-green-100 text-green-800 border-green-200' :
                            owner.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          )}
                        >
                          KYC: {owner.kycStatus === 'verified' ? 'Verified' : owner.kycStatus === 'pending' ? 'Pending' : 'Not Started'}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-muted-foreground">
                      {owner.email && <span>Email: {owner.email}</span>}
                      {owner.phone && <span>Phone: {owner.phone}</span>}
                      {owner.ssn && <span>SSN: ••••{owner.ssn.slice(-4)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No owners selected yet.</p>
            )}
          </AccordionSection>

          <AccordionSection title="Funding & Asset Movement" icon={Banknote}>
            {fundingStep && Object.keys(fundingStep.data).length > 0 ? (
              <dl className="space-y-0">
                {Object.entries(fundingStep.data).map(([key, value]) => (
                  <ReviewRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={String(value)} />
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No funding details captured yet.</p>
            )}
          </AccordionSection>

          <AccordionSection title="Account Features & Services" icon={Settings2}>
            {featuresStep && Object.keys(featuresStep.data).length > 0 ? (
              <dl className="space-y-0">
                {Object.entries(featuresStep.data).map(([key, value]) => (
                  <ReviewRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={String(value)} />
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No features or services configured yet.</p>
            )}
          </AccordionSection>

          <AccordionSection title="Documents & Signatures" icon={FileText}>
            {docsStep && Object.keys(docsStep.data).length > 0 ? (
              <dl className="space-y-0">
                {Object.entries(docsStep.data).map(([key, value]) => (
                  <ReviewRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} value={String(value)} />
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Document review and DocuSign envelope details would appear here.
              </p>
            )}
          </AccordionSection>

          <AccordionSection title="KYC Status" icon={Shield}>
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
        </div>
      </div>
    </main>
  )
}
