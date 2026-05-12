import { useSchwabFormState } from './useSchwabFormState'
import {
  SchwabSection,
  SchwabFieldRow,
  SchwabTextField,
  SchwabRadioGroup,
  SchwabSingleCheckbox,
} from './schwabPrimitives'
import {
  IaCoverSection,
  AccountHolderSection,
  TrustedContactSection,
  SourceAndPurposeSection,
  IssuerCommunicationsSection,
} from './SchwabSharedSections'
import { AccountFinancialSection } from './AccountFinancialSection'

interface Props {
  childId: string
}

/** Schwab One Account Application — Personal (APP13582), 12 sections + IA cover. */
export function SchwabOnePersonalForm({ childId }: Props) {
  const form = useSchwabFormState(childId)
  const reg = form.get('section2Registration')
  const isCustodial = reg === 'Custodial'
  const isEstate = reg === 'Estate'

  return (
    <div className="space-y-0">
      <IaCoverSection form={form} />

      <SchwabSection number="1" title="Type of account">
        <SchwabRadioGroup
          label="Account type"
          options={[
            { value: 'Schwab One', label: 'Schwab One' },
            { value: 'Schwab One with Margin', label: 'Schwab One with Margin' },
          ]}
          value={form.get('section1AccountType')}
          onChange={(v) => form.set('section1AccountType', v)}
          inline
          hint="Margin not available for Custodial / Conservatorship / Guardianship / Estate registrations."
        />
      </SchwabSection>

      <SchwabSection number="2" title="Registration">
        <SchwabRadioGroup
          label="Registration type"
          options={[
            { value: 'Individual', label: 'Individual' },
            { value: 'Joint Tenants with Rights of Survivorship', label: 'Joint Tenants with Rights of Survivorship' },
            { value: 'Tenants in Common', label: 'Tenants in Common' },
            { value: 'Tenants by the Entirety', label: 'Tenants by the Entirety' },
            { value: 'Community Property', label: 'Community Property' },
            { value: 'Community Property with Rights of Survivorship', label: 'Community Property with Rights of Survivorship' },
            { value: 'Conservatorship', label: 'Conservatorship' },
            { value: 'Guardianship', label: 'Guardianship' },
            { value: 'Custodial', label: 'Custodial' },
            { value: 'Estate', label: 'Estate' },
          ]}
          value={reg}
          onChange={(v) => form.set('section2Registration', v)}
        />
        {isCustodial && (
          <SchwabFieldRow cols={2}>
            <SchwabTextField
              label="Custodial — under laws of (state)"
              value={form.get('section2CustodialState')}
              onChange={(v) => form.set('section2CustodialState', v)}
            />
            <SchwabTextField
              label="Custodial — age of termination"
              value={form.get('section2CustodialAge')}
              onChange={(v) => form.set('section2CustodialAge', v)}
            />
          </SchwabFieldRow>
        )}
        {isEstate && (
          <>
            <SchwabFieldRow cols={4}>
              <SchwabTextField label="Decedent first name" value={form.get('section2DecedentFirstName')} onChange={(v) => form.set('section2DecedentFirstName', v)} />
              <SchwabTextField label="Decedent middle name" value={form.get('section2DecedentMiddleName')} onChange={(v) => form.set('section2DecedentMiddleName', v)} />
              <SchwabTextField label="Decedent last name" value={form.get('section2DecedentLastName')} onChange={(v) => form.set('section2DecedentLastName', v)} />
              <SchwabTextField label="Decedent SSN" value={form.get('section2DecedentSsn')} onChange={(v) => form.set('section2DecedentSsn', v)} />
            </SchwabFieldRow>
            <SchwabTextField
              label="Tax ID number of the estate"
              value={form.get('section2EstateTaxId')}
              onChange={(v) => form.set('section2EstateTaxId', v)}
            />
          </>
        )}
      </SchwabSection>

      <AccountHolderSection
        form={form}
        prefix=""
        label="Account holder information — Primary holder / minor / executor"
        number="3"
        ownerSlot={0}
      />
      <TrustedContactSection form={form} prefix="trustedContact1" label="3a. Trusted Contact Person 1 (Primary)" />
      <TrustedContactSection form={form} prefix="trustedContact2" label="3b. Trusted Contact Person 2 (Primary)" />
      <AccountHolderSection
        form={form}
        prefix="additional"
        label="Additional Account Holder / Custodian / Co-Executor"
        number="3c"
        ownerSlot={1}
      />
      <TrustedContactSection form={form} prefix="additionalTrustedContact1" label="3d. Trusted Contact Person 1 (Additional Holder)" />
      <TrustedContactSection form={form} prefix="additionalTrustedContact2" label="3e. Trusted Contact Person 2 (Additional Holder)" />

      <SchwabSection
        number="4"
        title="Consent to enroll in Schwab's Cash Features Program"
        description="Bank sweep enrollment is implied by signing in Section 11. No additional field here."
      >
        <SchwabSingleCheckbox
          label="I acknowledge the Cash Features Program disclosures"
          checked={form.getBool('section4Acknowledge')}
          onChange={(v) => form.set('section4Acknowledge', v)}
        />
      </SchwabSection>

      <SchwabSection number="5" title="Paperless document enrollment">
        <SchwabSingleCheckbox
          label="Opt out — do not enroll my account in Paperless Documents"
          checked={form.getBool('section5OptOut')}
          onChange={(v) => form.set('section5OptOut', v)}
        />
      </SchwabSection>

      <SourceAndPurposeSection form={form} number="6" />

      <AccountFinancialSection form={form} number="6a" />

      <SchwabSection number="7" title="Checking preferences">
        <SchwabRadioGroup
          label="Checks / debit preference"
          options={[
            { value: 'order-checks', label: 'Yes, order checks' },
            { value: 'checks-and-debit-card', label: 'Yes, checks + Visa Platinum Debit Card' },
            { value: 'checks-and-two-debit-cards', label: 'Yes, checks + two Visa debit cards' },
            { value: 'none', label: 'No checks or cards' },
          ]}
          value={form.get('section7ChecksPref')}
          onChange={(v) => form.set('section7ChecksPref', v)}
        />
        <SchwabRadioGroup
          label="Anticipated activity (checks / ATM per month)"
          options={[
            { value: 'lt-5', label: 'Less than 5' },
            { value: '5-10', label: '5 to 10' },
            { value: '11-20', label: '11 to 20' },
            { value: 'gt-20', label: 'More than 20' },
          ]}
          value={form.get('section7Activity')}
          onChange={(v) => form.set('section7Activity', v)}
          inline
        />
      </SchwabSection>

      <SchwabSection number="8" title="Instructions about IA authorizations">
        <SchwabSingleCheckbox
          label="Trading and disbursement authorization for checks and journals"
          checked={form.getBool('section8TradingDisbursement')}
          onChange={(v) => form.set('section8TradingDisbursement', v)}
        />
        <SchwabSingleCheckbox
          label="Trading authorization"
          checked={form.getBool('section8Trading')}
          onChange={(v) => form.set('section8Trading', v)}
        />
        <SchwabSingleCheckbox
          label="Fee payment authorization"
          checked={form.getBool('section8FeePayment')}
          onChange={(v) => form.set('section8FeePayment', v)}
        />
      </SchwabSection>

      <IssuerCommunicationsSection form={form} number="9" intermediaryLabel="IA" />

      <SchwabSection
        number="10"
        title="Certification and indemnification — Estate / Guardianship / Conservatorship"
        description="Required only when registration in Section 2 is Estate, Guardianship, or Conservatorship. Signatures are collected later in the signing ceremony."
        conditional
      >
        <SchwabSingleCheckbox
          label="I acknowledge the certification and indemnification language"
          checked={form.getBool('section10Acknowledge')}
          onChange={(v) => form.set('section10Acknowledge', v)}
        />
        <SchwabSingleCheckbox
          label="Backup withholding exception — item (2) of the W-9 does not apply"
          checked={form.getBool('section10BackupWithholding')}
          onChange={(v) => form.set('section10BackupWithholding', v)}
        />
      </SchwabSection>

      {isCustodial && (
        <SchwabSection
          number="11"
          title="Nominate a successor custodian (Custodial accounts only)"
          description="Custodian and witness signatures are collected later in the signing ceremony."
          conditional
        >
          <SchwabTextField
            label="Name of successor custodian"
            value={form.get('section12SuccessorName')}
            onChange={(v) => form.set('section12SuccessorName', v)}
          />
          <SchwabTextField
            label="Custodian — title"
            value={form.get('section12CustodianTitle')}
            onChange={(v) => form.set('section12CustodianTitle', v)}
          />
          <SchwabTextField
            label="Witness — title"
            value={form.get('section12WitnessTitle')}
            onChange={(v) => form.set('section12WitnessTitle', v)}
          />
        </SchwabSection>
      )}
    </div>
  )
}
