import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SensitiveTaxIdInput } from '@/components/ui/sensitive-tax-id-input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { householdRelationships, householdRoles } from '@/components/wizard/forms/AddPartySheet'
import {
  type IndividualAccountOwnerFormState,
  EMPLOYMENT_STATUSES,
  NAME_SUFFIXES,
  INCOME_RANGES,
  NET_WORTH_RANGES,
  LIQUID_NET_WORTH_RANGES,
  INVESTMENT_OBJECTIVES,
  RISK_TOLERANCES,
  TIME_HORIZONS,
  YES_NO,
  PEP_OPTIONS,
} from '@/types/accountOwnerIndividual'
import { cn } from '@/lib/utils'

const field = 'text-xs font-medium text-foreground'
const sectionTitle = 'text-sm font-semibold text-foreground pt-2'

type Props = {
  value: IndividualAccountOwnerFormState
  onChange: (patch: Partial<IndividualAccountOwnerFormState>) => void
  /** Beneficiaries / interested parties: sections 1–2 only (no employment, suitability, disclosures). */
  variant?: 'full' | 'designation'
}

export function AccountOwnerIndividualFormFields({ value: s, onChange, variant = 'full' }: Props) {
  const mailingLocked = s.mailingSameAsLegal
  const showFullProfile = variant === 'full'

  return (
    <div className="space-y-6">
      {variant === 'designation' && (
        <p className="text-xs text-muted-foreground rounded-md border border-border bg-muted/30 px-3 py-2">
          KYC and full suitability are not required for beneficiaries or interested parties. Identity and contact
          details below are sufficient for typical registration filings.
        </p>
      )}
      <section className="space-y-3">
        <h4 className={sectionTitle}>1) Client information</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label className={field}>First name</Label>
            <Input value={s.firstName} onChange={(e) => onChange({ firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label className={field}>Middle name (optional)</Label>
            <Input value={s.middleName} onChange={(e) => onChange({ middleName: e.target.value })} />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label className={field}>Last name</Label>
            <Input value={s.lastName} onChange={(e) => onChange({ lastName: e.target.value })} />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label className={field}>Suffix</Label>
            <Select
              value={s.suffix || '__none__'}
              onValueChange={(v) => onChange({ suffix: v === '__none__' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {NAME_SUFFIXES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label className={field}>Date of birth</Label>
            <Input
              type="date"
              value={s.dob}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => onChange({ dob: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label className={field}>Tax ID (SSN / TIN)</Label>
            <SensitiveTaxIdInput
              value={s.taxId}
              onChange={(e) => onChange({ taxId: e.target.value })}
              placeholder="XXX-XX-XXXX or XX-XXXXXXX"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className={sectionTitle}>2) Address &amp; contact</h4>
        <p className="text-xs text-muted-foreground font-medium">Legal (residential) address</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={field}>Street</Label>
            <Input value={s.legalStreet} onChange={(e) => onChange({ legalStreet: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Apt / unit</Label>
            <Input value={s.legalApt} onChange={(e) => onChange({ legalApt: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className={field}>City</Label>
              <Input value={s.legalCity} onChange={(e) => onChange({ legalCity: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className={field}>State</Label>
              <Input value={s.legalState} onChange={(e) => onChange({ legalState: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className={field}>ZIP</Label>
              <Input value={s.legalZip} onChange={(e) => onChange({ legalZip: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className={field}>Country</Label>
              <Input value={s.legalCountry} onChange={(e) => onChange({ legalCountry: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="mailing-same"
            checked={s.mailingSameAsLegal}
            onCheckedChange={(c) => onChange({ mailingSameAsLegal: c === true })}
          />
          <Label htmlFor="mailing-same" className="text-sm font-normal cursor-pointer">
            Mailing address is the same as legal address
          </Label>
        </div>

        {!mailingLocked && (
          <div className="space-y-3 rounded-md border border-border p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground font-medium">Mailing address (if different)</p>
            <div className="space-y-1.5">
              <Label className={field}>Street</Label>
              <Input value={s.mailingStreet} onChange={(e) => onChange({ mailingStreet: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className={field}>Apt / unit</Label>
              <Input value={s.mailingApt} onChange={(e) => onChange({ mailingApt: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className={field}>City</Label>
                <Input value={s.mailingCity} onChange={(e) => onChange({ mailingCity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className={field}>State</Label>
                <Input value={s.mailingState} onChange={(e) => onChange({ mailingState: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className={field}>ZIP</Label>
                <Input value={s.mailingZip} onChange={(e) => onChange({ mailingZip: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className={field}>Country</Label>
                <Input value={s.mailingCountry} onChange={(e) => onChange({ mailingCountry: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={field}>Phone number</Label>
            <Input type="tel" value={s.phone} onChange={(e) => onChange({ phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Email address</Label>
            <Input type="email" value={s.email} onChange={(e) => onChange({ email: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={field}>Relationship</Label>
            <Select value={s.relationship || undefined} onValueChange={(v) => onChange({ relationship: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {householdRelationships.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Role</Label>
            <Select value={s.role || undefined} onValueChange={(v) => onChange({ role: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {householdRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {showFullProfile && (
        <>
      <Separator />

      <section className="space-y-3">
        <h4 className={sectionTitle}>3) Employment information</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={field}>Employment status</Label>
            <Select
              value={s.employmentStatus || undefined}
              onValueChange={(v) => onChange({ employmentStatus: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_STATUSES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Employer name</Label>
            <Input value={s.employerName} onChange={(e) => onChange({ employerName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Occupation / job title</Label>
            <Input value={s.occupation} onChange={(e) => onChange({ occupation: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Industry</Label>
            <Input value={s.industry} onChange={(e) => onChange({ industry: e.target.value })} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className={sectionTitle}>4) Financial information (suitability)</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={field}>Annual income (range)</Label>
            <Select
              value={s.annualIncomeRange || undefined}
              onValueChange={(v) => onChange({ annualIncomeRange: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {INCOME_RANGES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Net worth (range)</Label>
            <Select
              value={s.netWorthRange || undefined}
              onValueChange={(v) => onChange({ netWorthRange: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {NET_WORTH_RANGES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Liquid net worth (range)</Label>
            <Select
              value={s.liquidNetWorthRange || undefined}
              onValueChange={(v) => onChange({ liquidNetWorthRange: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {LIQUID_NET_WORTH_RANGES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className={field}>Source of funds / wealth</Label>
          <textarea
            className={cn(
              'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            )}
            value={s.sourceOfFunds}
            onChange={(e) => onChange({ sourceOfFunds: e.target.value })}
            placeholder="Describe sources (e.g. salary, sale of business, inheritance)"
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className={sectionTitle}>5) Investment profile</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={field}>Investment objective</Label>
            <Select
              value={s.investmentObjective || undefined}
              onValueChange={(v) => onChange({ investmentObjective: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_OBJECTIVES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Risk tolerance</Label>
            <Select
              value={s.riskTolerance || undefined}
              onValueChange={(v) => onChange({ riskTolerance: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {RISK_TOLERANCES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className={field}>Time horizon</Label>
            <Select value={s.timeHorizon || undefined} onValueChange={(v) => onChange({ timeHorizon: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {TIME_HORIZONS.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className={field}>Investment experience</Label>
          <textarea
            className={cn(
              'flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            )}
            value={s.investmentExperience}
            onChange={(e) => onChange({ investmentExperience: e.target.value })}
            placeholder="e.g. stocks, bonds, options, alternatives"
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className={sectionTitle}>6) Regulatory disclosures</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={field}>Control person of a public company</Label>
            <Select
              value={s.controlPerson || undefined}
              onValueChange={(v) => onChange({ controlPerson: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {YES_NO.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Affiliation with broker-dealer / FINRA member</Label>
            <Select
              value={s.bdAffiliation || undefined}
              onValueChange={(v) => onChange({ bdAffiliation: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {YES_NO.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className={field}>Immediate family affiliation (if applicable)</Label>
          <Input
            value={s.familyAffiliation}
            onChange={(e) => onChange({ familyAffiliation: e.target.value })}
            placeholder="Describe or enter N/A"
          />
        </div>
        <div className="space-y-1.5">
          <Label className={field}>Politically exposed person (PEP)</Label>
          <Select value={s.pep || undefined} onValueChange={(v) => onChange({ pep: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {PEP_OPTIONS.map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className={field}>Insider / Rule 144 status</Label>
          <Input
            value={s.insiderRule144}
            onChange={(e) => onChange({ insiderRule144: e.target.value })}
            placeholder="Describe or N/A"
          />
        </div>

        <p className="text-xs font-medium text-muted-foreground pt-2">Trusted contact person</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-md border border-border p-3 bg-muted/20">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className={field}>Name</Label>
            <Input value={s.trustedContactName} onChange={(e) => onChange({ trustedContactName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Relationship</Label>
            <Input
              value={s.trustedContactRelationship}
              onChange={(e) => onChange({ trustedContactRelationship: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={field}>Phone / email</Label>
            <Input
              value={s.trustedContactPhoneEmail}
              onChange={(e) => onChange({ trustedContactPhoneEmail: e.target.value })}
            />
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  )
}
