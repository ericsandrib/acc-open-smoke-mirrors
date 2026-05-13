import {
  SchwabFieldRow,
  SchwabTextField,
  SchwabRadioGroup,
  SchwabCheckboxGroup,
  SchwabSingleCheckbox,
  SchwabSection,
  RELATIONSHIP_OPTIONS,
  ID_TYPE_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  OCCUPATION_OPTIONS,
  YES_NO,
  SOURCE_OF_FUNDS_OPTIONS,
  PURPOSE_OF_ACCOUNT_OPTIONS,
} from './schwabPrimitives'
import type { useSchwabFormState } from './useSchwabFormState'

type FormApi = ReturnType<typeof useSchwabFormState>

/** Investment Advisor cover section — appears at the top of every Schwab native form. */
export function IaCoverSection({ form }: { form: FormApi }) {
  return (
    <SchwabSection
      title="Investment Advisor information"
      description="For Schwab Use Only. Most fields are pre-populated from the selected advisor."
    >
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="IA firm name"
          value={form.get('advisorFirmName')}
          onChange={(v) => form.set('advisorFirmName', v)}
        />
        <SchwabTextField
          label="IA master account number"
          value={form.get('advisorMasterAccountNumber')}
          onChange={(v) => form.set('advisorMasterAccountNumber', v)}
        />
      </SchwabFieldRow>
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="Service team"
          value={form.get('advisorServiceTeam')}
          onChange={(v) => form.set('advisorServiceTeam', v)}
        />
        <SchwabTextField
          label="IA contact name"
          value={form.get('advisorContactName')}
          onChange={(v) => form.set('advisorContactName', v)}
        />
      </SchwabFieldRow>
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="IA telephone number"
          type="tel"
          value={form.get('advisorTelephoneNumber')}
          onChange={(v) => form.set('advisorTelephoneNumber', v)}
        />
        <SchwabTextField
          label="IA email address"
          type="email"
          value={form.get('advisorEmailAddress')}
          onChange={(v) => form.set('advisorEmailAddress', v)}
        />
      </SchwabFieldRow>
      <SchwabRadioGroup
        label="Is the firm the owner, executor, guardian, conservator, or custodian of this account?"
        options={YES_NO}
        value={form.get('advisorIsOwner')}
        onChange={(v) => form.set('advisorIsOwner', v)}
        inline
      />
      <SchwabRadioGroup
        label="Does the account hold assets for persons other than firm employees or their relatives?"
        options={YES_NO}
        value={form.get('advisorHoldsAssetsForOthers')}
        onChange={(v) => form.set('advisorHoldsAssetsForOthers', v)}
        inline
      />
      <SchwabTextField
        label="For Charles Schwab use only — account number"
        value={form.get('schwabAccountNumberForUse')}
        onChange={(v) => form.set('schwabAccountNumberForUse', v)}
      />
    </SchwabSection>
  )
}

interface AccountHolderProps {
  form: FormApi
  prefix: string
  /** Label appended after "Account Holder" / "Beneficiary" / "Trustee" etc. */
  label: string
  /** Which section number to display. */
  number?: string
  /** Hide preferred-name / mother's-maiden if not relevant. */
  compact?: boolean
  /**
   * Which owner slot this section reflects (0-indexed). When the corresponding
   * owner is selected in the picker, a "Pre-filled from {ownerName}" banner is
   * shown at the top of the section and a doc-source chip is shown beside the
   * ID block when the ID fields came from an uploaded supporting document.
   */
  ownerSlot?: 0 | 1
}

/** Full Account Holder block (used by Primary and Additional Holder sections). */
export function AccountHolderSection({
  form,
  prefix,
  label,
  number,
  compact,
  ownerSlot,
}: AccountHolderProps) {
  const f = (k: string) => `${prefix}${k}`
  const ownerName =
    ownerSlot != null ? form.selectedOwnerDisplayNames[ownerSlot] : undefined

  return (
    <SchwabSection number={number} title={label}>
      {!ownerName && ownerSlot != null ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          No owner selected for this slot — pick a household member above to auto-fill these fields.
        </div>
      ) : null}
      <SchwabFieldRow cols={4}>
        <SchwabTextField
          label="First name"
          value={form.get(f('FirstName'))}
          onChange={(v) => form.set(f('FirstName'), v)}
        />
        <SchwabTextField
          label="Middle name"
          value={form.get(f('MiddleName'))}
          onChange={(v) => form.set(f('MiddleName'), v)}
        />
        <SchwabTextField
          label="Last name"
          value={form.get(f('LastName'))}
          onChange={(v) => form.set(f('LastName'), v)}
        />
        <SchwabTextField
          label="Suffix"
          value={form.get(f('Suffix'))}
          onChange={(v) => form.set(f('Suffix'), v)}
        />
      </SchwabFieldRow>
      <SchwabFieldRow cols={3}>
        <SchwabTextField
          label="Social Security / Tax ID"
          value={form.get(f('Ssn'))}
          onChange={(v) => form.set(f('Ssn'), v)}
        />
        <SchwabTextField
          label="Date of birth"
          type="date"
          value={form.get(f('Dob'))}
          onChange={(v) => form.set(f('Dob'), v)}
        />
        {!compact && (
          <SchwabTextField
            label="Preferred name or alias"
            value={form.get(f('PreferredName'))}
            onChange={(v) => form.set(f('PreferredName'), v)}
          />
        )}
      </SchwabFieldRow>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-2">
        Home / legal address
      </p>
      <SchwabTextField
        label="Street address (no P.O. boxes)"
        value={form.get(f('HomeStreet'))}
        onChange={(v) => form.set(f('HomeStreet'), v)}
      />
      <SchwabFieldRow cols={4}>
        <SchwabTextField
          label="City"
          value={form.get(f('HomeCity'))}
          onChange={(v) => form.set(f('HomeCity'), v)}
        />
        <SchwabTextField
          label="State / province"
          value={form.get(f('HomeState'))}
          onChange={(v) => form.set(f('HomeState'), v)}
        />
        <SchwabTextField
          label="Zip / postal code"
          value={form.get(f('HomeZip'))}
          onChange={(v) => form.set(f('HomeZip'), v)}
        />
        <SchwabTextField
          label="Country"
          value={form.get(f('HomeCountry'))}
          onChange={(v) => form.set(f('HomeCountry'), v)}
        />
      </SchwabFieldRow>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-2">
        Mailing address (optional; P.O. boxes allowed)
      </p>
      <SchwabTextField
        label="Mailing street address"
        value={form.get(f('MailingStreet'))}
        onChange={(v) => form.set(f('MailingStreet'), v)}
      />
      <SchwabFieldRow cols={4}>
        <SchwabTextField
          label="City"
          value={form.get(f('MailingCity'))}
          onChange={(v) => form.set(f('MailingCity'), v)}
        />
        <SchwabTextField
          label="State / province"
          value={form.get(f('MailingState'))}
          onChange={(v) => form.set(f('MailingState'), v)}
        />
        <SchwabTextField
          label="Zip / postal code"
          value={form.get(f('MailingZip'))}
          onChange={(v) => form.set(f('MailingZip'), v)}
        />
        <SchwabTextField
          label="Country"
          value={form.get(f('MailingCountry'))}
          onChange={(v) => form.set(f('MailingCountry'), v)}
        />
      </SchwabFieldRow>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-2">Contact</p>
      <SchwabFieldRow cols={4}>
        <SchwabTextField
          label="Telephone"
          type="tel"
          value={form.get(f('Phone'))}
          onChange={(v) => form.set(f('Phone'), v)}
        />
        <SchwabTextField
          label="Mobile"
          type="tel"
          value={form.get(f('Mobile'))}
          onChange={(v) => form.set(f('Mobile'), v)}
        />
        <SchwabTextField
          label="Work number"
          type="tel"
          value={form.get(f('WorkNumber'))}
          onChange={(v) => form.set(f('WorkNumber'), v)}
        />
        <SchwabTextField
          label="Work ext."
          value={form.get(f('WorkExtension'))}
          onChange={(v) => form.set(f('WorkExtension'), v)}
        />
      </SchwabFieldRow>
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="Email address"
          type="email"
          value={form.get(f('Email'))}
          onChange={(v) => form.set(f('Email'), v)}
          hint="Leave blank for minors."
        />
        {!compact && (
          <SchwabTextField
            label="Mother's maiden name"
            value={form.get(f('MothersMaidenName'))}
            onChange={(v) => form.set(f('MothersMaidenName'), v)}
          />
        )}
      </SchwabFieldRow>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-2">
        Citizenship and legal residence
      </p>
      <SchwabSingleCheckbox
        label="Country of citizenship — USA"
        checked={form.getBool(f('CitizenshipUsa'))}
        onChange={(v) => form.set(f('CitizenshipUsa'), v)}
      />
      <SchwabTextField
        label="Other country(ies) of citizenship"
        value={form.get(f('CitizenshipOther'))}
        onChange={(v) => form.set(f('CitizenshipOther'), v)}
      />
      <SchwabRadioGroup
        label="Country of legal residence"
        options={[
          { value: 'USA', label: 'USA' },
          { value: 'Other', label: 'Other' },
        ]}
        value={form.get(f('LegalResidenceCountry'))}
        onChange={(v) => form.set(f('LegalResidenceCountry'), v)}
        inline
      />
      {form.get(f('LegalResidenceCountry')) === 'Other' && (
        <SchwabTextField
          label="Other country of legal residence"
          value={form.get(f('LegalResidenceOther'))}
          onChange={(v) => form.set(f('LegalResidenceOther'), v)}
        />
      )}

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-2">
        Government-issued identification
      </p>
      <SchwabRadioGroup
        label="ID type"
        options={ID_TYPE_OPTIONS}
        value={form.get(f('IdType'))}
        onChange={(v) => form.set(f('IdType'), v)}
        inline
      />
      <SchwabFieldRow cols={3}>
        <SchwabTextField
          label="ID number"
          value={form.get(f('IdNumber'))}
          onChange={(v) => form.set(f('IdNumber'), v)}
        />
        <SchwabTextField
          label="Country of issuance"
          value={form.get(f('IdCountry'))}
          onChange={(v) => form.set(f('IdCountry'), v)}
        />
        <SchwabTextField
          label="State of issuance"
          value={form.get(f('IdState'))}
          onChange={(v) => form.set(f('IdState'), v)}
          hint="If applicable."
        />
      </SchwabFieldRow>
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="ID issue date"
          type="date"
          value={form.get(f('IdIssueDate'))}
          onChange={(v) => form.set(f('IdIssueDate'), v)}
        />
        <SchwabTextField
          label="ID expiration date"
          type="date"
          value={form.get(f('IdExpirationDate'))}
          onChange={(v) => form.set(f('IdExpirationDate'), v)}
        />
      </SchwabFieldRow>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-2">Employment</p>
      <SchwabRadioGroup
        label="Employment information"
        options={EMPLOYMENT_STATUS_OPTIONS}
        value={form.get(f('EmploymentStatus'))}
        onChange={(v) => form.set(f('EmploymentStatus'), v)}
        inline
      />
      <SchwabRadioGroup
        label="Occupation"
        options={OCCUPATION_OPTIONS}
        value={form.get(f('Occupation'))}
        onChange={(v) => form.set(f('Occupation'), v)}
      />
      {form.get(f('Occupation')) === 'Other' && (
        <SchwabTextField
          label="Occupation — Other (specify)"
          value={form.get(f('OccupationOther'))}
          onChange={(v) => form.set(f('OccupationOther'), v)}
        />
      )}
      <SchwabTextField
        label="Employer name / business name"
        value={form.get(f('EmployerName'))}
        onChange={(v) => form.set(f('EmployerName'), v)}
      />
      <SchwabTextField
        label="Business street address (no P.O. boxes)"
        value={form.get(f('BusinessStreet'))}
        onChange={(v) => form.set(f('BusinessStreet'), v)}
      />
      <SchwabFieldRow cols={4}>
        <SchwabTextField
          label="City"
          value={form.get(f('BusinessCity'))}
          onChange={(v) => form.set(f('BusinessCity'), v)}
        />
        <SchwabTextField
          label="State / province"
          value={form.get(f('BusinessState'))}
          onChange={(v) => form.set(f('BusinessState'), v)}
        />
        <SchwabTextField
          label="Zip / postal code"
          value={form.get(f('BusinessZip'))}
          onChange={(v) => form.set(f('BusinessZip'), v)}
        />
        <SchwabTextField
          label="Country"
          value={form.get(f('BusinessCountry'))}
          onChange={(v) => form.set(f('BusinessCountry'), v)}
        />
      </SchwabFieldRow>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-2">
        Affiliations and disclosures
      </p>
      <SchwabRadioGroup
        label="Associated with a stock exchange, FINRA, or broker-dealer?"
        options={YES_NO}
        value={form.get(f('FinraAffiliation'))}
        onChange={(v) => form.set(f('FinraAffiliation'), v)}
        inline
      />
      {form.get(f('FinraAffiliation')) === 'Yes' && (
        <SchwabTextField
          label="Company name"
          value={form.get(f('FinraCompanyName'))}
          onChange={(v) => form.set(f('FinraCompanyName'), v)}
        />
      )}
      <SchwabRadioGroup
        label="Director, 10% shareholder, or policy-making officer of a publicly held company?"
        options={YES_NO}
        value={form.get(f('ControlPerson'))}
        onChange={(v) => form.set(f('ControlPerson'), v)}
        inline
      />
      {form.get(f('ControlPerson')) === 'Yes' && (
        <SchwabFieldRow cols={2}>
          <SchwabTextField
            label="Company name"
            value={form.get(f('ControlPersonCompanyName'))}
            onChange={(v) => form.set(f('ControlPersonCompanyName'), v)}
          />
          <SchwabTextField
            label="Trading symbol"
            value={form.get(f('ControlPersonSymbol'))}
            onChange={(v) => form.set(f('ControlPersonSymbol'), v)}
          />
        </SchwabFieldRow>
      )}
    </SchwabSection>
  )
}

interface TrustedContactProps {
  form: FormApi
  prefix: string
  label: string
}

export function TrustedContactSection({ form, prefix, label }: TrustedContactProps) {
  const f = (k: string) => `${prefix}${k}`
  return (
    <SchwabSection title={label}>
      <SchwabFieldRow cols={4}>
        <SchwabTextField label="First name" value={form.get(f('FirstName'))} onChange={(v) => form.set(f('FirstName'), v)} />
        <SchwabTextField label="Middle name" value={form.get(f('MiddleName'))} onChange={(v) => form.set(f('MiddleName'), v)} />
        <SchwabTextField label="Last name" value={form.get(f('LastName'))} onChange={(v) => form.set(f('LastName'), v)} />
        <SchwabTextField label="Suffix" value={form.get(f('Suffix'))} onChange={(v) => form.set(f('Suffix'), v)} />
      </SchwabFieldRow>
      <SchwabRadioGroup
        label="Relationship"
        options={RELATIONSHIP_OPTIONS}
        value={form.get(f('Relationship'))}
        onChange={(v) => form.set(f('Relationship'), v)}
        inline
      />
      <SchwabTextField
        label="Mailing address (no P.O. boxes)"
        value={form.get(f('MailingStreet'))}
        onChange={(v) => form.set(f('MailingStreet'), v)}
      />
      <SchwabFieldRow cols={4}>
        <SchwabTextField label="City" value={form.get(f('City'))} onChange={(v) => form.set(f('City'), v)} />
        <SchwabTextField label="State / province" value={form.get(f('State'))} onChange={(v) => form.set(f('State'), v)} />
        <SchwabTextField label="Zip / postal code" value={form.get(f('Zip'))} onChange={(v) => form.set(f('Zip'), v)} />
        <SchwabTextField label="Country" value={form.get(f('Country'))} onChange={(v) => form.set(f('Country'), v)} />
      </SchwabFieldRow>
      <SchwabFieldRow cols={3}>
        <SchwabTextField label="Telephone" type="tel" value={form.get(f('Phone'))} onChange={(v) => form.set(f('Phone'), v)} />
        <SchwabTextField label="Mobile" type="tel" value={form.get(f('Mobile'))} onChange={(v) => form.set(f('Mobile'), v)} />
        <SchwabTextField label="Email" type="email" value={form.get(f('Email'))} onChange={(v) => form.set(f('Email'), v)} />
      </SchwabFieldRow>
    </SchwabSection>
  )
}

/** Source of funds + Purpose of account — appears on Schwab One and Managed forms. */
export function SourceAndPurposeSection({ form, number }: { form: FormApi; number?: string }) {
  return (
    <SchwabSection
      number={number}
      title="Required information about the account"
      description="Source of funds and intended purpose of the account."
    >
      <SchwabCheckboxGroup
        label="Source of funds (select all that apply)"
        options={SOURCE_OF_FUNDS_OPTIONS}
        values={form.getMulti('sourceOfFunds')}
        onChange={(v) => form.set('sourceOfFunds', v)}
        columns={2}
      />
      {form.getMulti('sourceOfFunds').includes('other') && (
        <SchwabTextField
          label="Source of funds — Other (specify)"
          value={form.get('sourceOfFundsOther')}
          onChange={(v) => form.set('sourceOfFundsOther', v)}
        />
      )}
      <SchwabCheckboxGroup
        label="Purpose of account (select all that apply)"
        options={PURPOSE_OF_ACCOUNT_OPTIONS}
        values={form.getMulti('purposeOfAccount')}
        onChange={(v) => form.set('purposeOfAccount', v)}
        columns={2}
      />
      {form.getMulti('purposeOfAccount').includes('other') && (
        <SchwabTextField
          label="Purpose of account — Other (specify)"
          value={form.get('purposeOfAccountOther')}
          onChange={(v) => form.set('purposeOfAccountOther', v)}
        />
      )}
    </SchwabSection>
  )
}

interface IssuerCommsProps {
  form: FormApi
  number?: string
  /** "IA" for Schwab One/IRA, "Advisor" for Managed Account. */
  intermediaryLabel?: string
  /** Show the Manager third option on Managed forms. */
  includeManager?: boolean
}

export function IssuerCommunicationsSection({
  form,
  number,
  intermediaryLabel = 'IA',
  includeManager,
}: IssuerCommsProps) {
  const target = [
    { value: 'Account Holder', label: 'Account Holder' },
    { value: intermediaryLabel, label: intermediaryLabel },
  ]
  const targetWithManager = includeManager
    ? [...target, { value: 'Manager', label: 'Manager' }]
    : target
  const targetWithBoth = [
    ...targetWithManager,
    { value: `Both Account Holder and ${intermediaryLabel}`, label: `Both Account Holder and ${intermediaryLabel}` },
  ]
  const targetWithNone = [...targetWithManager, { value: 'None', label: 'None' }]

  return (
    <SchwabSection
      number={number}
      title="Issuer communications and related actions"
      description="Indicate who receives and acts on each type of issuer communication."
    >
      <SchwabRadioGroup
        label="A. Proxy ballots — sent to/vote"
        options={targetWithManager}
        value={form.get('proxyBallotTarget')}
        onChange={(v) => form.set('proxyBallotTarget', v)}
        inline
      />
      <SchwabRadioGroup
        label="A. Proxy informational copies"
        options={targetWithNone}
        value={form.get('proxyInfoTarget')}
        onChange={(v) => form.set('proxyInfoTarget', v)}
        inline
      />
      <SchwabRadioGroup
        label="B. Reorganization response coupons / decisions"
        options={targetWithManager}
        value={form.get('reorgTarget')}
        onChange={(v) => form.set('reorgTarget', v)}
        inline
      />
      <SchwabRadioGroup
        label="B. Reorganization informational copies"
        options={targetWithNone}
        value={form.get('reorgInfoTarget')}
        onChange={(v) => form.set('reorgInfoTarget', v)}
        inline
      />
      <SchwabRadioGroup
        label="C. Interim mailings"
        options={targetWithBoth}
        value={form.get('interimMailingsTarget')}
        onChange={(v) => form.set('interimMailingsTarget', v)}
        inline
      />
      <SchwabRadioGroup
        label="Objection to release of name / address / positions to issuers"
        options={YES_NO}
        value={form.get('objectionRelease')}
        onChange={(v) => form.set('objectionRelease', v)}
        inline
      />
    </SchwabSection>
  )
}
