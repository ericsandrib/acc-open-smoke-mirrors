import { useState } from 'react'
import { useWorkflow, useChildActionContext, getChildReviewState } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
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
  'sanctions',
  'pep',
  'adverse-media',
  'alerts',
  'risk-summary',
  'source-funds',
] as const

const AML_ENTITY_SECTION_DEFAULTS = [
  'sanctions',
  'pep',
  'adverse-media',
  'alerts',
  'risk-summary',
  'source-funds',
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
  const legalStreet = (taskData.legalStreet as string) || party?.accountOwnerIndividual?.legalStreet || ''
  const legalApt = (taskData.legalApt as string) || party?.accountOwnerIndividual?.legalApt || ''
  const legalCity = (taskData.legalCity as string) || party?.accountOwnerIndividual?.legalCity || ''
  const legalState = (taskData.legalState as string) || party?.accountOwnerIndividual?.legalState || ''
  const legalZip = (taskData.legalZip as string) || party?.accountOwnerIndividual?.legalZip || ''
  const legalCountry = (taskData.legalCountry as string) || party?.accountOwnerIndividual?.legalCountry || ''
  const riskLevel = amlReview?.status === 'flagged' ? 'High' : AML_API_SCREENING.customerRiskRating
  const riskScore = amlReview?.status === 'flagged' ? '78 / 100' : AML_API_SCREENING.riskScore
  const screeningStatus = amlReview?.status === 'flagged' ? 'Review Required' : 'Clear'
  const confidence = amlReview?.status === 'flagged' ? 'Medium' : 'High'
  const keyFactors =
    amlReview?.status === 'flagged'
      ? ['Watchlist similarity requires manual review', 'Potential PEP-related association', 'Further due diligence required']
      : ['Domestic profile', 'Stable employment', 'Transparent source of funds', 'No watchlist matches']
  const sourceOfFundsRaw =
    (taskData.sourceOfFunds as string) ||
    party?.accountOwnerIndividual?.sourceOfFunds ||
    AML_API_SCREENING.declaredSourceFallback
  const sourceOfFundsItems = sourceOfFundsRaw
    .split(/[;,]+/)
    .map((s) => s.trim())
    .filter(Boolean)

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
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">No risk indicators identified</p>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-200/80">
                  Screening checks are complete and clear across sanctions, PEP, and adverse media. Review the summary
                  below and choose Approve, Approve w/ Monitoring, or Escalate.
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
          {amlFlagged ? (
            <div className="flex items-center gap-3 mb-1">
              <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                Advisor Flagged
              </Badge>
            </div>
          ) : null}
          <h2 className={amlFlagged ? 'text-2xl font-semibold text-foreground mt-2' : 'text-2xl font-semibold text-foreground'}>
            {fullName}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEntity ? 'Anti-Money Laundering & Sanctions Screening (KYB)' : 'Anti-Money Laundering & Sanctions Screening'}
          </p>
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Decision Context</p>
            <ReviewRow label="Risk Level" value={riskLevel} />
            <ReviewRow label="Risk Score" value={riskScore} />
            <ReviewRow label="Screening Status" value={screeningStatus} />
            <ReviewRow label="Confidence" value={confidence} />
            {amlReview?.status !== 'flagged' && (
              <p className="text-xs text-muted-foreground pt-2">
                No sanctions, PEP, or adverse media matches found.
              </p>
            )}
          </div>
          <div className="mt-3 rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">Key Factors</p>
            <ul className="mt-2 space-y-1">
              {keyFactors.map((f) => (
                <li key={f} className="text-sm text-foreground">- {f}</li>
              ))}
            </ul>
          </div>
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
          <AccordionSection
            value="sanctions"
            title="Sanctions Screening"
            icon={Globe}
            badge={
              amlReview?.status === 'flagged' ? (
                <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                  <XCircle className="h-3 w-3 mr-1" />
                  Review Required
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Clear
                </Badge>
              )
            }
          >
            <p className="py-2 text-sm">
              {amlReview?.status === 'flagged'
                ? 'Potential sanctions match detected. Manual review required before approval.'
                : 'Clear — No matches across OFAC, EU, UN, and consolidated sanctions lists.'}
            </p>
          </AccordionSection>

          <AccordionSection value="pep" title="PEP Status" icon={Search}>
            <p className="py-2 text-sm">
              {amlReview?.status === 'flagged'
                ? 'PEP-related association identified. Enhanced due diligence required.'
                : 'Clear — Not a politically exposed person.'}
            </p>
          </AccordionSection>

          <AccordionSection value="adverse-media" title="Adverse Media" icon={FileText}>
            <p className="py-2 text-sm">
              {amlReview?.status === 'flagged'
                ? 'Relevant negative media identified and requires follow-up.'
                : 'Clear — No relevant negative news identified.'}
            </p>
          </AccordionSection>

          <AccordionSection value="alerts" title="Alerts" icon={Clock}>
            <p className="py-2 text-sm">
              {amlReview?.status === 'flagged' ? '1 or more alerts identified.' : 'No alerts identified.'}
            </p>
          </AccordionSection>

          <AccordionSection
            value="risk-summary"
            title="Risk Summary"
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
            <ReviewRow label="Risk Level" value={amlReview?.status === 'flagged' ? 'High' : AML_API_SCREENING.customerRiskRating} />
            <ReviewRow label="Score" value={amlReview?.status === 'flagged' ? '78 / 100' : AML_API_SCREENING.riskScore} />
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
            {sourceOfFundsItems.length > 0 ? (
              <ul className="py-2 space-y-1">
                {sourceOfFundsItems.map((item) => (
                  <li key={item} className="text-sm text-foreground">- {item}</li>
                ))}
              </ul>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">No source of funds provided.</p>
            )}
          </AccordionSection>

          <AccordionSection value="details" title="View Details" icon={User}>
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
                <ReviewRow label="Street" value={legalStreet || 'Not provided'} />
                <ReviewRow label="Apt / Unit" value={legalApt || 'Not provided'} />
                <ReviewRow label="City" value={legalCity || 'Not provided'} />
                <ReviewRow label="State" value={legalState || 'Not provided'} />
                <ReviewRow label="ZIP / Postal code" value={legalZip || 'Not provided'} />
                <ReviewRow label="Country" value={legalCountry || 'Not provided'} />
              </>
            )}
            <ReviewRow label="Email" value={email || '—'} />
            <ReviewRow label="Phone" value={phone || '—'} />
          </AccordionSection>

          <AccordionSection value="system-activity" title="System Activity" icon={FileText}>
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
