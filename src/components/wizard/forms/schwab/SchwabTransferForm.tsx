import { useSchwabFormState } from './useSchwabFormState'
import {
  SchwabSection,
  SchwabFieldRow,
  SchwabTextField,
  SchwabRadioGroup,
  SchwabSingleCheckbox,
} from './schwabPrimitives'
import { AccountFinancialSection } from './AccountFinancialSection'

interface SchwabTransferFormProps {
  childId: string
}

/** Schwab Transfer Your Account to Schwab — APP10864 (5 pages, 6 sections). */
export function SchwabTransferForm({ childId }: SchwabTransferFormProps) {
  const form = useSchwabFormState(childId)

  return (
    <div className="space-y-0">
      <SchwabSection
        number="1"
        title="Tell us about your Schwab account"
        description="If you are opening a new Schwab account, you can leave the Schwab account number field blank."
      >
        <SchwabTextField
          label="Name(s) on the Schwab account"
          value={form.get('schwabAccountNames')}
          onChange={(v) => form.set('schwabAccountNames', v)}
          hint="List all names exactly as they appear on the account."
        />
        <SchwabFieldRow cols={3}>
          <SchwabTextField
            label="Account type / registration"
            value={form.get('schwabAccountType')}
            onChange={(v) => form.set('schwabAccountType', v)}
          />
          <SchwabTextField
            label="Schwab account number"
            value={form.get('schwabAccountNumber')}
            onChange={(v) => form.set('schwabAccountNumber', v)}
          />
          <SchwabTextField
            label="Social Security / Tax ID"
            value={form.get('ssn')}
            onChange={(v) => form.set('ssn', v)}
          />
        </SchwabFieldRow>
      </SchwabSection>

      <SchwabSection
        number="2"
        title="Tell us about the account you're transferring"
        description="Attach the most recent statement (dated within 90 days). For name discrepancies, attach the additional documents indicated below."
      >
        <SchwabFieldRow cols={2}>
          <SchwabTextField
            label="Name of firm, mutual fund company, or insurance company"
            value={form.get('deliveringFirmName')}
            onChange={(v) => form.set('deliveringFirmName', v)}
          />
          <SchwabTextField
            label="Delivering firm telephone number"
            type="tel"
            value={form.get('deliveringFirmPhone')}
            onChange={(v) => form.set('deliveringFirmPhone', v)}
          />
        </SchwabFieldRow>
        <SchwabFieldRow cols={3}>
          <SchwabTextField
            label="Name and title of account"
            value={form.get('deliveringAccountTitle')}
            onChange={(v) => form.set('deliveringAccountTitle', v)}
          />
          <SchwabTextField
            label="Account number (delivering firm)"
            value={form.get('deliveringAccountNumber')}
            onChange={(v) => form.set('deliveringAccountNumber', v)}
          />
          <SchwabTextField
            label="Account type / registration"
            value={form.get('deliveringAccountType')}
            onChange={(v) => form.set('deliveringAccountType', v)}
          />
        </SchwabFieldRow>
        <SchwabSingleCheckbox
          label="Last name changed — attach a certified marriage certificate, divorce decree, or other certified court document"
          checked={form.getBool('lastNameChangedDoc')}
          onChange={(v) => form.set('lastNameChangedDoc', v)}
        />
        <SchwabSingleCheckbox
          label="First / middle name changed or listed differently — attach a court document or second-name letter"
          checked={form.getBool('firstNameChangedDoc')}
          onChange={(v) => form.set('firstNameChangedDoc', v)}
        />
      </SchwabSection>

      <SchwabSection
        number="3"
        title="Credit union, bank, brokerage, trust company, and/or dividend reinvestment transfers"
        description="Complete only if applicable. If the account holds pooled investments, alternatives, or unregistered securities, contact your Investment Advisor first."
      >
        <SchwabRadioGroup
          label="Amount of transfer"
          options={[
            { value: 'full', label: 'Full — transfer my entire account in kind (skip to Section 6)' },
            { value: 'partial', label: 'Partial — transfer the cash amount and/or assets below' },
          ]}
          value={form.get('section3Amount')}
          onChange={(v) => form.set('section3Amount', v)}
        />
        {form.get('section3Amount') === 'partial' && (
          <>
            <SchwabTextField
              label="Partial cash amount ($)"
              type="number"
              value={form.get('section3PartialCash')}
              onChange={(v) => form.set('section3PartialCash', v)}
            />
            <div className="space-y-2">
              <p className="text-xs font-medium">Partial transfer asset list</p>
              {[1, 2, 3, 4].map((row) => (
                <SchwabFieldRow key={row} cols={2}>
                  <SchwabTextField
                    label={`Description of asset (row ${row})`}
                    value={form.get(`section3AssetDesc${row}`)}
                    onChange={(v) => form.set(`section3AssetDesc${row}`, v)}
                  />
                  <SchwabTextField
                    label={`Quantity (row ${row})`}
                    value={form.get(`section3AssetQty${row}`)}
                    onChange={(v) => form.set(`section3AssetQty${row}`, v)}
                    hint="# of shares or &quot;ALL&quot;"
                  />
                </SchwabFieldRow>
              ))}
            </div>
          </>
        )}
      </SchwabSection>

      <SchwabSection
        number="4"
        title="Certificate of Deposit (CD) and annuity transfer"
        description="Do not complete this section for 1035 annuity exchanges (call 1-888-745-9676 for those)."
      >
        <SchwabRadioGroup
          label="Surrender / liquidate election"
          options={[
            { value: 'immediate-all', label: 'Surrender immediately — All proceeds' },
            { value: 'immediate-partial', label: 'Surrender immediately — Partial' },
            { value: 'maturity-all', label: 'Surrender at maturity — All proceeds' },
            { value: 'maturity-partial', label: 'Surrender at maturity — Partial' },
          ]}
          value={form.get('section4Option')}
          onChange={(v) => form.set('section4Option', v)}
        />
        {form.get('section4Option').startsWith('maturity') && (
          <SchwabTextField
            label="Maturity date"
            type="date"
            value={form.get('section4MaturityDate')}
            onChange={(v) => form.set('section4MaturityDate', v)}
          />
        )}
        {form.get('section4Option').endsWith('all') && (
          <SchwabTextField
            label="Expected proceeds ($)"
            type="number"
            value={form.get('section4AllAmount')}
            onChange={(v) => form.set('section4AllAmount', v)}
          />
        )}
        {form.get('section4Option').endsWith('partial') && (
          <SchwabTextField
            label="Partial amount ($)"
            type="number"
            value={form.get('section4PartialAmount')}
            onChange={(v) => form.set('section4PartialAmount', v)}
          />
        )}
      </SchwabSection>

      <SchwabSection
        number="5"
        title="Mutual fund company transfers"
        description="Complete only if applicable. Use a separate row per fund."
      >
        <SchwabRadioGroup
          label="Type of transfer"
          options={[
            { value: 'full', label: 'Full' },
            { value: 'partial', label: 'Partial' },
          ]}
          value={form.get('section5Type')}
          onChange={(v) => form.set('section5Type', v)}
          inline
        />
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="rounded-md border border-border p-3 space-y-3">
              <div className="text-xs font-medium text-muted-foreground">Mutual fund {row}</div>
              <SchwabFieldRow cols={3}>
                <SchwabTextField
                  label="Fund name, CUSIP, and/or symbol"
                  value={form.get(`section5Fund${row}Name`)}
                  onChange={(v) => form.set(`section5Fund${row}Name`, v)}
                />
                <SchwabTextField
                  label="Fund account number"
                  value={form.get(`section5Fund${row}Acct`)}
                  onChange={(v) => form.set(`section5Fund${row}Acct`, v)}
                />
                <SchwabTextField
                  label="Quantity"
                  value={form.get(`section5Fund${row}Qty`)}
                  onChange={(v) => form.set(`section5Fund${row}Qty`, v)}
                  hint="# of shares or &quot;ALL&quot;"
                />
              </SchwabFieldRow>
              <SchwabRadioGroup
                label="Handling"
                options={[
                  { value: 'in-kind', label: 'In Kind' },
                  { value: 'liquidate', label: 'Liquidate' },
                ]}
                inline
                value={form.get(`section5Fund${row}Handling`)}
                onChange={(v) => form.set(`section5Fund${row}Handling`, v)}
              />
              <SchwabRadioGroup
                label="Future dividends and capital gains"
                options={[
                  { value: 'pay-cash', label: 'Pay cash' },
                  { value: 'reinvest', label: 'Reinvest' },
                  { value: 'pay-reinvest', label: 'Pay / Reinvest mix' },
                ]}
                inline
                value={form.get(`section5Fund${row}Distrib`)}
                onChange={(v) => form.set(`section5Fund${row}Distrib`, v)}
              />
            </div>
          ))}
        </div>
      </SchwabSection>

      <SchwabSection
        number="6"
        title="Transfer attachments and acknowledgments"
        description="Account-holder and co-trustee signatures are collected later in the signing ceremony."
      >
        <SchwabSingleCheckbox
          label="Attach a copy of most recent statement"
          checked={form.getBool('section6AttachStatement')}
          onChange={(v) => form.set('section6AttachStatement', v)}
        />
        <SchwabSingleCheckbox
          label="Attach necessary additional documents listed in Section 2"
          checked={form.getBool('section6AttachAdditional')}
          onChange={(v) => form.set('section6AttachAdditional', v)}
        />
      </SchwabSection>

      <AccountFinancialSection form={form} number="7" />
    </div>
  )
}
