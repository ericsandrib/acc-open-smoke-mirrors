import { useTaskData, useWorkflow } from '@/stores/workflowStore'
import { FinancialAccountsForm } from './FinancialAccountsForm'
import { getAllOpenAccountsTasks } from '@/utils/openAccountsTaskContext'
import { cn } from '@/lib/utils'
import { useOpenAccountsVariant } from '@/components/wizard/openAccountsVariantContext'

export function ExistingAccountsForm() {
  const { state, dispatch } = useWorkflow()
  const { data, updateField } = useTaskData('open-accounts')
  const variant = useOpenAccountsVariant()
  const isVersion2 = variant === 'v2'
  const isColoredBackgroundVariant = variant === 'v3' || variant === 'v4'
  const isCardVariant = variant === 'v2' || isColoredBackgroundVariant
  const isBorderedCardVariant = variant === 'v2' || variant === 'v4'
  const cardContainerClass = isCardVariant
    ? cn(
        'rounded-xl p-6 overflow-hidden',
        isVersion2 && 'border border-border',
        variant === 'v4' && 'border border-border/60',
        variant === 'v3'
          ? 'bg-[#fafafa]'
          : variant === 'v4'
            ? 'bg-white'
            : isColoredBackgroundVariant
              ? 'bg-[#fcfcfc]'
              : 'bg-background',
      )
    : ''

  const setAdditionalOnAll = (v: string) => {
    updateField('additionalInstructions', v)
    for (const t of getAllOpenAccountsTasks(state)) {
      if (t.id === 'open-accounts') continue
      dispatch({ type: 'SET_TASK_DATA', taskId: t.id, fields: { additionalInstructions: v } })
    }
  }

  return (
    <div className="space-y-7">
      <section id="ea-existing-accounts" className="scroll-mt-16">
        <div className={cardContainerClass}>
          <div
            className={cn(
              'mb-4',
              isCardVariant &&
                cn(
                  '-mx-6 -mt-6 px-6 py-4',
                  isBorderedCardVariant && 'border-b border-border/60',
                  variant === 'v2' && 'bg-[#F5F5F4]',
                ),
            )}
          >
            <h3
              className={cn(
                isCardVariant
                  ? 'text-sm font-semibold uppercase tracking-wide'
                  : 'text-base font-semibold',
              )}
            >
              Accounts
            </h3>
            <p className={cn(isCardVariant ? 'text-sm text-muted-foreground mt-2' : 'text-base text-muted-foreground')}>
              Add or update the client&apos;s existing accounts to provide a complete financial picture.
            </p>
          </div>
          <FinancialAccountsForm />
        </div>
      </section>

      <section id="ea-additional-instructions" className="scroll-mt-16">
        <div className={cardContainerClass}>
          <div
            className={cn(
              'mb-4',
              isCardVariant &&
                cn(
                  '-mx-6 -mt-6 px-6 py-4',
                  isBorderedCardVariant && 'border-b border-border/60',
                  variant === 'v2' && 'bg-[#F5F5F4]',
                ),
            )}
          >
            <h3
              className={cn(
                isCardVariant
                  ? 'text-sm font-semibold uppercase tracking-wide'
                  : 'text-base font-semibold',
              )}
            >
              Additional Instructions
            </h3>
            <p className={cn(isCardVariant ? 'text-sm text-muted-foreground mt-2' : 'text-base text-muted-foreground mt-2')}>
              Provide any special instructions related to opening or funding new accounts (e.g., transfers, rollovers, or funding sources).
            </p>
          </div>
          <textarea
            id="additionalInstructions"
            className="flex min-h-[18.67rem] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Account opening and funding notes for the new accounts (custodian, transfers, rollovers, timing, client requests)."
            value={(data.additionalInstructions as string) ?? ''}
            onChange={(e) => setAdditionalOnAll(e.target.value)}
          />
        </div>
      </section>
    </div>
  )
}
