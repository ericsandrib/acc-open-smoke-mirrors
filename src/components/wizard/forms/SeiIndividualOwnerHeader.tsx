import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, AlertCircle, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SEI_FORM_LABELS,
  SEI_INVESTMENT_PROGRAMS,
  getSeiAccountType,
  type SeiForm,
} from '@/data/sei/seiAccountTypes'

interface MrdcField {
  label: string
  apiField: string
  value: string
  present: boolean
}

interface SeiIndividualOwnerHeaderProps {
  seiAccountType: string
  firmCode: string
  advisorId: string
  investmentProgramId: string
  onChangeInvestmentProgram: (id: string) => void
  accountNumber: string
  ownerPresent: boolean
  ownerName: string
  ownerTaxId: string
  mrdcSubmitted: boolean
  onSendMrdc: () => void
  headerClass: string
  titleClass: string
  bodyClass: string
  cardClass?: string
}

export function SeiIndividualOwnerHeader({
  seiAccountType,
  firmCode,
  advisorId,
  investmentProgramId,
  onChangeInvestmentProgram,
  accountNumber,
  ownerPresent,
  ownerName,
  ownerTaxId,
  mrdcSubmitted,
  onSendMrdc,
  headerClass,
  titleClass,
  bodyClass,
  cardClass,
}: SeiIndividualOwnerHeaderProps) {
  const seiType = getSeiAccountType(seiAccountType)
  const activeForm: SeiForm = seiType?.form ?? 'individual-owner'
  const accountTypeLabel = seiType?.label ?? seiAccountType
  const programLabel =
    SEI_INVESTMENT_PROGRAMS.find((p) => p.id === investmentProgramId)?.label ?? ''

  // The four MRDC-required fields (SEI account-creation API) + the primary owner identifier.
  const mrdcFields: MrdcField[] = [
    { label: 'Firm', apiField: 'swpFirmId', value: firmCode, present: !!firmCode },
    { label: 'Account type', apiField: 'accountTypeId', value: accountTypeLabel, present: !!seiAccountType },
    { label: 'Investment program', apiField: 'investmentProgramId', value: programLabel, present: !!investmentProgramId },
    { label: 'Advisor', apiField: 'primaryAdvisorId', value: advisorId, present: !!advisorId },
    { label: 'Primary owner', apiField: 'primaryOwner*', value: ownerName || '—', present: ownerPresent },
  ]
  const allPresent = mrdcFields.every((f) => f.present)

  const payload = {
    source: 'EXTERNAL_API',
    accounts: [
      {
        swpFirmId: firmCode || null,
        accountTypeId: `«${accountTypeLabel}»`,
        investmentProgramId: investmentProgramId || null,
        primaryAdvisorId: advisorId || null,
        primaryOwnerFirstName: ownerName.split(' ')[0] || null,
        primaryOwnerLastName: ownerName.split(' ').slice(1).join(' ') || null,
        primaryOwnerTaxId: ownerTaxId || null,
      },
    ],
  }

  return (
    <div className={cn('space-y-6', cardClass)}>
      {/* SEI form identity + form selector */}
      <div>
        <div className={headerClass}>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className={titleClass}>SEI Custody · Account Opening Form</h3>
          </div>
          <p className={bodyClass}>
            Fields below map to SEI&rsquo;s account-opening form for this registration. Only the Individual-Owner form is
            live in this demo.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">SEI form</Label>
            <Select value={activeForm} disabled>
              <SelectTrigger className="h-9 w-full text-left [&>span]:text-left">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual-owner">{SEI_FORM_LABELS['individual-owner']}</SelectItem>
                <SelectItem value="inherited-ira" disabled>
                  {SEI_FORM_LABELS['inherited-ira']} · Coming soon
                </SelectItem>
                <SelectItem value="organization" disabled>
                  {SEI_FORM_LABELS['organization']} · Coming soon
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Account type: {accountTypeLabel}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Investment program</Label>
            <Select value={investmentProgramId || undefined} onValueChange={onChangeInvestmentProgram}>
              <SelectTrigger className="h-9 w-full text-left [&>span]:line-clamp-2 [&>span]:text-left">
                <SelectValue placeholder="Select investment program…" />
              </SelectTrigger>
              <SelectContent>
                {SEI_INVESTMENT_PROGRAMS.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="whitespace-normal">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* MRDC — Minimal Required Data Capture → SEI issues the account number */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Account Overview · MRDC</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Minimal Required Data Capture. SEI&rsquo;s account-creation API issues a pending account number from these
              four required fields plus the primary owner.
            </p>
          </div>
          {mrdcSubmitted ? (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              Draft — Pending
            </span>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {mrdcFields.map((f) => (
            <div key={f.apiField} className="flex items-center gap-2 text-sm">
              {f.present ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
              <span className="text-muted-foreground">{f.label}:</span>
              <span className="font-medium truncate">{f.present ? f.value : 'Required'}</span>
            </div>
          ))}
        </div>

        {mrdcSubmitted ? (
          <div className="space-y-3">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                Pending account created in SEI DAO.{' '}
                <span className="font-semibold tabular-nums">Account #{accountNumber || 'pending'}</span> · Draft status.
              </p>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View API request — POST /accounts/external
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background p-3 text-[11px] leading-relaxed">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <Button size="sm" onClick={onSendMrdc} disabled={!allPresent}>
            Send minimum data to SEI (MRDC)
          </Button>
        )}
      </div>
    </div>
  )
}
