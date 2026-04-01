import { useState } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { AccountTypePickerDialog } from './AccountTypePickerDialog'
import { getRequiredDocuments } from '@/utils/accountDocuments'
import type { AccountType } from '@/types/workflow'
import { FileUpload, type FileWithStatus } from '@/components/ui/file-upload'
import {
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Shield,
  Wallet,
  FileText,
  FileSignature,
  ClipboardList,
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
  const [refOpen, setRefOpen] = useState(true)

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

  // Annuity helpers
  const isAnnuity = (child: { name: string }) => child.name.includes(' - Annuity')
  const topLevelChildren = children.filter((c) => !isAnnuity(c))
  const getAnnuities = (parentName: string) =>
    children.filter((c) => c.name.startsWith(`${parentName} - Annuity`))

  const handleAddAnnuity = (parentName: string) => {
    const existing = getAnnuities(parentName)
    const nextNum = existing.length + 1
    dispatch({
      type: 'SPAWN_CHILD',
      parentTaskId: openAccountsTask!.id,
      childName: `${parentName} - Annuity ${nextNum}`,
      childType: 'account-opening',
    })
  }

  const handleRemoveLastAnnuity = (parentName: string) => {
    const existing = getAnnuities(parentName)
    if (existing.length === 0) return
    const last = existing[existing.length - 1]
    dispatch({
      type: 'REMOVE_CHILD',
      parentTaskId: openAccountsTask!.id,
      childId: last.id,
    })
  }

  const handlePickerConfirm = (selections: { accountType: AccountType; label: string; count: number; withAnnuityCount: number }[]) => {
    for (const sel of selections) {
      const totalPlain = sel.count
      const totalWithAnnuity = sel.withAnnuityCount
      const totalForType = totalPlain + totalWithAnnuity
      for (let i = 1; i <= totalForType; i++) {
        const name = totalForType > 1 ? `${sel.label} Account ${i}` : `${sel.label} Account`
        dispatch({
          type: 'SPAWN_CHILD',
          parentTaskId: openAccountsTask!.id,
          childName: name,
          childType: 'account-opening',
        })
        // Accounts beyond the plain count get an annuity
        if (i > totalPlain) {
          dispatch({
            type: 'SPAWN_CHILD',
            parentTaskId: openAccountsTask!.id,
            childName: `${name} - Annuity 1`,
            childType: 'account-opening',
          })
        }
      }
    }
    setPickerOpen(false)
  }

  return (
    <div className="space-y-8">
      {/* Collapsible Reference section */}
      <section className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setRefOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Reference
          </h3>
          {refOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {refOpen && (
          <div className="px-4 pb-4 space-y-6 border-t border-border pt-4">
            {/* Existing Accounts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">
                  Existing Accounts
                </h4>
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
                <p className="text-sm text-muted-foreground">
                  No existing accounts. Add accounts in the Financial Accounts step.
                </p>
              )}
            </div>

            {/* Additional Instructions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="additionalInstructions" className="text-sm font-medium text-muted-foreground">
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
            </div>
          </div>
        )}
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
            {topLevelChildren.map((child) => {
              const annuities = getAnnuities(child.name)
              return (
                <div key={child.id} className="space-y-1">
                  {/* Account row */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', taskId: `${child.id}-details` })}
                      className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{child.name}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {child.status.replace('_', ' ')}
                      </Badge>
                      <button
                        onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', taskId: `${child.id}-details` })}
                        className="cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Annuity row with +/- counter */}
                  {annuities.length > 0 && (
                    <div className="ml-8 flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Annuities</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemoveLastAnnuity(child.name)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums font-medium">
                          {annuities.length}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleAddAnnuity(child.name)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
          <div className="space-y-4">
            {requiredDocs.map((doc) => {
              const storedFiles = (data[`doc-${doc.id}`] as { name: string; size?: number }[] | undefined) ?? []

              return (
                <FileUpload
                  key={doc.id}
                  id={`open-accts-${doc.id}`}
                  label={doc.label}
                  subtitle={doc.description}
                  initialFiles={storedFiles}
                  onFilesChange={(files: FileWithStatus[]) => {
                    const meta = files.map((f) => ({
                      name: f.file.name,
                      size: f.file.size,
                    }))
                    updateField(`doc-${doc.id}`, meta)
                  }}
                />
              )
            })}
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
