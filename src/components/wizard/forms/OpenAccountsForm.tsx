import { useState } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { AccountTypePickerDialog } from './AccountTypePickerDialog'
import { getRequiredDocuments } from '@/utils/accountDocuments'
import type { AccountType } from '@/types/workflow'
import {
  ChevronRight,
  Plus,
  Wallet,
  FileText,
  FileSignature,
  ClipboardList,
  Circle,
} from 'lucide-react'

const accountTypeLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  checking: 'Checking',
  savings: 'Savings',
}

export function OpenAccountsForm() {
  const { state, dispatch } = useWorkflow()
  const { data, updateField } = useTaskData('open-accounts')
  const [pickerOpen, setPickerOpen] = useState(false)

  const openAccountsTask = state.tasks.find((t) => t.formKey === 'open-accounts')
  const children = openAccountsTask?.children ?? []

  // Collect account types from children's task data for document requirements
  const childAccountTypes: AccountType[] = children
    .map((c) => {
      const childData = state.taskData[`${c.id}-details`]
      return (childData?.accountType as AccountType) ?? null
    })
    .filter((t): t is AccountType => t !== null)

  // Also parse account type from child names as fallback
  const accountTypesFromNames: AccountType[] = children
    .map((c) => {
      for (const [type, label] of Object.entries(accountTypeLabels)) {
        if (c.name.startsWith(label)) return type as AccountType
      }
      return null
    })
    .filter((t): t is AccountType => t !== null)

  const allAccountTypes = childAccountTypes.length > 0 ? childAccountTypes : accountTypesFromNames
  const requiredDocs = getRequiredDocuments(allAccountTypes)

  const handlePickerConfirm = (selections: { accountType: AccountType; label: string; count: number }[]) => {
    for (const sel of selections) {
      for (let i = 1; i <= sel.count; i++) {
        const name = sel.count > 1 ? `${sel.label} Account ${i}` : `${sel.label} Account`
        dispatch({
          type: 'SPAWN_CHILD',
          parentTaskId: openAccountsTask!.id,
          childName: name,
          childType: 'account-opening',
        })
        // Small delay to ensure unique timestamps
      }
    }
    setPickerOpen(false)
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Existing Accounts */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Existing Accounts
          </h3>
        </div>
        {state.financialAccounts.length > 0 ? (
          <div className="rounded-lg border border-border divide-y divide-border">
            {state.financialAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{account.accountName}</span>
                  {account.accountType && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {accountTypeLabels[account.accountType]}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {account.custodian && <span>{account.custodian}</span>}
                  {account.estimatedValue && (
                    <span className="tabular-nums font-medium text-foreground">
                      ${account.estimatedValue}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No existing accounts. Add accounts in the Financial Accounts step.
            </p>
          </div>
        )}
      </section>

      {/* Section 2: Additional Instructions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="additionalInstructions" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Additional Instructions
          </Label>
        </div>
        <textarea
          id="additionalInstructions"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter any special instructions for account opening..."
          value={(data.additionalInstructions as string) ?? ''}
          onChange={(e) => updateField('additionalInstructions', e.target.value)}
        />
      </section>

      {/* Section 3: Accounts to be Opened */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Accounts to be Opened
            </h3>
          </div>
          {children.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add More
            </Button>
          )}
        </div>

        {children.length > 0 ? (
          <div className="space-y-2">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', taskId: `${child.id}-details` })}
                className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{child.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize text-xs">
                    {child.status.replace('_', ' ')}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-3">
              No accounts to open yet. Add the types of accounts you want to open.
            </p>
            <Button onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Accounts
            </Button>
          </div>
        )}

        <AccountTypePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onConfirm={handlePickerConfirm}
        />
      </section>

      {/* Section 4: Required Documents */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Required Documents
          </h3>
        </div>
        {children.length > 0 && requiredDocs.length > 0 ? (
          <div className="rounded-lg border border-border divide-y divide-border">
            {requiredDocs.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3 px-4 py-3">
                <Circle className="h-4 w-4 mt-0.5 text-muted-foreground/50 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{doc.label}</p>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {children.length === 0
                ? 'Add accounts above to see required documents.'
                : 'No additional documents required.'}
            </p>
          </div>
        )}
      </section>

      {/* Section 5: DocuSign Placeholder */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FileSignature className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            DocuSign
          </h3>
        </div>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <FileSignature className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            DocuSign Integration
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Envelope creation and signature collection will be available here.
          </p>
        </div>
      </section>
    </div>
  )
}
