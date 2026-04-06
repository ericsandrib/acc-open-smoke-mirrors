import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { registrationTypeLabels } from '@/utils/registrationDocuments'
import { getAccountProductTypeForRegistration } from '@/utils/accountTypeFromRegistration'
import { PROTOTYPE_AGENT_CODES } from '@/constants/prototypeAgent'

const accountProductLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  checking: 'Checking',
  savings: 'Savings',
}

type TaskData = Record<string, unknown>
type UpdateField = (key: string, value: unknown) => void

const yesNo = ['Yes', 'No'] as const

const institutionAcctOptions = [
  { value: 'Bank / Savings & Loan / Insurance Company / Registered Investment Company', label: 'Bank / S&L / Insurance / RIC' },
  { value: 'Investment Advisor', label: 'Investment Advisor' },
  { value: 'Other Entity', label: 'Other Entity' },
  { value: 'Non-Institutional', label: 'Non-Institutional' },
] as const

const initialFundsOptions = [
  'Alimony',
  'Accounts Receivable',
  'Accumulated Savings',
  'Fund Investors',
  'Income from Earnings',
  'Fees/Commissions',
  'Gift',
  'Inheritance',
  'Investment Proceeds',
  'Insurance Proceeds',
  'Legal Settlement',
  'Other',
  'Pension/IRA/Retirement Savings',
  'Rollover',
  'Sale of Business',
  'Sale of Real Estate',
  'Unknown',
] as const

interface AccountShellSectionProps {
  data: TaskData
  updateField: UpdateField
  /** Legal/registration structure — drives default product account type when not overridden. */
  registrationType: RegistrationType | null
  /** Optional explicit product override (e.g. from custody); otherwise derived from registration. */
  productAccountTypeOverride?: AccountType | null
  /** Set on the child when the account is created (read-only). */
  prefilledShortName: string
  prefilledAccountNumber: string
}

interface AccountAdditionalInformationSectionProps {
  data: TaskData
  updateField: UpdateField
}

export function AccountShellSection({
  data,
  updateField,
  registrationType,
  productAccountTypeOverride,
  prefilledShortName,
  prefilledAccountNumber,
}: AccountShellSectionProps) {
  const resolvedProduct =
    productAccountTypeOverride ?? getAccountProductTypeForRegistration(registrationType)
  const accountTypeLabel = accountProductLabels[resolvedProduct]

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Account shell
          </h3>
          <p className="text-sm text-muted-foreground">
            Account-level context aligned to custody intake. Per-owner tax ID and addresses are captured in{' '}
            <span className="font-medium text-foreground">View / edit details</span> on each owner card.
          </p>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label>Account type</Label>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground font-medium">
              {accountTypeLabel}
            </div>
            <p className="text-xs text-muted-foreground">
              {productAccountTypeOverride
                ? 'Explicit product type on this account.'
                : 'Derived from registration type (e.g. brokerage for most registrations, trust for trust or estate).'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Registration type</Label>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
              {registrationType ? registrationTypeLabels[registrationType] : '—'}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Office code</Label>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground tabular-nums font-medium">
              {PROTOTYPE_AGENT_CODES.officeCode}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Team code</Label>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground tabular-nums font-medium">
              {PROTOTYPE_AGENT_CODES.teamCode}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Advisor code</Label>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground tabular-nums font-medium">
              {PROTOTYPE_AGENT_CODES.advisorCode}
            </div>
            <p className="text-xs text-muted-foreground">
              Prototype values from agent profile ({PROTOTYPE_AGENT_CODES.agentName}).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Short name</Label>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground font-mono">
              {prefilledShortName || '—'}
            </div>
            <p className="text-xs text-muted-foreground">Assigned when this account was added.</p>
          </div>

          <div className="space-y-2">
            <Label>Account number</Label>
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground tabular-nums font-medium">
              {prefilledAccountNumber || '—'}
            </div>
            <p className="text-xs text-muted-foreground">Assigned when this account was added.</p>
          </div>

          <div className="space-y-2">
            <Label>Account title / display name</Label>
            <Input
              value={(data.displayTitle as string) ?? ''}
              onChange={(e) => updateField('displayTitle', e.target.value)}
              placeholder="As it should appear on statements"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export function AccountAdditionalInformationSection({ data, updateField }: AccountAdditionalInformationSectionProps) {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Additional account information
          </h3>
          <p className="text-sm text-muted-foreground">
            Fields commonly collected at account open (schema-style names for integration).
          </p>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label>Correspondent number</Label>
            <Input
              className="tabular-nums"
              value={(data.correspondentNumber as string) ?? ''}
              onChange={(e) => updateField('correspondentNumber', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Retail investor indicator</Label>
            <Select
              value={(data.retailInvestorIndicator as string) ?? ''}
              onValueChange={(v) => updateField('retailInvestorIndicator', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Account is for an individual">Account is for an individual</SelectItem>
                <SelectItem value="Account is for an entity">Account is for an entity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Institution account code</Label>
            <Select
              value={(data.institutionAcctCode as string) ?? 'Investment Advisor'}
              onValueChange={(v) => updateField('institutionAcctCode', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {institutionAcctOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Initial funds code</Label>
            <Select
              value={(data.initialFundsCode as string) ?? ''}
              onValueChange={(v) => updateField('initialFundsCode', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source…" />
              </SelectTrigger>
              <SelectContent>
                {initialFundsOptions.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Foreign bank account indicator</Label>
            <Select
              value={(data.foreignBankAccountIndicator as string) ?? 'No'}
              onValueChange={(v) => updateField('foreignBankAccountIndicator', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yesNo.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Non-U.S. official indicator</Label>
            <Select
              value={(data.nonUsOfficialIndicator as string) ?? 'No'}
              onValueChange={(v) => updateField('nonUsOfficialIndicator', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yesNo.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Private bank account indicator</Label>
            <Select
              value={(data.privateBankAccountIndicator as string) ?? 'No'}
              onValueChange={(v) => updateField('privateBankAccountIndicator', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yesNo.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Central bank account indicator</Label>
            <Select
              value={(data.centralBankAccountIndicator as string) ?? 'No'}
              onValueChange={(v) => updateField('centralBankAccountIndicator', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yesNo.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Investment objectives</Label>
            <Select
              value={(data.investmentObjectives as string) ?? ''}
              onValueChange={(v) => updateField('investmentObjectives', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aggressive Growth / Speculation">Aggressive Growth / Speculation</SelectItem>
                <SelectItem value="Growth / Capital Appreciation">Growth / Capital Appreciation</SelectItem>
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Preservation of Capital">Preservation of Capital</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Risk factor</Label>
            <Select
              value={(data.riskFactor as string) ?? ''}
              onValueChange={(v) => updateField('riskFactor', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Speculation">Speculation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Investment liquidity needs</Label>
            <Select
              value={(data.invLiquidityNeedsCode as string) ?? ''}
              onValueChange={(v) => updateField('invLiquidityNeedsCode', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Account funding date</Label>
            <Input
              type="date"
              value={(data.accountFundingDate as string) ?? ''}
              onChange={(e) => updateField('accountFundingDate', e.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
