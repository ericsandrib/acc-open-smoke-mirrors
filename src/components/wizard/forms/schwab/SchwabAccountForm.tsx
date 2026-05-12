import { useWorkflow } from '@/stores/workflowStore'
import type { ChildTask } from '@/types/workflow'
import { findChildTaskById } from './findChildTask'
import { getSchwabFormKey, SCHWAB_FORM_LABELS, SCHWAB_FORM_CODES } from './registrationToSchwabForm'
import type { CustodianId, SchwabApplicationType } from '@/utils/custodians'
import { SchwabOnePersonalForm } from './SchwabOnePersonalForm'
import { SchwabIraForm } from './SchwabIraForm'
import { SchwabManagedAccountForm } from './SchwabManagedAccountForm'
import { SchwabTransferForm } from './SchwabTransferForm'

interface Props {
  childId: string
}

/**
 * Custodian-native form router for Schwab. Reads `custodian` and
 * `applicationType` from this child's taskData and renders the appropriate
 * Schwab paperwork (One Personal / IRA / Managed Account / Transfer).
 */
export function SchwabAccountForm({ childId }: Props) {
  const { state } = useWorkflow()
  const data = state.taskData[childId] ?? {}
  const custodian = data.custodian as CustodianId | undefined
  const applicationType = data.applicationType as SchwabApplicationType | undefined

  if (custodian !== 'schwab') return null

  const formKey = getSchwabFormKey(applicationType)

  let body: React.ReactNode = null
  switch (formKey) {
    case 'schwab-one-personal':
      body = <SchwabOnePersonalForm childId={childId} />
      break
    case 'schwab-ira':
      body = <SchwabIraForm childId={childId} />
      break
    case 'schwab-managed-account':
      body = <SchwabManagedAccountForm childId={childId} />
      break
    case 'schwab-transfer':
      body = <SchwabTransferForm childId={childId} />
      break
  }

  const child: ChildTask | undefined = findChildTaskById(state.tasks, childId)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center gap-3 justify-between">
        <div className="space-y-0.5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Charles Schwab native application
          </div>
          <div className="text-sm font-semibold">{SCHWAB_FORM_LABELS[formKey]}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Form code</div>
          <div className="text-sm font-mono">{SCHWAB_FORM_CODES[formKey]}</div>
        </div>
      </div>
      {child ? (
        <div className="text-xs text-muted-foreground">
          Pre-populated from upstream household, related-party, and advisor data. Fields update the
          {' '}<code className="font-mono">{child.name}</code> account's draft application.
        </div>
      ) : null}
      {body}
    </div>
  )
}
