import { useState } from 'react'
import { ExternalLink, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkflow } from '@/stores/workflowStore'
import { CompleteAccountOpeningConfirmModal } from '@/components/wizard/WizardFooter'
import { getOpenAccountsSubmitForReviewBlockers } from '@/utils/openAccountsDocumentValidation'

const NETX360_DEEPLINK = 'https://xat-www2.netx360.inautix.com/plus/servicing/account-service/client-onboarding'

/** Deeplink to the NetX360 onboarding workflow (a separate platform). */
export function Netx360HandoffSection({ disabled = false }: { disabled?: boolean }) {
  const button = (
    <Button type="button" variant="outline" className="gap-1.5" disabled={disabled}>
      Continue in NetX360
      <ExternalLink className="h-3.5 w-3.5" />
    </Button>
  )

  if (disabled) {
    return (
      <span className="inline-block" aria-disabled="true">
        {button}
      </span>
    )
  }

  return (
    <a href={NETX360_DEEPLINK} target="_blank" rel="noreferrer" className="inline-block">
      {button}
    </a>
  )
}

/** Submit annuity account-opening children for review (drives the demo's submit flow). */
export function Netx360SubmitSection({
  taskId,
  onSubmitted,
}: {
  taskId: string
  onSubmitted?: () => void
}) {
  const { state, dispatch } = useWorkflow()
  const [modalOpen, setModalOpen] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  const task = state.tasks.find((t) => t.id === taskId)
  const accountOpeningChildren = (task?.children ?? []).filter((c) => c.childType === 'account-opening')
  const hasSubmittable = accountOpeningChildren.some(
    (c) => c.status !== 'awaiting_review' && c.status !== 'complete' && c.status !== 'canceled',
  )

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setWarnings([])
          setModalOpen(true)
        }}
        disabled={!hasSubmittable}
        className="gap-1.5"
      >
        <Send className="h-4 w-4" />
        Submit to NetX360
      </Button>
      {modalOpen && (
        <CompleteAccountOpeningConfirmModal
          mode="submit-children"
          submitButtonLabel="Submit to NetX360"
          warnings={warnings}
          onCancel={() => {
            setModalOpen(false)
            setWarnings([])
          }}
          onConfirm={() => {
            const blockers = getOpenAccountsSubmitForReviewBlockers(state, taskId)
            if (blockers.length > 0) {
              setWarnings(blockers)
              return
            }
            dispatch({
              type: 'SUBMIT_ALL_ACCOUNT_OPENING_CHILDREN_FOR_REVIEW',
              openAccountsTaskId: taskId,
            })
            onSubmitted?.()
            setModalOpen(false)
            setWarnings([])
          }}
        />
      )}
    </>
  )
}
