import { useEffect, useRef, useState } from 'react'
import { useWorkflow, useTaskData, useChildActionContext } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Lock } from 'lucide-react'
import { householdRelationships, householdRoles } from './AddPartySheet'

const ID_TYPES = ['Driver\'s License', 'Passport', 'State ID', 'Military ID'] as const
const sectionCls = 'text-sm font-semibold text-foreground'
const fieldCls = 'text-xs font-medium text-foreground'

export function KycChildInfoForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateFields, updateField } = useTaskData(taskId || '__no_child__')
  const prePopulated = useRef(false)

  const child = ctx?.child ?? null

  const party = child
    ? state.relatedParties.find((p) => p.name === child.name)
    : null

  useEffect(() => {
    if (party && !prePopulated.current && Object.keys(data).length === 0) {
      prePopulated.current = true
      const ext = party.accountOwnerIndividual ?? {}
      updateFields({
        firstName: party.firstName ?? '',
        lastName: party.lastName ?? '',
        middleName: ext.middleName ?? '',
        suffix: ext.suffix ?? '',
        dob: party.dob ?? '',
        taxId: party.taxId ?? '',
        relationship: party.relationship ?? '',
        role: party.role ?? '',
        email: party.email ?? '',
        phone: party.phone ?? '',
        legalStreet: ext.legalStreet ?? '',
        legalApt: ext.legalApt ?? '',
        legalCity: ext.legalCity ?? '',
        legalState: ext.legalState ?? '',
        legalZip: ext.legalZip ?? '',
        legalCountry: ext.legalCountry ?? '',
        mailingSameAsLegal: ext.mailingSameAsLegal !== false ? 'true' : 'false',
        mailingStreet: ext.mailingStreet ?? '',
        mailingCity: ext.mailingCity ?? '',
        mailingState: ext.mailingState ?? '',
        mailingZip: ext.mailingZip ?? '',
        mailingCountry: ext.mailingCountry ?? '',
        idType: '',
        idNumber: '',
        idState: '',
        idExpiration: '',
        employmentStatus: ext.employmentStatus ?? '',
        employerName: ext.employerName ?? '',
        occupation: ext.occupation ?? '',
        industry: ext.industry ?? '',
      })
    }
  }, [party, data, updateFields])

  if (!child) return null

  const isLocked = child.status === 'awaiting_review' || child.status === 'complete' || child.status === 'rejected'
  const str = (key: string) => (data[key] as string) ?? ''
  const mailingSame = str('mailingSameAsLegal') !== 'false'

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
              This submission is under review. Fields are locked and cannot be edited.
            </p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Personal Information</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>First name</Label>
            <Input value={str('firstName')} onChange={(e) => updateField('firstName', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Middle name</Label>
            <Input value={str('middleName')} onChange={(e) => updateField('middleName', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Last name</Label>
            <Input value={str('lastName')} onChange={(e) => updateField('lastName', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Suffix</Label>
            <Select value={str('suffix') || '__none__'} onValueChange={(v) => updateField('suffix', v === '__none__' ? '' : v)} disabled={isLocked}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {(['Jr.', 'Sr.', 'II', 'III', 'IV', 'Esq.'] as const).map((x) => (
                  <SelectItem key={x} value={x}>{x}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Date of birth</Label>
            <Input type="date" value={str('dob')} max={new Date().toISOString().split('T')[0]} onChange={(e) => updateField('dob', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>SSN / Tax ID</Label>
            <Input value={str('taxId')} onChange={(e) => updateField('taxId', e.target.value)} placeholder="XXX-XX-XXXX" disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Relationship</Label>
            <Select value={str('relationship') || undefined} onValueChange={(v) => updateField('relationship', v)} disabled={isLocked}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {householdRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Role</Label>
            <Select value={str('role') || undefined} onValueChange={(v) => updateField('role', v)} disabled={isLocked}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Address */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Address</h4>
        <p className="text-xs text-muted-foreground font-medium">Legal (residential) address</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Street</Label>
            <Input value={str('legalStreet')} onChange={(e) => updateField('legalStreet', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Apt / unit</Label>
            <Input value={str('legalApt')} onChange={(e) => updateField('legalApt', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>City</Label>
            <Input value={str('legalCity')} onChange={(e) => updateField('legalCity', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>State</Label>
            <Input value={str('legalState')} onChange={(e) => updateField('legalState', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>ZIP</Label>
            <Input value={str('legalZip')} onChange={(e) => updateField('legalZip', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Country</Label>
            <Input value={str('legalCountry')} onChange={(e) => updateField('legalCountry', e.target.value)} disabled={isLocked} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="kyc-mailing-same"
            checked={mailingSame}
            onChange={(e) => updateField('mailingSameAsLegal', e.target.checked ? 'true' : 'false')}
            className="rounded border-border"
            disabled={isLocked}
          />
          <Label htmlFor="kyc-mailing-same" className="text-sm font-normal cursor-pointer">
            Mailing address is the same as legal address
          </Label>
        </div>

        {!mailingSame && (
          <div className="space-y-3 rounded-md border border-border p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground font-medium">Mailing address</p>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Street</Label>
              <Input value={str('mailingStreet')} onChange={(e) => updateField('mailingStreet', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>City</Label>
              <Input value={str('mailingCity')} onChange={(e) => updateField('mailingCity', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>State</Label>
              <Input value={str('mailingState')} onChange={(e) => updateField('mailingState', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>ZIP</Label>
              <Input value={str('mailingZip')} onChange={(e) => updateField('mailingZip', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Country</Label>
              <Input value={str('mailingCountry')} onChange={(e) => updateField('mailingCountry', e.target.value)} disabled={isLocked} />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className={fieldCls}>Phone</Label>
          <Input type="tel" value={str('phone')} onChange={(e) => updateField('phone', e.target.value)} disabled={isLocked} />
        </div>
        <div className="space-y-1.5">
          <Label className={fieldCls}>Email</Label>
          <Input type="email" value={str('email')} onChange={(e) => updateField('email', e.target.value)} disabled={isLocked} />
        </div>
      </section>

      <hr className="border-border" />

      {/* ID Verification */}
      <section className="space-y-3">
        <h4 className={sectionCls}>ID Verification</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>ID type</Label>
            <Select value={str('idType') || undefined} onValueChange={(v) => updateField('idType', v)} disabled={isLocked}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {ID_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>ID number</Label>
            <Input value={str('idNumber')} onChange={(e) => updateField('idNumber', e.target.value)} placeholder="ID number" disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Issuing state</Label>
            <Input value={str('idState')} onChange={(e) => updateField('idState', e.target.value)} placeholder="e.g. California" disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Expiration date</Label>
            <Input type="date" value={str('idExpiration')} onChange={(e) => updateField('idExpiration', e.target.value)} disabled={isLocked} />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Employment */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Employment</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Employment status</Label>
            <Select value={str('employmentStatus') || undefined} onValueChange={(v) => updateField('employmentStatus', v)} disabled={isLocked}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(['Employed', 'Self-employed', 'Retired', 'Unemployed'] as const).map((x) => (
                  <SelectItem key={x} value={x}>{x}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Employer name</Label>
            <Input value={str('employerName')} onChange={(e) => updateField('employerName', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Occupation</Label>
            <Input value={str('occupation')} onChange={(e) => updateField('occupation', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Industry</Label>
            <Input value={str('industry')} onChange={(e) => updateField('industry', e.target.value)} disabled={isLocked} />
          </div>
        </div>
      </section>
    </div>
  )
}
