import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, CheckCircle2, Building2, Users, FileText, CreditCard, Shield, ClipboardCheck } from 'lucide-react'
import * as Collapsible from '@radix-ui/react-collapsible'
import type { RelatedParty, AccountType } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { isOpenAccountsTask } from '@/utils/openAccountsTaskContext'

const accountTypeLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  checking: 'Checking',
  savings: 'Savings',
}

const clientTypeLabels: Record<string, string> = {
  individual: 'Individual',
  joint: 'Joint',
  trust: 'Trust',
  corporate: 'Corporate',
}

/** Demo: HO review as if custodian / CRM APIs returned a complete submission payload. */
const HO_REVIEW_API_SYNC = 'Custodian intake API · submission bundle HO-2025-4418 · all sections materialized'

const HO_DEMO_DOCUMENTS: { name: string; detail: string }[] = [
  { name: 'New Account Application', detail: 'PDF · indexed · eSign complete' },
  { name: 'W-9 / Tax Certification', detail: 'TIN match · IRS validation OK' },
  { name: 'Government-Issued ID', detail: 'CIP vendor · image quality OK' },
  { name: 'Proof of Address', detail: 'Utility bill on file' },
]

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

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

function PartyDetail({ party }: { party: RelatedParty }) {
  return (
    <div className="py-2 border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium">{party.name}</span>
        {party.isPrimary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>}
        {party.relationship && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{party.relationship}</Badge>}
        {party.role && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{party.role}</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-muted-foreground ml-0">
        {party.email && <span>Email: {party.email}</span>}
        {party.phone && <span>Phone: {party.phone}</span>}
        {party.dob && <span>DOB: {formatDate(party.dob)}</span>}
      </div>
    </div>
  )
}

export function HomeOfficeViewContent() {
  const { state } = useWorkflow()
  /** Demo: advisor attestations; no separate Final Review task in the wizard. */
  const advisorConfirmations = {
    termsAccepted: true,
    regulatoryAccepted: true,
    dataConsent: true,
  }
  const journeyClientMeta = state.taskData['client-info'] as Record<string, unknown> | undefined
  const allOpen = state.tasks.filter((t) => isOpenAccountsTask(t))
  const openAccountsData =
    (allOpen
      .map((t) => state.taskData[t.id] as Record<string, unknown> | undefined)
      .find((d) => d && typeof d.additionalInstructions === 'string' && d.additionalInstructions) as
      | Record<string, unknown>
      | undefined) ?? (state.taskData['open-accounts'] as Record<string, unknown> | undefined) ?? {}

  const primaryMember =
    state.relatedParties.find((p) => p.type === 'household_member' && p.isPrimary && !p.isHidden)
    ?? state.relatedParties.find((p) => p.type === 'household_member' && !p.isHidden)

  const clientNameFromMeta = [journeyClientMeta?.firstName, journeyClientMeta?.lastName].filter(Boolean).join(' ')

  const clientName =
    primaryMember?.name
    ?? [primaryMember?.firstName, primaryMember?.lastName].filter(Boolean).join(' ')
    ?? (clientNameFromMeta || undefined)
    ?? 'Household — primary applicant'

  const demoClientEmail = (journeyClientMeta?.email as string) ?? primaryMember?.email ?? 'primary@example.com'
  const demoClientPhone = (journeyClientMeta?.phone as string) ?? primaryMember?.phone ?? '(555) 010-0199'
  const demoClientDob =
    (primaryMember?.dob && formatDate(primaryMember.dob))
    ?? (journeyClientMeta?.dob ? formatDate(journeyClientMeta.dob as string) : 'Jan 15, 1985')

  const visibleParties = state.relatedParties.filter((p) => !p.isHidden)
  const householdMembers = visibleParties.filter((p) => p.type === 'household_member')
  const orgLikeParties = visibleParties.filter(
    (p) => p.type === 'related_organization' || (p.type === 'related_contact' && Boolean(p.organizationName)),
  )
  const relatedContacts = visibleParties.filter(
    (p) => p.type === 'related_contact' && !p.organizationName,
  )
  const professionalContacts = relatedContacts.filter((p) => p.relationshipCategory === 'Professional')
  const relatedIndividuals = relatedContacts.filter((p) => p.relationshipCategory !== 'Professional')
  const trusts = orgLikeParties.filter((p) =>
    (p.entityType ?? '').toLowerCase() === 'trust'
    || (p.role ?? '').toLowerCase() === 'trust'
    || (p.organizationName ?? p.name ?? '').toLowerCase().includes('trust'),
  )
  const otherEntities = orgLikeParties.filter((p) =>
    !(
      (p.entityType ?? '').toLowerCase() === 'trust'
      || (p.role ?? '').toLowerCase() === 'trust'
      || (p.organizationName ?? p.name ?? '').toLowerCase().includes('trust')
    ),
  )

  const acctChildren = state.tasks
    .filter((t) => isOpenAccountsTask(t))
    .flatMap((t) => (t.children ?? []).filter((c) => c.childType === 'account-opening'))

  const totalValue = state.financialAccounts.reduce((sum, a) => {
    const num = parseFloat((a.estimatedValue ?? '').replace(/,/g, ''))
    return isNaN(num) ? sum : sum + num
  }, 0)

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">Home Office Review</h2>
          <p className="text-sm text-muted-foreground">
            Submission from {clientName} — received at {state.submittedAt ?? 'N/A'}. Expand each section to review.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40 px-4 py-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Submission payload complete</p>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-200/70">
                {HO_REVIEW_API_SYNC}. Review for policy and approve or reject at the bottom.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <AccordionSection title="Client Information" icon={Users} defaultOpen>
            <dl className="space-y-0">
              <ReviewRow label="Name" value={clientName} />
              <ReviewRow label="Email" value={demoClientEmail} />
              <ReviewRow label="Phone" value={demoClientPhone} />
              <ReviewRow label="Date of Birth" value={demoClientDob} />
              <ReviewRow
                label="Client Type"
                value={clientTypeLabels[(journeyClientMeta?.clientType as string) ?? ''] ?? 'Individual'}
              />
            </dl>
          </AccordionSection>

          <AccordionSection
            title={`Related Parties (${visibleParties.length})`}
            icon={Users}
            badge={
              <Badge variant="secondary" className="text-[10px]">
                {householdMembers.length} household · {relatedIndividuals.length} related · {trusts.length + otherEntities.length} entities · {professionalContacts.length} professional
              </Badge>
            }
          >
            {householdMembers.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Household</p>
                {householdMembers.map((p) => <PartyDetail key={p.id} party={p} />)}
              </div>
            )}
            {relatedIndividuals.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Related Individuals</p>
                {relatedIndividuals.map((p) => <PartyDetail key={p.id} party={p} />)}
              </div>
            )}
            {trusts.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Trusts</p>
                {trusts.map((p) => <PartyDetail key={p.id} party={p} />)}
              </div>
            )}
            {otherEntities.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Other Entities</p>
                {otherEntities.map((p) => <PartyDetail key={p.id} party={p} />)}
              </div>
            )}
            {professionalContacts.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Professional Contacts</p>
                {professionalContacts.map((p) => <PartyDetail key={p.id} party={p} />)}
              </div>
            )}
            {visibleParties.length === 0 && (
              <div className="rounded-md border border-border px-3 py-2 text-sm">
                <span className="font-medium">{clientName}</span>
                <span className="text-muted-foreground"> — primary applicant (household record)</span>
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            title={`Existing Accounts (${state.financialAccounts.length})`}
            icon={CreditCard}
            badge={totalValue > 0 ? (
              <Badge variant="secondary" className="text-[10px] tabular-nums">
                ${totalValue.toLocaleString()}
              </Badge>
            ) : undefined}
          >
            {state.financialAccounts.length > 0 ? (
              <div className="space-y-2">
                {state.financialAccounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 text-sm border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.accountName}</span>
                      {a.accountType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {accountTypeLabels[a.accountType]}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {a.custodian && <span>{a.custodian}</span>}
                      {a.estimatedValue && <span className="tabular-nums font-medium text-foreground">${a.estimatedValue}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between py-2 text-sm border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-medium">External holdings (aggregated)</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Brokerage</Badge>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">Demo feed · $0 linked</span>
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="KYC Verification" icon={Shield}>
            {householdMembers.length > 0 ? (
              <div className="space-y-1">
                {householdMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{m.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
                      Verified · CIP API
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{clientName}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
                  Verified · CIP API
                </Badge>
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            title={`Accounts to Open (${acctChildren.length})`}
            icon={Building2}
          >
            {acctChildren.length > 0 ? (
              <div className="space-y-1">
                {acctChildren.map((child) => (
                  <div key={child.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{child.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
                      Submitted · ready for HO
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No account-opening slots in this submission (demo assumes payload complete when present).
              </p>
            )}
            {typeof openAccountsData.additionalInstructions === 'string' && openAccountsData.additionalInstructions && (
              <div className="pt-3 mt-3 border-t border-border">
                <ReviewRow label="Instructions" value={openAccountsData.additionalInstructions as string} />
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="Documents & Signatures" icon={FileText}>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{HO_REVIEW_API_SYNC}</p>
              <div className="space-y-2">
                {HO_DEMO_DOCUMENTS.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">{doc.detail}</div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 bg-green-100 text-green-800 border-green-200">
                      Verified
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">DocuSign envelope CLOSED · all signers completed</p>
            </div>
          </AccordionSection>

          <AccordionSection title="Advisor Confirmations" icon={ClipboardCheck}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox id="ho-terms" checked={!!advisorConfirmations.termsAccepted} disabled />
                <Label htmlFor="ho-terms" className="text-sm">Information Accurate</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="ho-reg" checked={!!advisorConfirmations.regulatoryAccepted} disabled />
                <Label htmlFor="ho-reg" className="text-sm">Regulatory Disclosures</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="ho-data" checked={!!advisorConfirmations.dataConsent} disabled />
                <Label htmlFor="ho-data" className="text-sm">Data Processing Consent</Label>
              </div>
            </div>
          </AccordionSection>
        </div>
      </div>
    </main>
  )
}
