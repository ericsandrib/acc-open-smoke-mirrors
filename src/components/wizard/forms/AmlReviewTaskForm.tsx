import { useMemo, useState } from 'react'
import { useChildActionContext, useWorkflow } from '@/stores/workflowStore'
import { getOwnerReviewState } from '@/utils/ownerKycReview'
import { getAccountPartiesRequiringKyc } from '@/utils/accountOpeningOwnerKyc'
import { VerificationDetailsPanel } from '@/components/wizard/verification/VerificationDetailsPanel'
import { VerificationSubjectDetailSheet } from '@/components/wizard/verification/VerificationSubjectDetailSheet'
import { VerificationSubjectList } from '@/components/wizard/verification/VerificationSubjectList'
import { VerificationSubjectRow } from '@/components/wizard/verification/VerificationSubjectRow'
import {
  getVerificationSubjectTypeLabel,
  sortPartiesByVerificationPriority,
} from '@/utils/ownerVerificationSubjectUx'
import { getKycStatusBadge } from '@/utils/kycStatus'

export function AmlReviewTaskForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  if (!ctx || ctx.child.childType !== 'account-opening') return null

  const accountChildId = ctx.child.id
  const parties = getAccountPartiesRequiringKyc(state, accountChildId)
  const ownerForParty = (partyId: string) => getOwnerReviewState(state, accountChildId, partyId)

  const sortedParties = useMemo(
    () => sortPartiesByVerificationPriority(parties, ownerForParty),
    [parties, state.childReviewsByChildId, accountChildId],
  )

  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const selectedParty = selectedPartyId
    ? sortedParties.find((p) => p.id === selectedPartyId) ?? null
    : null

  return (
    <div className="space-y-5">
      {parties.length === 0 && (
        <p className="text-sm text-muted-foreground">No natural-person owners require AML screening for this account.</p>
      )}

      {parties.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">Participants</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select a participant to review AML screening details.
            </p>
          </div>

          <VerificationSubjectList>
            {sortedParties.map((party) => (
              <VerificationSubjectRow
                key={party.id}
                name={party.name}
                subjectTypeLabel={getVerificationSubjectTypeLabel(party, state, accountChildId)}
                badge={getKycStatusBadge(ownerForParty(party.id), party)}
                onClick={() => setSelectedPartyId(party.id)}
              />
            ))}
          </VerificationSubjectList>
        </div>
      )}

      <VerificationSubjectDetailSheet
        open={selectedParty != null}
        onOpenChange={(open) => {
          if (!open) setSelectedPartyId(null)
        }}
        title={selectedParty?.name ?? 'Verification details'}
        description={
          selectedParty
            ? getVerificationSubjectTypeLabel(selectedParty, state, accountChildId)
            : undefined
        }
      >
        {selectedParty ? (
          <VerificationDetailsPanel
            accountChildId={accountChildId}
            party={selectedParty}
            owner={ownerForParty(selectedParty.id)}
            focus="aml"
          />
        ) : null}
      </VerificationSubjectDetailSheet>
    </div>
  )
}
