import { useEffect, useMemo, useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { OpenAccountsForm } from './OpenAccountsForm'
import {
  OpenAccountsTaskOverrideProvider,
  useCombinedSectionFocus,
  type CombinedAccordionKey,
} from '@/components/wizard/openAccountsVariantContext'
import {
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import { getAccountOpeningChildSubmissionIssues } from '@/utils/accountOpeningChildProgress'
import { cn } from '@/lib/utils'

export const COMBINED_ACCORDION_PREFIX: Record<CombinedAccordionKey, string> = {
  'no-annuity': 'noann-',
  'with-annuity': 'wann-',
}

/**
 * V2 demo presentation: combine the no-annuity and with-annuity Open Accounts flows into a
 * single task with two accordions. Each accordion overrides the task context so that the
 * shared `OpenAccountsForm` binds to its own underlying task.
 */
export function OpenAccountsCombinedForm() {
  const { state, dispatch } = useWorkflow()
  const { pendingFocus, consumeFocus } = useCombinedSectionFocus()
  const [openAccordions, setOpenAccordions] = useState<string[]>([])

  const noAnnuityTask = useMemo(
    () => state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY),
    [state.tasks],
  )
  const withAnnuityTask = useMemo(
    () => state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY),
    [state.tasks],
  )

  const annuityChildren = useMemo(() => {
    if (!withAnnuityTask) return []
    return (withAnnuityTask.children ?? []).filter((c) => c.childType === 'account-opening')
  }, [withAnnuityTask])

  // When the sidebar requests focus, expand the matching accordion and scroll to its inner
  // section after the next paint. Use a short delay so Radix Accordion has time to render
  // its content before scrollIntoView runs.
  useEffect(() => {
    if (!pendingFocus) return
    setOpenAccordions((prev) =>
      prev.includes(pendingFocus.accordionKey) ? prev : [...prev, pendingFocus.accordionKey],
    )
    const prefix = COMBINED_ACCORDION_PREFIX[pendingFocus.accordionKey]
    const fullId = `${prefix}${pendingFocus.sectionId}`
    const handle = window.setTimeout(() => {
      const el = document.getElementById(fullId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      consumeFocus()
    }, 220)
    return () => window.clearTimeout(handle)
  }, [pendingFocus, consumeFocus])

  const submitToNetX360 = () => {
    if (!withAnnuityTask) return
    for (const child of annuityChildren) {
      if (child.status === 'awaiting_review' || child.status === 'complete') continue
      const issues = getAccountOpeningChildSubmissionIssues(state, child.id)
      if (issues.length > 0) continue
      dispatch({ type: 'ENTER_CHILD_ACTION', childId: child.id })
      dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
      dispatch({ type: 'EXIT_CHILD_ACTION' })
    }
  }

  const annuityCount = annuityChildren.length
  const annuityReadyCount = annuityChildren.filter(
    (c) => getAccountOpeningChildSubmissionIssues(state, c.id).length === 0,
  ).length
  const submitDisabled = annuityCount === 0 || annuityReadyCount === 0

  return (
    <Accordion
      type="multiple"
      value={openAccordions}
      onValueChange={(next) => setOpenAccordions(next as string[])}
      className="space-y-3"
    >
      {noAnnuityTask ? (
        <AccordionItem
          value="no-annuity"
          className="rounded-xl border border-border bg-background overflow-hidden"
        >
          <AccordionTrigger className="px-5 py-4 hover:bg-muted/30">
            <div className="flex flex-col items-start gap-1 text-left">
              <span className="text-base font-semibold">Account Opening (No Annuity)</span>
              <span className="text-xs font-normal text-muted-foreground">
                Standard custodian path. KYC, supporting documents, and eSign run inside this app.
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-6 pt-2">
            <OpenAccountsTaskOverrideProvider
              taskId={noAnnuityTask.id}
              idPrefix={COMBINED_ACCORDION_PREFIX['no-annuity']}
            >
              <OpenAccountsForm />
            </OpenAccountsTaskOverrideProvider>
          </AccordionContent>
        </AccordionItem>
      ) : null}

      {withAnnuityTask ? (
        <AccordionItem
          value="with-annuity"
          className="rounded-xl border border-border bg-background overflow-hidden"
        >
          <AccordionTrigger className="px-5 py-4 hover:bg-muted/30">
            <div className="flex w-full flex-col items-start gap-1 text-left">
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-base font-semibold">Account Opening (With Annuity)</span>
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium bg-violet-50 text-violet-700 border-violet-200"
                >
                  External · NetX360
                </Badge>
              </div>
              <span className="text-xs font-normal text-muted-foreground">
                Annuity path. KYC and eSign run in NetX360, not in this demo.
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-6 pt-2">
            <OpenAccountsTaskOverrideProvider
              taskId={withAnnuityTask.id}
              idPrefix={COMBINED_ACCORDION_PREFIX['with-annuity']}
            >
              <OpenAccountsForm />
            </OpenAccountsTaskOverrideProvider>
            <div className="mt-8 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Hand off to NetX360</p>
                <p className="text-xs text-muted-foreground">
                  {annuityCount === 0
                    ? 'Add at least one annuity account above before submitting to NetX360.'
                    : `${annuityReadyCount} of ${annuityCount} annuity ${
                        annuityCount === 1 ? 'account' : 'accounts'
                      } ready for handoff.`}
                </p>
              </div>
              <Button
                type="button"
                onClick={submitToNetX360}
                disabled={submitDisabled}
                className={cn('gap-1.5 self-start sm:self-auto')}
              >
                <Send className="h-4 w-4" />
                Submit to NetX360
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  )
}
