import { useState } from 'react'
import { useWorkflow, useChildActionContext, getChildReviewState } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown, Clock, Users, FileText, CreditCard, Shield, Banknote,
  Settings2, ShieldAlert,
} from 'lucide-react'
import * as Collapsible from '@radix-ui/react-collapsible'
import type { RelatedParty } from '@/types/workflow'
import { cn } from '@/lib/utils'

/** Demo: principal review payload as if custodian / HO APIs returned complete rows. */
const PRINCIPAL_API_DOC_LINE =
  'Document Ops API · packet IGO · checksum verified against custodian index'

const PRINCIPAL_API_FUNDING: { label: string; value: string }[] = [
  { label: 'Initial funding method', value: 'ACH — linked external bank on file' },
  { label: 'Anticipated funding', value: '$25,000 within 30 days of open' },
  { label: 'ACAT / transfer', value: 'None indicated' },
]

const PRINCIPAL_API_FEATURES: { label: string; value: string }[] = [
  { label: 'Statements & confirms', value: 'eDelivery' },
  { label: 'Tax reporting', value: '1099 composite' },
  { label: 'Checkwriting', value: 'Not elected' },
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

export function ChildHoPrincipalViewContent() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()

  if (!ctx) return null

  const { child, config } = ctx
  const childMeta = state.taskData[child.id] as Record<string, unknown> | undefined
  const reviewState = getChildReviewState(state, child.id)
  const docReview = reviewState?.documentReview
  const principalReview = reviewState?.principalReview

  const accountName = child.name
  const registrationType = (childMeta?.registrationType as string) ?? 'Individual — taxable'
  const accountNumber = (childMeta?.accountNumber as string) ?? '882-14-99102 (custodian-assigned)'
  const shortName = (childMeta?.shortName as string) ?? accountName.slice(0, 32)

  const docIsNigo = docReview?.status === 'nigo'
  const docReviewedAt = docReview?.decidedAt ?? state.submittedAt ?? 'Custodian sync complete'

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

  const fallbackOwners: RelatedParty[] =
    selectedOwners.length > 0
      ? (selectedOwners as RelatedParty[])
      : state.relatedParties.filter((p) => p.type === 'household_member').slice(0, 3)

  const displayOwners: RelatedParty[] =
    fallbackOwners.length > 0
      ? fallbackOwners
      : [
          {
            id: 'demo-owner',
            name: accountName,
            type: 'household_member',
            isPrimary: true,
            email: 'client@example.com',
            phone: '(555) 010-0199',
            ssn: '123456789',
            kycStatus: 'verified',
          },
        ]

  const kycRows = displayOwners.map((o) => ({ id: o.id, name: o.name }))

  const fundingStep = subTaskData.find((s) => s.suffix === 'funding-transfers')
  const featuresStep = subTaskData.find((s) => s.suffix === 'features-services')

  const fundingRows =
    fundingStep && Object.keys(fundingStep.data).length > 0
      ? Object.entries(fundingStep.data).map(([key, value]) => ({
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          value: String(value),
        }))
      : PRINCIPAL_API_FUNDING

  const featureRows =
    featuresStep && Object.keys(featuresStep.data).length > 0
      ? Object.entries(featuresStep.data).map(([key, value]) => ({
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          value: String(value),
        }))
      : PRINCIPAL_API_FEATURES

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">Principal Review</h2>
          <p className="text-sm text-muted-foreground">
            Full overview of <strong>{accountName}</strong> — review document team findings,
            risk flags, and approve or reject the submission.
          </p>
        </div>


        <div className="space-y-3">
          <AccordionSection
            title="Document Team Findings"
            icon={FileText}
            defaultOpen
            badge={
              docIsNigo ? (
                <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-800 border-red-200">NIGO</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 border-green-200">IGO</Badge>
              )
            }
          >
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{PRINCIPAL_API_DOC_LINE}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Document Review Status</span>
                <span className="font-medium">
                  {docIsNigo ? 'Not In Good Order (NIGO)' : 'In Good Order (IGO)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reviewed At</span>
                <span>{docReviewedAt}</span>
              </div>
              {docIsNigo && docReview?.nigoReason && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 px-3 py-2 space-y-1">
                  <p className="text-xs text-red-900 dark:text-red-100">
                    <span className="font-semibold">NIGO Reason:</span> {docReview.nigoReason}
                  </p>
                  {docReview.nigoFeedback && (
                    <p className="text-xs text-red-800/90 dark:text-red-200/80">
                      <span className="font-semibold">Notes:</span> {docReview.nigoFeedback}
                    </p>
                  )}
                </div>
              )}
              {!docIsNigo && (
                <p className="text-xs text-muted-foreground">
                  Document intake matches custodian specifications; principal may rely on this packet for approval.
                </p>
              )}
            </div>
          </AccordionSection>

          {reviewState?.amlFlagged && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-4 py-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    AML / Sanctions Flag
                  </p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
                    The advisor flagged this account for AML review. OFAC and sanctions screening should be verified.
                    {reviewState.amlNotes && <> Advisor notes: &ldquo;{reviewState.amlNotes}&rdquo;</>}
                  </p>
                </div>
              </div>
            </div>
          )}

          <AccordionSection title="Account Details" icon={CreditCard} defaultOpen>
            <dl className="space-y-0">
              <ReviewRow label="Account Name" value={accountName} />
              <ReviewRow label="Registration Type" value={registrationType} />
              <ReviewRow label="Account Number" value={accountNumber} />
              <ReviewRow label="Short Name" value={shortName} />
            </dl>
          </AccordionSection>

          <AccordionSection
            title={`Owners & Participants (${displayOwners.length})`}
            icon={Users}
            badge={
              <Badge variant="secondary" className="text-[10px]">
                {displayOwners.length} {displayOwners.length === 1 ? 'owner' : 'owners'}
              </Badge>
            }
          >
            <div className="space-y-2">
              {displayOwners.map((owner) => (
                <div key={owner.id} className="py-2 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{owner.name}</span>
                    {owner.isPrimary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
                      KYC: Verified
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Email: {owner.email ?? 'on file'}</span>
                    <span>Phone: {owner.phone ?? 'on file'}</span>
                    {owner.ssn && <span>SSN: ••••{owner.ssn.slice(-4)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="Funding & Asset Movement" icon={Banknote}>
            <dl className="space-y-0">
              {fundingRows.map((row) => (
                <ReviewRow key={row.label} label={row.label} value={row.value} />
              ))}
            </dl>
          </AccordionSection>

          <AccordionSection title="Account Features & Services" icon={Settings2}>
            <dl className="space-y-0">
              {featureRows.map((row) => (
                <ReviewRow key={row.label} label={row.label} value={row.value} />
              ))}
            </dl>
          </AccordionSection>

          <AccordionSection title="KYC Status" icon={Shield}>
            <div className="space-y-0">
              {kycRows.map((owner) => (
                <div key={owner.id} className="flex items-center justify-between py-2 text-sm border-b border-border last:border-0">
                  <span>{owner.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
                    Verified · CIP API
                  </Badge>
                </div>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection title="Workflow & Audit" icon={Clock}>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Submitted by Advisor</span>
                <span>{state.submittedAt ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">
                  Document Review — {docIsNigo ? 'NIGO' : 'IGO'}
                </span>
                <span>{docReviewedAt}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Principal queue — package indexed</span>
                <span>{state.submittedAt ?? docReviewedAt}</span>
              </div>
              {principalReview?.decidedAt && (
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">
                    Principal Review — {principalReview.status === 'igo' ? 'Approved' : principalReview.status === 'nigo' ? 'Rejected' : 'Recorded'}
                  </span>
                  <span>{principalReview.decidedAt}</span>
                </div>
              )}
            </div>
          </AccordionSection>
        </div>
      </div>
    </main>
  )
}
