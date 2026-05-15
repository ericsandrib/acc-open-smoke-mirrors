import { useKycSubjectReviewData } from '@/components/wizard/aml/useKycSubjectReviewData'
import { ReviewSummaryRow, ReviewSummarySection } from '@/components/wizard/aml/ReviewSummaryPrimitives'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'

export function AmlSubjectProfileReviewForm() {
  const { displayName, subjectTypeLabel, isEntity, individual, entity } = useKycSubjectReviewData()

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
        <div className="rounded-md bg-background border border-border p-2 shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-foreground truncate">{displayName}</p>
            <Badge variant="secondary" className="text-[10px] font-medium shrink-0">
              {subjectTypeLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Submitted verification profile for compliance review. Fields are read-only — return the case to the
            advisor if corrections are required.
          </p>
        </div>
      </div>

      {isEntity && entity ? (
        <>
          <ReviewSummarySection title="Entity identity" description="Legal entity registration and tax identifiers.">
            <ReviewSummaryRow label="Legal name" value={entity.legalName} />
            <ReviewSummaryRow label="Entity type" value={entity.entityType} />
            <ReviewSummaryRow label="Tax ID / EIN" value={entity.taxId} />
            <ReviewSummaryRow label="Jurisdiction" value={entity.jurisdiction} />
            <ReviewSummaryRow label="Contact person" value={entity.contactPerson} />
          </ReviewSummarySection>
          <ReviewSummarySection title="Contact & address">
            <ReviewSummaryRow label="Email" value={entity.email} />
            <ReviewSummaryRow label="Phone" value={entity.phone} />
            <ReviewSummaryRow label="Registered address" value={entity.address} />
          </ReviewSummarySection>
          <ReviewSummarySection title="Financial profile">
            <ReviewSummaryRow label="Source of funds" value={entity.sourceOfFunds} />
          </ReviewSummarySection>
        </>
      ) : null}

      {!isEntity && individual ? (
        <>
          <ReviewSummarySection title="Identity" description="Personal identifiers submitted for CIP/AML screening.">
            <ReviewSummaryRow label="Full name" value={individual.fullName} />
            <ReviewSummaryRow label="Date of birth" value={individual.dob} />
            <ReviewSummaryRow label="SSN / Tax ID" value={individual.taxId} />
            <ReviewSummaryRow label="Email" value={individual.email} />
            <ReviewSummaryRow label="Phone" value={individual.phone} />
            <ReviewSummaryRow label="Legal address" value={individual.address} />
          </ReviewSummarySection>
          <ReviewSummarySection title="Employment & source of funds">
            <ReviewSummaryRow label="Employment status" value={individual.employmentStatus} />
            <ReviewSummaryRow label="Employer" value={individual.employerName} />
            <ReviewSummaryRow label="Occupation" value={individual.occupation} />
            <ReviewSummaryRow label="Source of funds" value={individual.sourceOfFunds} />
          </ReviewSummarySection>
        </>
      ) : null}
    </div>
  )
}
