import { useEffect, useMemo, useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
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
  const { state } = useWorkflow()
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
          className="rounded-xl border border-border/60 bg-background overflow-hidden"
        >
          <AccordionTrigger className="px-5 py-4 hover:bg-muted/30">
            <div className="flex flex-col items-start gap-1 text-left">
              <span className="text-base font-semibold">Accounts without Annuities</span>
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
          className="rounded-xl border border-border/60 bg-background overflow-hidden"
        >
          <AccordionTrigger className="px-5 py-4 hover:bg-muted/30">
            <div className="flex w-full flex-col items-start gap-1 text-left">
              <div className="flex w-full items-center justify-between gap-3">
                <span className="text-base font-semibold">Accounts with Annuities</span>
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium bg-violet-50 text-violet-700 border-violet-200"
                >
                  NetX360
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
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  )
}
