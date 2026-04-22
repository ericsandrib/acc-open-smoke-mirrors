import { useState } from 'react'
import { useWorkflow, useChildActionContext, getChildReviewState } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  ShieldAlert,
  ShieldCheck,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Globe,
  Landmark,
  Clock,
} from 'lucide-react'

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function AccordionSection({ value, title, icon: Icon, badge, children }: {
  value: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <AccordionItem value={value} className="rounded-lg border border-border overflow-hidden bg-background">
      <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 border-b border-border data-[state=open]:border-b">
        <span className="flex flex-1 items-center justify-between gap-3 pr-2">
          <span className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold truncate">{title}</span>
          </span>
          {badge ? <span className="shrink-0" onClick={(e) => e.stopPropagation()}>{badge}</span> : null}
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-0 pb-0">
        <div className="px-4 py-2 divide-y divide-border border-t-0">
          {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

const AML_SECTION_DEFAULTS = [
  'individual',
  'ofac',
  'pep',
  'risk',
  'source-funds',
  'case-notes',
] as const

const AML_ENTITY_SECTION_DEFAULTS = [
  'entity',
  'ofac',
  'pep',
  'risk',
  'source-funds',
  'case-notes',
] as const

/**
 * Demo: values as if returned from an AML screening API (complete — no pending placeholders).
 * When `amlReview.status === 'flagged'`, section-specific flagged copy still overrides in the UI.
 */
const AML_API_SCREENING = {
  ofacSdn: 'No match',
  consolidatedSanctions: 'No match',
  euSanctions: 'No match',
  unSanctions: 'No match',
  pep: 'Not a PEP',
  pepLevel: 'N/A',
  adverseMedia: 'No adverse media found',
  negativeNews: 'None found',
  customerRiskRating: 'Low',
  riskScore: '12 / 100',
  geographicRisk: 'Low — Domestic',
  productRisk: 'Standard',
  declaredSourceFallback: 'Salary, savings, and prior-year investment proceeds',
  employmentFallback: 'Employed — full-time',
  annualIncomeFallback: '$150,000–$249,999',
  netWorthFallback: '$500,000–$999,999',
  caseNotesFallback:
    'Automated screening batch AML-2025-18492. Watchlist queries: clear. Last refresh: sync with vendor API.',
} as const

export function ChildAmlReviewContent() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  if (!ctx) return null

  const { child } = ctx
  const reviewState = getChildReviewState(state, child.id)
  const amlReview = reviewState?.amlReview
  const amlFlagged = reviewState?.amlFlagged
  const amlNotes = reviewState?.amlNotes
  const [caseNotes, setCaseNotes] = useState(amlNotes ?? AML_API_SCREENING.caseNotesFallback)

  const childMeta = (state.taskData[child.id] as Record<string, unknown> | undefined) ?? {}
  const subjectPartyId = childMeta.kycSubjectPartyId as string | undefined
  const subjectType = childMeta.kycSubjectType === 'entity' ? 'entity' : 'individual'
  const isEntity = subjectType === 'entity'
  const party = state.relatedParties.find((p) => p.id === subjectPartyId) ?? state.relatedParties.find((p) => p.name === child.name)
  const taskData = state.taskData[`${child.id}-info`] ?? {}

  const firstName = (taskData.firstName as string) || party?.firstName || ''
  const lastName = (taskData.lastName as string) || party?.lastName || ''
  const legalName = (taskData.legalName as string) || party?.organizationName || child.name
  const fullName = isEntity ? legalName : `${firstName} ${lastName}`.trim() || child.name
  const dob = (taskData.dob as string) || party?.dob || ''
  const ssn = (taskData.taxId as string) || party?.taxId || party?.ssn || ''
  const email = (taskData.email as string) || party?.email || ''
  const phone = (taskData.phone as string) || party?.phone || ''
  const entityType = (taskData.entityType as string) || party?.entityType || ''
  const jurisdiction = (taskData.jurisdiction as string) || party?.jurisdiction || ''
  const contactPerson = (taskData.contactPerson as string) || party?.contactPerson || ''

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Banner */}
        {amlReview?.status === 'cleared' && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-green-900">AML Review Cleared</p>
                <p className="text-xs text-green-800/80">
                  This {isEntity ? 'legal entity' : 'individual'} has been cleared by the AML team. No sanctions or watchlist matches found. Cleared at {amlReview.decidedAt}.
                </p>
              </div>
            </div>
          </div>
        )}

        {amlReview?.status === 'flagged' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-900">Flagged for Further Review</p>
                <p className="text-xs text-red-800/80">
                  This {isEntity ? 'legal entity' : 'individual'} has been flagged by the AML team and requires further investigation. Flagged at {amlReview.decidedAt}.
                </p>
                {amlReview.findings && (
                  <div className="mt-2 rounded-md bg-red-100/60 px-3 py-2">
                    <p className="text-xs text-red-900">
                      <span className="font-semibold">Findings:</span> {amlReview.findings}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {amlReview?.status === 'pending' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-4 py-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Screening results received</p>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-200/80">
                  Automated OFAC, PEP, and risk data loaded from the screening vendor. Review the sections below and
                  record a disposition (Clear, Flag for Further Review, or Escalate).
                </p>
              </div>
            </div>
          </div>
        )}

        {amlReview?.status === 'info_requested' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-blue-900">Additional Info Requested</p>
                <p className="text-xs text-blue-800/80">
                  You have requested additional information from the Home Office. Waiting for response.
                </p>
                {amlReview.infoRequestComments && (
                  <div className="mt-2 rounded-md bg-blue-100/60 px-3 py-2">
                    <p className="text-xs text-blue-900">
                      <span className="font-semibold">Your request:</span> {amlReview.infoRequestComments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {amlReview?.status === 'escalated' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-red-900">SAR Escalated</p>
                <p className="text-xs text-red-800/80">
                  This case has been escalated for Suspicious Activity Report (SAR) filing. Escalated at {amlReview.decidedAt}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[10px]">
              <ShieldAlert className="h-3 w-3 mr-1" />
              AML Review
            </Badge>
            {amlFlagged && (
              <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                Advisor Flagged
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-foreground mt-2">{fullName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEntity ? 'Anti-Money Laundering & Sanctions Screening (KYB)' : 'Anti-Money Laundering & Sanctions Screening'}
          </p>
        </div>

        {/* Advisor Notes */}
        {amlFlagged && amlNotes && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-amber-900">Advisor Notes</p>
                <p className="text-sm text-amber-800/90">{amlNotes}</p>
              </div>
            </div>
          </div>
        )}

        <Accordion
          type="multiple"
          defaultValue={[...(isEntity ? AML_ENTITY_SECTION_DEFAULTS : AML_SECTION_DEFAULTS)]}
          className="space-y-3"
        >
          <AccordionSection value={isEntity ? 'entity' : 'individual'} title={isEntity ? 'Legal Entity Information' : 'Individual Information'} icon={User}>
            <ReviewRow label={isEntity ? 'Legal Name' : 'Full Name'} value={fullName || '—'} />
            {isEntity ? (
              <>
                <ReviewRow label="Entity Type" value={entityType || '—'} />
                <ReviewRow label="Tax ID / EIN" value={ssn ? `**-***${ssn.slice(-4)}` : 'Not provided'} />
                <ReviewRow label="Jurisdiction" value={jurisdiction || '—'} />
                <ReviewRow label="Contact Person" value={contactPerson || '—'} />
              </>
            ) : (
              <>
                <ReviewRow label="Date of Birth" value={dob || '—'} />
                <ReviewRow label="SSN / Tax ID" value={ssn ? `***-**-${ssn.slice(-4)}` : '***-**-**** (verified)'} />
              </>
            )}
            <ReviewRow label="Email" value={email || '—'} />
            <ReviewRow label="Phone" value={phone || '—'} />
            {!isEntity && <ReviewRow label="Relationship" value={party?.relationship || party?.role || 'Client'} />}
          </AccordionSection>

          <AccordionSection
            value="ofac"
            title="OFAC / Sanctions Screening"
            icon={Globe}
            badge={
              amlReview?.status === 'flagged' ? (
                <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                  <XCircle className="h-3 w-3 mr-1" />
                  Match Found
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  No Match
                </Badge>
              )
            }
          >
            <ReviewRow
              label="SDN List (OFAC)"
              value={
                amlReview?.status === 'flagged' ? 'Potential match — 87% similarity' : AML_API_SCREENING.ofacSdn
              }
            />
            <ReviewRow
              label="Consolidated Sanctions List"
              value={amlReview?.status === 'flagged' ? 'Under review' : AML_API_SCREENING.consolidatedSanctions}
            />
            <ReviewRow
              label="EU Sanctions List"
              value={amlReview?.status === 'flagged' ? 'Under review' : AML_API_SCREENING.euSanctions}
            />
            <ReviewRow
              label="UN Sanctions List"
              value={amlReview?.status === 'flagged' ? 'Under review' : AML_API_SCREENING.unSanctions}
            />
            {amlReview?.status === 'flagged' && (
              <>
                <ReviewRow label="Similarity Score" value="87% — Requires manual review" />
                <ReviewRow label="Match Type" value="Partial name match on SDN list" />
              </>
            )}
          </AccordionSection>

          <AccordionSection value="pep" title="PEP & Adverse Media Check" icon={Search}>
            <ReviewRow
              label="Politically Exposed Person (PEP)"
              value={
                amlReview?.status === 'flagged' ? 'Level 2 — Family member of PEP' : AML_API_SCREENING.pep
              }
            />
            <ReviewRow
              label="PEP Level"
              value={
                amlReview?.status === 'flagged'
                  ? 'Level 2 — Relative / Close Associate'
                  : AML_API_SCREENING.pepLevel
              }
            />
            <ReviewRow
              label="Adverse Media Screening"
              value={
                amlReview?.status === 'flagged' ? '2 potential matches found' : AML_API_SCREENING.adverseMedia
              }
            />
            <ReviewRow
              label="Negative News"
              value={amlReview?.status === 'flagged' ? 'Financial fraud allegations (2023)' : AML_API_SCREENING.negativeNews}
            />
          </AccordionSection>

          <AccordionSection
            value="risk"
            title="Risk Assessment"
            icon={ShieldCheck}
            badge={
              amlReview?.status === 'flagged' ? (
                <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                  High Risk
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">
                  Low Risk
                </Badge>
              )
            }
          >
            <ReviewRow
              label="Customer Risk Rating"
              value={amlReview?.status === 'flagged' ? 'High' : AML_API_SCREENING.customerRiskRating}
            />
            <ReviewRow
              label="Risk Score"
              value={amlReview?.status === 'flagged' ? '78 / 100' : AML_API_SCREENING.riskScore}
            />
            <ReviewRow
              label="Geographic Risk"
              value={amlReview?.status === 'flagged' ? 'Elevated — review jurisdiction' : AML_API_SCREENING.geographicRisk}
            />
            <ReviewRow
              label="Product Risk"
              value={amlReview?.status === 'flagged' ? 'Elevated' : AML_API_SCREENING.productRisk}
            />
          </AccordionSection>

          <AccordionSection value="source-funds" title="Source of Funds" icon={Landmark}>
            <ReviewRow
              label="Declared Source"
              value={
                (taskData.sourceOfFunds as string) ||
                party?.accountOwnerIndividual?.sourceOfFunds ||
                AML_API_SCREENING.declaredSourceFallback
              }
            />
            <ReviewRow
              label={isEntity ? 'Business Type / Industry' : 'Employment Status'}
              value={
                (taskData.bizIndustry as string) ||
                (taskData.employmentStatus as string) ||
                party?.businessProfile?.industry ||
                party?.accountOwnerIndividual?.employmentStatus ||
                AML_API_SCREENING.employmentFallback
              }
            />
            <ReviewRow
              label="Annual Income"
              value={party?.accountOwnerIndividual?.annualIncomeRange || AML_API_SCREENING.annualIncomeFallback}
            />
            <ReviewRow
              label="Net Worth"
              value={party?.accountOwnerIndividual?.netWorthRange || AML_API_SCREENING.netWorthFallback}
            />
          </AccordionSection>

          <AccordionSection value="case-notes" title="Internal Case Notes" icon={FileText}>
            <div className="py-2">
              <textarea
                value={caseNotes}
                onChange={(e) => {
                  setCaseNotes(e.target.value)
                  dispatch({ type: 'SET_AML_FLAG', flagged: reviewState?.amlFlagged ?? false, notes: e.target.value })
                }}
                placeholder="Add internal notes about this AML case (optional)…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={amlReview?.status === 'cleared' || amlReview?.status === 'flagged' || amlReview?.status === 'escalated'}
              />
            </div>
          </AccordionSection>
        </Accordion>
      </div>
    </main>
  )
}
