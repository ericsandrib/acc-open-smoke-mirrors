import { useWorkflow } from '@/stores/workflowStore'
import type { CustodianId } from '@/utils/custodians'
import { getSeiFormForRegistration } from '@/data/sei/seiRegistrationToForm'
import { SeiDynamicForm } from './SeiDynamicForm'

interface Props {
  childId: string
}

/**
 * Custodian-native form router for SEI. Reads `custodian` + the SEI registration
 * id (written by the picker as `applicationType`, or `seiRegistrationType` if
 * present) from this child's taskData, resolves the SEI form variant (A–J), and
 * renders the data-driven dynamic form.
 */
export function SeiAccountForm({ childId }: Props) {
  const { state } = useWorkflow()
  const data = state.taskData[childId] ?? {}
  const custodian = data.custodian as CustodianId | undefined
  const registrationId =
    (data.seiRegistrationType as string | undefined) ||
    (data.applicationType as string | undefined) ||
    undefined

  if (custodian !== 'sei') return null

  const letter = getSeiFormForRegistration(registrationId)

  if (!letter) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Select a registration type for this account to begin the SEI application.
      </div>
    )
  }

  return <SeiDynamicForm childId={childId} letter={letter} />
}
