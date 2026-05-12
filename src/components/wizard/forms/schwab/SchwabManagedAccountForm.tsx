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

function ManagedAccountBlock({
  form,
  index,
}: {
  form: ReturnType<typeof useSchwabFormState>
  index: number
}) {
  const f = (k: string) => `mgr${index}${k}`
  return (
    <SchwabSection title={`Managed Account ${index} — Designation of money manager`}>
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="Schwab account number"
          value={form.get(f('SchwabAccount'))}
          onChange={(v) => form.set(f('SchwabAccount'), v)}
        />
        <SchwabTextField
          label="Manager firm name"
          value={form.get(f('ManagerFirm'))}
          onChange={(v) => form.set(f('ManagerFirm'), v)}
        />
      </SchwabFieldRow>
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="Manager master account number"
          value={form.get(f('ManagerMaster'))}
          onChange={(v) => form.set(f('ManagerMaster'), v)}
        />
        <SchwabTextField
          label="Manager investment strategy"
          value={form.get(f('ManagerStrategy'))}
          onChange={(v) => form.set(f('ManagerStrategy'), v)}
        />
      </SchwabFieldRow>
      <SchwabTextField
        label="Asset-based pricing schedule name"
        value={form.get(f('PricingSchedule'))}
        onChange={(v) => form.set(f('PricingSchedule'), v)}
        hint="Required for asset-based pricing only."
      />
    </SchwabSection>
  )
}

function FundingInstructionBlock({
  form,
  index,
}: {
  form: ReturnType<typeof useSchwabFormState>
  index: number
}) {
  const f = (k: string) => `fund${index}${k}`
  return (
    <SchwabSection title={`Appendix A — Managed Account ${index} funding`}>
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="Name of money manager"
          value={form.get(f('ManagerName'))}
          onChange={(v) => form.set(f('ManagerName'), v)}
        />
        <SchwabTextField
          label="Journal from Schwab account number"
          value={form.get(f('JournalFromAccount'))}
          onChange={(v) => form.set(f('JournalFromAccount'), v)}
        />
      </SchwabFieldRow>
      <SchwabTextField
        label="Account registration"
        value={form.get(f('AccountRegistration'))}
        onChange={(v) => form.set(f('AccountRegistration'), v)}
      />
      <SchwabSingleCheckbox
        label="Journal entire account"
        checked={form.getBool(f('JournalEntire'))}
        onChange={(v) => form.set(f('JournalEntire'), v)}
      />
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="Journal cash amount ($)"
          type="number"
          value={form.get(f('JournalCash'))}
          onChange={(v) => form.set(f('JournalCash'), v)}
        />
        <SchwabTextField
          label="Journal the following securities"
          value={form.get(f('JournalSecurities'))}
          onChange={(v) => form.set(f('JournalSecurities'), v)}
        />
      </SchwabFieldRow>
    </SchwabSection>
  )
}

/** Schwab Managed Account Marketplace Application — APP20284. 13 sections + cover + Appendix A. */
export function SchwabManagedAccountForm({ childId }: Props) {
  const form = useSchwabFormState(childId)
  const reg = form.get('section2Registration')
  const isCustodial = reg === 'Custodial'

  return (
    <div className="space-y-0">
      <IaCoverSection form={form} />

      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <ManagedAccountBlock key={i} form={form} index={i} />
      ))}

      <SchwabSection number="2" title="Account registration">
        <SchwabRadioGroup
          label="Registration type"
          options={[
            { value: 'Individual', label: 'Individual' },
            { value: 'Tenants in Common', label: 'Tenants in Common' },
            { value: 'Tenants by the Entirety', label: 'Tenants by the Entirety' },
            { value: 'Joint Tenants With Rights of Survivorship', label: 'Joint Tenants With Rights of Survivorship' },
            { value: 'Community Property', label: 'Community Property' },
            { value: 'Community Property With Rights of Survivorship', label: 'Community Property With Rights of Survivorship' },
            { value: 'Custodial', label: 'Custodial (UTMA/UGMA)' },
            { value: 'Other', label: 'Other' },
          ]}
          value={reg}
          onChange={(v) => form.set('section2Registration', v)}
        />
        {isCustodial && (
          <SchwabFieldRow cols={2}>
            <SchwabTextField
              label="Under laws of (state)"
              value={form.get('section2CustodialState')}
              onChange={(v) => form.set('section2CustodialState', v)}
            />
            <SchwabTextField
              label="Age of termination"
              value={form.get('section2CustodialAge')}
              onChange={(v) => form.set('section2CustodialAge', v)}
            />
          </SchwabFieldRow>
        )}
      </SchwabSection>

      <AccountHolderSection
        form={form}
        prefix=""
        label="Account holder information — Account holder / minor"
        number="3"
        ownerSlot={0}
      />
      <TrustedContactSection form={form} prefix="trustedContact1" label="3a. Trusted Contact Person 1 (Primary)" />
      <TrustedContactSection form={form} prefix="trustedContact2" label="3b. Trusted Contact Person 2 (Primary)" />
      <AccountHolderSection
        form={form}
        prefix="additional"
        label="Additional Account Holder / Custodian"
        number="3c"
        ownerSlot={1}
      />
      <TrustedContactSection form={form} prefix="additionalTrustedContact1" label="3d. Trusted Contact Person 1 (Additional Holder)" />
      <TrustedContactSection form={form} prefix="additionalTrustedContact2" label="3e. Trusted Contact Person 2 (Additional Holder)" />

      <SourceAndPurposeSection form={form} number="4" />

      <AccountFinancialSection form={form} number="4a" />

      <SchwabSection number="5" title="Additional account">
        <SchwabTextField
          label="Linked Schwab master account number"
          value={form.get('section5LinkedMaster')}
          onChange={(v) => form.set('section5LinkedMaster', v)}
        />
        <SchwabRadioGroup
          label="Additional account"
          options={[
            { value: 'open-new', label: 'Open new account' },
            { value: 'open-new-margin', label: 'Open new account with margin' },
            { value: 'designate-existing', label: 'Designate existing Schwab account' },
            { value: 'do-not-open', label: 'Do not open additional account' },
          ]}
          value={form.get('section5AdditionalOption')}
          onChange={(v) => form.set('section5AdditionalOption', v)}
        />
        {form.get('section5AdditionalOption') === 'open-new' && (
          <SchwabTextField
            label="New account Schwab account number"
            value={form.get('section5NewAccountNumber')}
            onChange={(v) => form.set('section5NewAccountNumber', v)}
          />
        )}
        {form.get('section5AdditionalOption') === 'open-new-margin' && (
          <SchwabTextField
            label="New margin account Schwab account number"
            value={form.get('section5NewMarginAccountNumber')}
            onChange={(v) => form.set('section5NewMarginAccountNumber', v)}
          />
        )}
        {form.get('section5AdditionalOption') === 'designate-existing' && (
          <SchwabTextField
            label="Designated existing Schwab account number"
            value={form.get('section5ExistingAccountNumber')}
            onChange={(v) => form.set('section5ExistingAccountNumber', v)}
          />
        )}
        <SchwabTextField
          label="Optional descriptive name (for statement)"
          value={form.get('section5DescriptiveName')}
          onChange={(v) => form.set('section5DescriptiveName', v)}
        />
      </SchwabSection>

      <SchwabSection number="6" title="Optional third-party access to account information">
        <SchwabFieldRow cols={2}>
          <SchwabTextField
            label="Third-party master account number"
            value={form.get('section6ThirdPartyMaster')}
            onChange={(v) => form.set('section6ThirdPartyMaster', v)}
          />
          <SchwabTextField
            label="Third-party name"
            value={form.get('section6ThirdPartyName')}
            onChange={(v) => form.set('section6ThirdPartyName', v)}
          />
        </SchwabFieldRow>
        <SchwabTextField
          label="Third-party street address"
          value={form.get('section6ThirdPartyStreet')}
          onChange={(v) => form.set('section6ThirdPartyStreet', v)}
        />
        <SchwabFieldRow cols={4}>
          <SchwabTextField label="City" value={form.get('section6ThirdPartyCity')} onChange={(v) => form.set('section6ThirdPartyCity', v)} />
          <SchwabTextField label="State / province" value={form.get('section6ThirdPartyState')} onChange={(v) => form.set('section6ThirdPartyState', v)} />
          <SchwabTextField label="Zip / postal code" value={form.get('section6ThirdPartyZip')} onChange={(v) => form.set('section6ThirdPartyZip', v)} />
          <SchwabTextField label="Country" value={form.get('section6ThirdPartyCountry')} onChange={(v) => form.set('section6ThirdPartyCountry', v)} />
        </SchwabFieldRow>
      </SchwabSection>

      <SchwabSection
        number="7"
        title="Consent to enroll in Schwab's Cash Features Program"
        description="Implied by signature in Section 12; Schwab One Interest feature designated."
      >
        <SchwabSingleCheckbox
          label="I acknowledge the Cash Features Program disclosures"
          checked={form.getBool('section7Acknowledge')}
          onChange={(v) => form.set('section7Acknowledge', v)}
        />
      </SchwabSection>

      <SchwabSection number="8" title="Advisor and manager authorizations">
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
          label="Add, change, or terminate a manager authorization"
          checked={form.getBool('section8ManagerChange')}
          onChange={(v) => form.set('section8ManagerChange', v)}
        />
      </SchwabSection>

      <IssuerCommunicationsSection form={form} number="9" intermediaryLabel="Advisor" includeManager />

      <SchwabSection number="10" title="Paperless document enrollment">
        <SchwabSingleCheckbox
          label="Opt out — do not enroll my account in Paperless Documents"
          checked={form.getBool('section10OptOut')}
          onChange={(v) => form.set('section10OptOut', v)}
        />
      </SchwabSection>

      <SchwabSection
        number="11"
        title="Trade confirmation report enrollment"
        description="Signatures for this enrollment are collected later in the signing ceremony."
      >
        <SchwabRadioGroup
          label="Managed Accounts subscription option"
          options={[
            { value: 'new', label: 'New subscription' },
            { value: 'add-existing', label: 'Add to existing subscription' },
          ]}
          value={form.get('section11SubscriptionOption')}
          onChange={(v) => form.set('section11SubscriptionOption', v)}
          inline
        />
        {form.get('section11SubscriptionOption') === 'add-existing' && (
          <SchwabTextField
            label="Existing subscription account number"
            value={form.get('section11ExistingSubscription')}
            onChange={(v) => form.set('section11ExistingSubscription', v)}
          />
        )}
        <SchwabSingleCheckbox
          label="Include additional account in report"
          checked={form.getBool('section11IncludeAdditional')}
          onChange={(v) => form.set('section11IncludeAdditional', v)}
        />
        <SchwabSingleCheckbox
          label="Begin new page for each account"
          checked={form.getBool('section11NewPageEach')}
          onChange={(v) => form.set('section11NewPageEach', v)}
        />
      </SchwabSection>

      <SchwabSection
        number="12"
        title="Authorization to open account(s)"
        description="Account-holder signatures are collected later in the signing ceremony."
      >
        <SchwabSingleCheckbox
          label="Backup withholding exception — item (2) of the W-9 does not apply"
          checked={form.getBool('section12BackupWithholding')}
          onChange={(v) => form.set('section12BackupWithholding', v)}
        />
      </SchwabSection>

      {isCustodial && (
        <SchwabSection
          number="13"
          title="Nominate a successor custodian (Custodial only)"
          description="Custodian and witness signatures are collected later in the signing ceremony."
          conditional
        >
          <SchwabFieldRow cols={2}>
            <SchwabTextField
              label="Name of successor custodian"
              value={form.get('section13SuccessorName')}
              onChange={(v) => form.set('section13SuccessorName', v)}
            />
            <SchwabTextField
              label="Successor custodian SSN"
              value={form.get('section13SuccessorSsn')}
              onChange={(v) => form.set('section13SuccessorSsn', v)}
            />
          </SchwabFieldRow>
          <SchwabTextField
            label="Home street address"
            value={form.get('section13SuccessorStreet')}
            onChange={(v) => form.set('section13SuccessorStreet', v)}
          />
          <SchwabFieldRow cols={3}>
            <SchwabTextField label="City" value={form.get('section13SuccessorCity')} onChange={(v) => form.set('section13SuccessorCity', v)} />
            <SchwabTextField label="State / province" value={form.get('section13SuccessorState')} onChange={(v) => form.set('section13SuccessorState', v)} />
            <SchwabTextField label="Zip / postal code" value={form.get('section13SuccessorZip')} onChange={(v) => form.set('section13SuccessorZip', v)} />
          </SchwabFieldRow>
        </SchwabSection>
      )}

      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <FundingInstructionBlock key={i} form={form} index={i} />
      ))}
    </div>
  )
}
