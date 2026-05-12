import { useSchwabFormState } from './useSchwabFormState'
import {
  SchwabSection,
  SchwabFieldRow,
  SchwabTextField,
  SchwabRadioGroup,
  SchwabSingleCheckbox,
  RELATIONSHIP_OPTIONS,
} from './schwabPrimitives'
import {
  IaCoverSection,
  AccountHolderSection,
  TrustedContactSection,
  IssuerCommunicationsSection,
} from './SchwabSharedSections'
import { AccountFinancialSection } from './AccountFinancialSection'

interface Props {
  childId: string
}

const BENEFICIARY_RELATIONSHIP_OPTIONS = [
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Child', label: 'Child' },
  { value: 'Grandchild', label: 'Grandchild' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other Individual', label: 'Other Individual' },
  { value: 'Trust', label: 'Trust' },
  { value: 'Organization', label: 'Organization' },
  { value: 'Estate', label: 'Estate' },
]

interface BeneficiaryBlockProps {
  form: ReturnType<typeof useSchwabFormState>
  index: number
}

function BeneficiaryBlock({ form, index }: BeneficiaryBlockProps) {
  const f = (k: string) => `beneficiary${index}${k}`
  return (
    <SchwabSection title={`9${'abcd'[index - 1]}. Beneficiary ${index}`}>
      <SchwabFieldRow cols={3}>
        <SchwabRadioGroup
          label="Type of beneficiary"
          options={[
            { value: 'Primary', label: 'Primary' },
            { value: 'Contingent', label: 'Contingent' },
          ]}
          value={form.get(f('Type'))}
          onChange={(v) => form.set(f('Type'), v)}
          inline
        />
        <SchwabTextField
          label="Portion (%)"
          type="number"
          value={form.get(f('Portion'))}
          onChange={(v) => form.set(f('Portion'), v)}
        />
        <SchwabRadioGroup
          label="Per stirpes / per capita applies"
          options={[
            { value: 'Yes', label: 'Yes' },
            { value: 'No', label: 'No' },
          ]}
          value={form.get(f('PerStirpes'))}
          onChange={(v) => form.set(f('PerStirpes'), v)}
          inline
        />
      </SchwabFieldRow>
      <SchwabFieldRow cols={4}>
        <SchwabTextField label="First name" value={form.get(f('FirstName'))} onChange={(v) => form.set(f('FirstName'), v)} />
        <SchwabTextField label="Middle name" value={form.get(f('MiddleName'))} onChange={(v) => form.set(f('MiddleName'), v)} />
        <SchwabTextField label="Last name" value={form.get(f('LastName'))} onChange={(v) => form.set(f('LastName'), v)} />
        <SchwabTextField label="Suffix" value={form.get(f('Suffix'))} onChange={(v) => form.set(f('Suffix'), v)} />
      </SchwabFieldRow>
      <SchwabTextField
        label="Trust / organization / estate name (if applicable)"
        value={form.get(f('EntityName'))}
        onChange={(v) => form.set(f('EntityName'), v)}
      />
      <SchwabRadioGroup
        label="Relationship"
        options={BENEFICIARY_RELATIONSHIP_OPTIONS}
        value={form.get(f('Relationship'))}
        onChange={(v) => form.set(f('Relationship'), v)}
      />
      <SchwabFieldRow cols={2}>
        <SchwabTextField label="SSN / Tax ID" value={form.get(f('Ssn'))} onChange={(v) => form.set(f('Ssn'), v)} />
        <SchwabTextField
          label="Date of birth / Trust date"
          type="date"
          value={form.get(f('Dob'))}
          onChange={(v) => form.set(f('Dob'), v)}
        />
      </SchwabFieldRow>
      <SchwabTextField
        label="Mailing address"
        value={form.get(f('MailingStreet'))}
        onChange={(v) => form.set(f('MailingStreet'), v)}
      />
      <SchwabFieldRow cols={4}>
        <SchwabTextField label="City" value={form.get(f('City'))} onChange={(v) => form.set(f('City'), v)} />
        <SchwabTextField label="State / province" value={form.get(f('State'))} onChange={(v) => form.set(f('State'), v)} />
        <SchwabTextField label="Zip / postal code" value={form.get(f('Zip'))} onChange={(v) => form.set(f('Zip'), v)} />
        <SchwabTextField label="Country" value={form.get(f('Country'))} onChange={(v) => form.set(f('Country'), v)} />
      </SchwabFieldRow>
      <SchwabFieldRow cols={2}>
        <SchwabTextField label="Telephone" type="tel" value={form.get(f('Phone'))} onChange={(v) => form.set(f('Phone'), v)} />
        <SchwabTextField label="Email" type="email" value={form.get(f('Email'))} onChange={(v) => form.set(f('Email'), v)} />
      </SchwabFieldRow>
      <SchwabSingleCheckbox
        label="Country(ies) of citizenship — USA"
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
    </SchwabSection>
  )
}

/** Schwab IRA Account Application — APP10539. 11 sections + IA cover. */
export function SchwabIraForm({ childId }: Props) {
  const form = useSchwabFormState(childId)
  const iraCategory = form.get('section1IraCategory')

  return (
    <div className="space-y-0">
      <IaCoverSection form={form} />

      <SchwabSection number="1" title="Select IRA type">
        <SchwabRadioGroup
          label="IRA category"
          options={[
            { value: 'Traditional', label: 'Traditional' },
            { value: 'Roth', label: 'Roth' },
            { value: 'SIMPLE', label: 'SIMPLE' },
            { value: 'SEP', label: 'SEP' },
          ]}
          value={iraCategory}
          onChange={(v) => form.set('section1IraCategory', v)}
          inline
        />

        {iraCategory === 'Traditional' && (
          <div className="space-y-3 pl-3 border-l-2 border-l-muted">
            <SchwabRadioGroup
              label="Traditional IRA subtype"
              options={[
                { value: 'Contributory', label: 'Contributory IRA' },
                { value: 'Rollover', label: 'Rollover IRA' },
                { value: 'EmployerRollover', label: 'Rollover from an employer retirement plan' },
              ]}
              value={form.get('section1TraditionalSubtype')}
              onChange={(v) => form.set('section1TraditionalSubtype', v)}
            />
            {form.get('section1TraditionalSubtype') === 'EmployerRollover' && (
              <>
                <SchwabTextField
                  label="Name of employer sponsoring the plan"
                  value={form.get('section1EmployerSponsorName')}
                  onChange={(v) => form.set('section1EmployerSponsorName', v)}
                />
                <SchwabFieldRow cols={2}>
                  <SchwabTextField
                    label="Approximate total value of distribution"
                    type="number"
                    value={form.get('section1EmployerDistributionAmount')}
                    onChange={(v) => form.set('section1EmployerDistributionAmount', v)}
                  />
                  <SchwabTextField
                    label="Expected distribution date"
                    type="date"
                    value={form.get('section1EmployerDistributionDate')}
                    onChange={(v) => form.set('section1EmployerDistributionDate', v)}
                  />
                </SchwabFieldRow>
              </>
            )}
          </div>
        )}

        {iraCategory === 'Roth' && (
          <div className="space-y-3 pl-3 border-l-2 border-l-muted">
            <SchwabRadioGroup
              label="Roth IRA subtype"
              options={[
                { value: 'Contributory', label: 'Roth Contributory' },
                { value: 'ConversionQualifiedPlan', label: 'Roth Conversion (from Schwab Qualified Plan)' },
                { value: 'ConversionTraditional', label: 'Roth Conversion (from Schwab Traditional IRA)' },
              ]}
              value={form.get('section1RothSubtype')}
              onChange={(v) => form.set('section1RothSubtype', v)}
            />
            {form.get('section1RothSubtype') === 'ConversionQualifiedPlan' && (
              <SchwabTextField
                label="Current Schwab Qualified Plan to convert"
                value={form.get('section1RothFromQualifiedPlan')}
                onChange={(v) => form.set('section1RothFromQualifiedPlan', v)}
              />
            )}
            {form.get('section1RothSubtype') === 'ConversionTraditional' && (
              <SchwabTextField
                label="Current Schwab Traditional IRA to convert"
                value={form.get('section1RothFromTraditional')}
                onChange={(v) => form.set('section1RothFromTraditional', v)}
              />
            )}
            {(form.get('section1RothSubtype') === 'ConversionQualifiedPlan' ||
              form.get('section1RothSubtype') === 'ConversionTraditional') && (
              <>
                <SchwabRadioGroup
                  label="Amount to convert to Roth IRA"
                  options={[
                    { value: 'Full', label: 'Full conversion' },
                    { value: 'Partial', label: 'Partial conversion' },
                  ]}
                  value={form.get('section1RothConversionAmount')}
                  onChange={(v) => form.set('section1RothConversionAmount', v)}
                  inline
                />
                {form.get('section1RothConversionAmount') === 'Partial' && (
                  <SchwabTextField
                    label="Cash amount to be converted"
                    type="number"
                    value={form.get('section1RothCashAmount')}
                    onChange={(v) => form.set('section1RothCashAmount', v)}
                  />
                )}
                <SchwabSingleCheckbox
                  label="Attach separate list of securities to be converted"
                  checked={form.getBool('section1RothSecuritiesList')}
                  onChange={(v) => form.set('section1RothSecuritiesList', v)}
                />
                <SchwabFieldRow cols={2}>
                  <SchwabTextField
                    label="Federal tax withholding rate (whole %)"
                    type="number"
                    value={form.get('section1RothFederalWithholding')}
                    onChange={(v) => form.set('section1RothFederalWithholding', v)}
                  />
                  <SchwabRadioGroup
                    label="State tax withholding"
                    options={[
                      { value: 'No', label: 'No state withholding' },
                      { value: 'Yes', label: 'Withhold at rate below' },
                    ]}
                    value={form.get('section1RothStateWithholdingOption')}
                    onChange={(v) => form.set('section1RothStateWithholdingOption', v)}
                    inline
                  />
                </SchwabFieldRow>
                {form.get('section1RothStateWithholdingOption') === 'Yes' && (
                  <SchwabTextField
                    label="State withholding rate (%)"
                    type="number"
                    value={form.get('section1RothStateWithholdingRate')}
                    onChange={(v) => form.set('section1RothStateWithholdingRate', v)}
                  />
                )}
              </>
            )}
          </div>
        )}

        {iraCategory === 'SIMPLE' && (
          <div className="space-y-3 pl-3 border-l-2 border-l-muted">
            <SchwabRadioGroup
              label="SIMPLE IRA type"
              options={[
                { value: 'Traditional', label: 'Traditional SIMPLE IRA' },
                { value: 'Roth', label: 'Roth SIMPLE IRA' },
              ]}
              value={form.get('section1SimpleType')}
              onChange={(v) => form.set('section1SimpleType', v)}
              inline
            />
            <SchwabFieldRow cols={2}>
              <SchwabTextField
                label="Employer's group plan number"
                value={form.get('section1SimpleGroupPlan')}
                onChange={(v) => form.set('section1SimpleGroupPlan', v)}
              />
              <SchwabTextField
                label="Name of business"
                value={form.get('section1SimpleBusinessName')}
                onChange={(v) => form.set('section1SimpleBusinessName', v)}
              />
            </SchwabFieldRow>
          </div>
        )}

        {iraCategory === 'SEP' && (
          <div className="space-y-3 pl-3 border-l-2 border-l-muted">
            <SchwabRadioGroup
              label="SEP IRA subtype"
              options={[
                { value: 'SEP', label: 'SEP IRA' },
                { value: 'SARSEP', label: 'SARSEP IRA' },
              ]}
              value={form.get('section1SepSubtype')}
              onChange={(v) => form.set('section1SepSubtype', v)}
              inline
            />
            <SchwabTextField
              label="Name of business"
              value={form.get('section1SepBusinessName')}
              onChange={(v) => form.set('section1SepBusinessName', v)}
            />
          </div>
        )}
      </SchwabSection>

      <AccountHolderSection
        form={form}
        prefix=""
        label="Account holder information"
        number="2"
        ownerSlot={0}
      />

      <TrustedContactSection form={form} prefix="trustedContact1" label="2a. Trusted Contact Person 1" />
      <TrustedContactSection form={form} prefix="trustedContact2" label="2b. Trusted Contact Person 2" />

      <SchwabSection number="3" title="Consent to enroll in Schwab's Cash Features Program">
        <SchwabSingleCheckbox
          label="I acknowledge the Cash Features Program disclosures"
          checked={form.getBool('section3Acknowledge')}
          onChange={(v) => form.set('section3Acknowledge', v)}
        />
      </SchwabSection>

      <SchwabSection number="4" title="Paperless document enrollment">
        <SchwabSingleCheckbox
          label="Opt out — do not enroll my account in Paperless Documents"
          checked={form.getBool('section4OptOut')}
          onChange={(v) => form.set('section4OptOut', v)}
        />
      </SchwabSection>

      <SchwabSection number="5" title="Instructions about IA authorizations">
        <SchwabSingleCheckbox
          label="Trading and disbursement authorization for checks and journals"
          checked={form.getBool('section5TradingDisbursement')}
          onChange={(v) => form.set('section5TradingDisbursement', v)}
        />
        <SchwabSingleCheckbox
          label="Trading authorization"
          checked={form.getBool('section5Trading')}
          onChange={(v) => form.set('section5Trading', v)}
        />
        <SchwabSingleCheckbox
          label="Fee payment authorization"
          checked={form.getBool('section5FeePayment')}
          onChange={(v) => form.set('section5FeePayment', v)}
        />
      </SchwabSection>

      <IssuerCommunicationsSection form={form} number="6" intermediaryLabel="IA" />

      <SchwabSection
        number="7"
        title="Beneficiary instructions and important information"
        description="Read the instructions; make selections in Section 9."
      >
        <SchwabSingleCheckbox
          label="I have read the beneficiary instructions"
          checked={form.getBool('section7Acknowledge')}
          onChange={(v) => form.set('section7Acknowledge', v)}
        />
      </SchwabSection>

      <SchwabSection number="8" title="Information about beneficiary designations">
        <SchwabSingleCheckbox
          label="I acknowledge the per stirpes / per capita definitions"
          checked={form.getBool('section8Acknowledge')}
          onChange={(v) => form.set('section8Acknowledge', v)}
        />
      </SchwabSection>

      <SchwabSection number="9" title="Beneficiary designations">
        <SchwabRadioGroup
          label="Account-level per stirpes / per capita election (optional)"
          options={[
            { value: 'PerStirpes', label: 'Per stirpes' },
            { value: 'PerCapita', label: 'Per capita' },
            { value: 'None', label: 'None' },
          ]}
          value={form.get('section9AccountElection')}
          onChange={(v) => form.set('section9AccountElection', v)}
          inline
        />
        <BeneficiaryBlock form={form} index={1} />
        <BeneficiaryBlock form={form} index={2} />
        <BeneficiaryBlock form={form} index={3} />
        <BeneficiaryBlock form={form} index={4} />
      </SchwabSection>

      <SchwabSection number="10" title="Designate an authorized party">
        <SchwabFieldRow cols={3}>
          <SchwabTextField label="Authorized party — First name" value={form.get('authorizedFirstName')} onChange={(v) => form.set('authorizedFirstName', v)} />
          <SchwabTextField label="Authorized party — Middle name" value={form.get('authorizedMiddleName')} onChange={(v) => form.set('authorizedMiddleName', v)} />
          <SchwabTextField label="Authorized party — Last name" value={form.get('authorizedLastName')} onChange={(v) => form.set('authorizedLastName', v)} />
        </SchwabFieldRow>
        <SchwabRadioGroup
          label="Relationship to you"
          options={RELATIONSHIP_OPTIONS}
          value={form.get('authorizedRelationship')}
          onChange={(v) => form.set('authorizedRelationship', v)}
          inline
        />
        <SchwabTextField
          label="Home street address (no P.O. boxes)"
          value={form.get('authorizedStreet')}
          onChange={(v) => form.set('authorizedStreet', v)}
        />
        <SchwabFieldRow cols={3}>
          <SchwabTextField label="City" value={form.get('authorizedCity')} onChange={(v) => form.set('authorizedCity', v)} />
          <SchwabTextField label="State / province" value={form.get('authorizedState')} onChange={(v) => form.set('authorizedState', v)} />
          <SchwabTextField label="Zip / postal code" value={form.get('authorizedZip')} onChange={(v) => form.set('authorizedZip', v)} />
        </SchwabFieldRow>
        <SchwabFieldRow cols={2}>
          <SchwabTextField label="Telephone" type="tel" value={form.get('authorizedPhone')} onChange={(v) => form.set('authorizedPhone', v)} />
          <SchwabTextField label="Email" type="email" value={form.get('authorizedEmail')} onChange={(v) => form.set('authorizedEmail', v)} />
        </SchwabFieldRow>
      </SchwabSection>

      <AccountFinancialSection form={form} number="11" />
    </div>
  )
}
