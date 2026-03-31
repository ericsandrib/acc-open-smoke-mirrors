import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { AccountType, RelatedParty } from '@/types/workflow'

export function Placeholder1Form() {
  const { data, updateField } = useTaskData('placeholder-1')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input id="accountNumber" placeholder="Auto-generated" disabled className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Branch Code</Label>
        <div className="col-span-2">
          <Select
            value={(data.branchCode as string) ?? ''}
            onValueChange={(v) => updateField('branchCode', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nyc">New York - 001</SelectItem>
              <SelectItem value="lon">London - 002</SelectItem>
              <SelectItem value="zurich">Zurich - 003</SelectItem>
              <SelectItem value="singapore">Singapore - 004</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="rmCode">Relationship Manager Code</Label>
        <Input
          id="rmCode"
          placeholder="RM-0001"
          className="col-span-2"
          value={(data.rmCode as string) ?? ''}
          onChange={(e) => updateField('rmCode', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="onlineBanking">Online Banking Access</Label>
        <div className="col-span-2">
          <Checkbox
            id="onlineBanking"
            checked={!!data.onlineBanking}
            onCheckedChange={(v) => updateField('onlineBanking', v)}
          />
        </div>
      </div>
    </div>
  )
}

const branchLabels: Record<string, string> = {
  nyc: 'New York - 001',
  lon: 'London - 002',
  zurich: 'Zurich - 003',
  singapore: 'Singapore - 004',
}

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
  const clientInfo = state.taskData['client-info'] ?? {}
  const accountSetup = state.taskData['placeholder-1'] ?? {}

  const clientName = [clientInfo.firstName, clientInfo.lastName].filter(Boolean).join(' ')
  const branch = branchLabels[accountSetup.branchCode as string] ?? undefined

  const visibleParties = state.relatedParties.filter((p) => !p.isHidden)
  const householdMembers = visibleParties.filter((p) => p.type === 'household_member')
  const relatedContacts = visibleParties.filter((p) => p.type === 'related_contact')
  const relatedOrgs = visibleParties.filter((p) => p.type === 'related_organization')

  const kycTask = state.tasks.find((t) => t.id === 'kyc-review')
  const kycChildren = kycTask?.children ?? []

  const totalValue = state.financialAccounts.reduce((sum, a) => {
    const num = parseFloat((a.estimatedValue ?? '').replace(/,/g, ''))
    return isNaN(num) ? sum : sum + num
  }, 0)

  return (
    <div className="space-y-5">
      {/* Client Information */}
      <ReviewSection title="Client Information">
        {clientName ? (
          <dl className="space-y-1">
            <ReviewRow label="Name" value={clientName} />
            <ReviewRow label="Email" value={clientInfo.email as string} />
            <ReviewRow label="Phone" value={clientInfo.phone as string} />
            <ReviewRow label="Date of Birth" value={clientInfo.dob ? formatDate(clientInfo.dob as string) : undefined} />
            <ReviewRow label="Client Type" value={clientTypeLabels[clientInfo.clientType as string]} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No client information provided yet.</p>
        )}
      </ReviewSection>

      {/* Related Parties */}
      <ReviewSection title={`Related Parties${visibleParties.length ? ` (${visibleParties.length})` : ''}`}>
        {visibleParties.length > 0 ? (
          <div className="space-y-3">
            {householdMembers.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Household Members</p>
                <div className="divide-y divide-border">
                  {householdMembers.map((p) => <PartyRow key={p.id} party={p} />)}
                </div>
              </div>
            )}
            {relatedContacts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Related Contacts</p>
                <div className="divide-y divide-border">
                  {relatedContacts.map((p) => <PartyRow key={p.id} party={p} />)}
                </div>
              </div>
            )}
            {relatedOrgs.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Organizations</p>
                <div className="divide-y divide-border">
                  {relatedOrgs.map((p) => <PartyRow key={p.id} party={p} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No related parties added.</p>
        )}
      </ReviewSection>

      {/* Financial Accounts */}
      <ReviewSection title={`Financial Accounts${state.financialAccounts.length ? ` (${state.financialAccounts.length})` : ''}`}>
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
                statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              } else if (child?.status === 'complete') {
                statusLabel = 'Verified'
                statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              } else if (child?.status === 'in_progress') {
                statusLabel = 'In Progress'
                statusClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
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

      {/* Account Setup */}
      <ReviewSection title="Account Setup">
        {(branch || accountSetup.rmCode) ? (
          <dl className="space-y-1">
            <ReviewRow label="Branch" value={branch} />
            <ReviewRow label="RM Code" value={accountSetup.rmCode as string} />
            <ReviewRow label="Online Banking" value={accountSetup.onlineBanking ? 'Enabled' : 'Not requested'} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Account setup not completed yet.</p>
        )}
      </ReviewSection>

      {/* Confirmations */}
      <div className="border-t border-border pt-4 space-y-4">
        <p className="text-sm font-semibold">Confirmations</p>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="termsAccepted">Information Accurate</Label>
          <div className="col-span-2">
            <Checkbox
              id="termsAccepted"
              checked={!!data.termsAccepted}
              onCheckedChange={(v) => updateField('termsAccepted', v)}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="regulatoryAccepted">Regulatory Disclosures</Label>
          <div className="col-span-2">
            <Checkbox
              id="regulatoryAccepted"
              checked={!!data.regulatoryAccepted}
              onCheckedChange={(v) => updateField('regulatoryAccepted', v)}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="dataConsent">Data Processing Consent</Label>
          <div className="col-span-2">
            <Checkbox
              id="dataConsent"
              checked={!!data.dataConsent}
              onCheckedChange={(v) => updateField('dataConsent', v)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
