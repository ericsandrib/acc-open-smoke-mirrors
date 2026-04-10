import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import type { AccountType, RelatedParty } from '@/types/workflow'

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

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4 bg-muted/50 space-y-3">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  )
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

function PartyRow({ party }: { party: RelatedParty }) {
  const name = party.type === 'related_organization'
    ? (party.organizationName ?? party.name)
    : party.name
  const details = [party.relationship, party.role].filter(Boolean).join(' / ')

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <div className="flex items-center gap-2">
        <span>{name}</span>
        {party.isPrimary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Primary</Badge>}
      </div>
      <span className="text-muted-foreground text-xs">{details}</span>
    </div>
  )
}

export function Placeholder2Form() {
  const { state } = useWorkflow()
  const { data, updateField } = useTaskData('placeholder-2')
  const journeyClientMeta = state.taskData['client-info'] as Record<string, unknown> | undefined
  const review = state.reviewState
  const isReadOnly = review?.reviewStatus === 'pending' || review?.reviewStatus === 'accepted'
  const openAccountsData = state.taskData['open-accounts'] ?? {}

  const primaryMember =
    state.relatedParties.find((p) => p.type === 'household_member' && p.isPrimary && !p.isHidden)
    ?? state.relatedParties.find((p) => p.type === 'household_member' && !p.isHidden)

  const clientName =
    primaryMember?.name
    ?? [primaryMember?.firstName, primaryMember?.lastName].filter(Boolean).join(' ')
    ?? [journeyClientMeta?.firstName, journeyClientMeta?.lastName].filter(Boolean).join(' ')

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

  const kycParentTask = state.tasks.find((t) => t.formKey === 'kyc') ?? state.tasks.find((t) => t.formKey === 'open-accounts')
  const kycChildren = kycParentTask?.children?.filter((c) => c.childType === 'kyc') ?? []

  const openAccountsTask = state.tasks.find((t) => t.id === 'open-accounts')
  const acctChildren = openAccountsTask?.children ?? []

  const totalValue = state.financialAccounts.reduce((sum, a) => {
    const num = parseFloat((a.estimatedValue ?? '').replace(/,/g, ''))
    return isNaN(num) ? sum : sum + num
  }, 0)

  return (
    <div className="space-y-5">
      {review?.reviewStatus === 'rejected' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-red-800">Submission Rejected by Home Office</p>
          {review.rejectionReason && (
            <p className="text-sm text-red-700">
              <span className="font-medium">Reason:</span> {review.rejectionReason}
            </p>
          )}
          {review.rejectionFeedback && (
            <p className="text-sm text-red-700">
              <span className="font-medium">Feedback:</span> {review.rejectionFeedback}
            </p>
          )}
          <p className="text-xs text-red-600 mt-1">
            Please address the issues above and resubmit for review.
          </p>
        </div>
      )}

      {/* Client Information */}
      <ReviewSection title="Client Information">
        {clientName ? (
          <dl className="space-y-1">
            <ReviewRow label="Name" value={clientName} />
            <ReviewRow label="Email" value={(primaryMember?.email ?? journeyClientMeta?.email) as string} />
            <ReviewRow label="Phone" value={(primaryMember?.phone ?? journeyClientMeta?.phone) as string} />
            <ReviewRow
              label="Date of Birth"
              value={
                primaryMember?.dob
                  ? formatDate(primaryMember.dob)
                  : journeyClientMeta?.dob
                    ? formatDate(journeyClientMeta.dob as string)
                    : undefined
              }
            />
            <ReviewRow
              label="Client Type"
              value={clientTypeLabels[(journeyClientMeta?.clientType as string) ?? '']}
            />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No client information provided yet.</p>
        )}
      </ReviewSection>

      <ReviewSection title={`Client Info${visibleParties.length ? ` (${visibleParties.length})` : ''}`}>
        {visibleParties.length > 0 ? (
          <div className="space-y-3">
            {householdMembers.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Household</p>
                <div className="divide-y divide-border">
                  {householdMembers.map((p) => <PartyRow key={p.id} party={p} />)}
                </div>
              </div>
            )}
            {relatedIndividuals.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Related Individuals</p>
                <div className="divide-y divide-border">
                  {relatedIndividuals.map((p) => <PartyRow key={p.id} party={p} />)}
                </div>
              </div>
            )}
            {trusts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Trusts</p>
                <div className="divide-y divide-border">
                  {trusts.map((p) => <PartyRow key={p.id} party={p} />)}
                </div>
              </div>
            )}
            {otherEntities.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Other Entities</p>
                <div className="divide-y divide-border">
                  {otherEntities.map((p) => <PartyRow key={p.id} party={p} />)}
                </div>
              </div>
            )}
            {professionalContacts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Professional Contacts</p>
                <div className="divide-y divide-border">
                  {professionalContacts.map((p) => <PartyRow key={p.id} party={p} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No related parties added.</p>
        )}
      </ReviewSection>

      <ReviewSection title={`Existing Accounts${state.financialAccounts.length ? ` (${state.financialAccounts.length})` : ''}`}>
        {state.financialAccounts.length > 0 ? (
          <div className="space-y-2">
            {state.financialAccounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-1.5 text-sm border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span>{a.accountName}</span>
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
            {totalValue > 0 && (
              <div className="flex justify-between pt-2 text-sm font-medium">
                <span>Total Estimated Value</span>
                <span className="tabular-nums">${totalValue.toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No financial accounts added.</p>
        )}
      </ReviewSection>

      {/* KYC Verification */}
      <ReviewSection title="KYC Verification">
        {householdMembers.length > 0 ? (
          <div className="space-y-1">
            {householdMembers.map((m) => {
              const child = kycChildren.find((c) => c.name === m.name)
              let statusLabel = 'Pending'
              let statusClass = 'bg-muted text-muted-foreground'
              if (m.kycStatus === 'verified') {
                statusLabel = 'Verified'
                statusClass = 'bg-fill-success-tertiary text-text-success-primary'
              } else if (child?.status === 'complete') {
                statusLabel = 'Verified'
                statusClass = 'bg-fill-success-tertiary text-text-success-primary'
              } else if (child?.status === 'in_progress') {
                statusLabel = 'In Progress'
                statusClass = 'bg-fill-warning-tertiary text-text-warning-primary'
              }
              return (
                <div key={m.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{m.name}</span>
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${statusClass}`}>
                    {statusLabel}
                  </Badge>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No household members for KYC verification.</p>
        )}
      </ReviewSection>

      {/* Account Opening */}
      <ReviewSection title={`Accounts to Open${acctChildren.length ? ` (${acctChildren.length})` : ''}`}>
        {acctChildren.length > 0 ? (
          <div className="space-y-1">
            {acctChildren.map((child) => {
              let statusLabel = 'Not Started'
              let statusClass = 'bg-muted text-muted-foreground'
              if (child.status === 'complete') {
                statusLabel = 'Complete'
                statusClass = 'bg-fill-success-tertiary text-text-success-primary'
              } else if (child.status === 'in_progress') {
                statusLabel = 'In Progress'
                statusClass = 'bg-fill-warning-tertiary text-text-warning-primary'
              }
              return (
                <div key={child.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{child.name}</span>
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${statusClass}`}>
                    {statusLabel}
                  </Badge>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No accounts to open selected yet.</p>
        )}
        {typeof openAccountsData.additionalInstructions === 'string' && openAccountsData.additionalInstructions && (
          <div className="pt-2 border-t border-border">
            <ReviewRow label="Instructions" value={openAccountsData.additionalInstructions as string} />
          </div>
        )}
      </ReviewSection>

      {/* Confirmations */}
      <div className="border-t border-border pt-4 space-y-4">
        <p className="text-sm font-semibold">Confirmations</p>
        <div className="flex items-center gap-3">
          <Checkbox
            id="termsAccepted"
            checked={!!data.termsAccepted}
            onCheckedChange={(v) => updateField('termsAccepted', v)}
            disabled={isReadOnly}
          />
          <Label htmlFor="termsAccepted">Information Accurate</Label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="regulatoryAccepted"
            checked={!!data.regulatoryAccepted}
            onCheckedChange={(v) => updateField('regulatoryAccepted', v)}
            disabled={isReadOnly}
          />
          <Label htmlFor="regulatoryAccepted">Regulatory Disclosures</Label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="dataConsent"
            checked={!!data.dataConsent}
            onCheckedChange={(v) => updateField('dataConsent', v)}
            disabled={isReadOnly}
          />
          <Label htmlFor="dataConsent">Data Processing Consent</Label>
        </div>
      </div>
    </div>
  )
}
