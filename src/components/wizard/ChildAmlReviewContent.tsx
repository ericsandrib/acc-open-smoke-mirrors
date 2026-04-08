import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, badge }: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {badge}
      </div>
      <div className="px-4 py-2 divide-y divide-border">
        {children}
      </div>
    </div>
  )
}

export function ChildAmlReviewContent() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  if (!ctx) return null

  const { child } = ctx
  const reviewState = state.childReviewState
  const amlReview = reviewState?.amlReview
  const amlFlagged = reviewState?.amlFlagged
  const amlNotes = reviewState?.amlNotes

  const party = state.relatedParties.find((p) => p.name === child.name)
  const taskData = state.taskData[`${child.id}-info`] ?? {}

  const firstName = (taskData.firstName as string) || party?.firstName || ''
  const lastName = (taskData.lastName as string) || party?.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim() || child.name
  const dob = (taskData.dob as string) || party?.dob || ''
  const ssn = (taskData.ssn as string) || party?.ssn || ''
  const email = (taskData.email as string) || party?.email || ''
  const phone = (taskData.phone as string) || party?.phone || ''

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
                  This individual has been cleared by the AML team. No sanctions or watchlist matches found. Cleared at {amlReview.decidedAt}.
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
                  This individual has been flagged by the AML team and requires further investigation. Flagged at {amlReview.decidedAt}.
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
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-amber-900">Pending AML Review</p>
                <p className="text-xs text-amber-800/80">
                  This individual is awaiting AML/sanctions screening. Review the information below and take action.
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
            Anti-Money Laundering & Sanctions Screening
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

        {/* Individual Information */}
        <SectionCard title="Individual Information" icon={User}>
          <ReviewRow label="Full Name" value={fullName} />
          <ReviewRow label="Date of Birth" value={dob} />
          <ReviewRow label="SSN / Tax ID" value={ssn ? `***-**-${ssn.slice(-4)}` : undefined} />
          <ReviewRow label="Email" value={email} />
          <ReviewRow label="Phone" value={phone} />
          <ReviewRow label="Relationship" value={party?.relationship} />
        </SectionCard>

        {/* OFAC / Sanctions Screening */}
        <SectionCard
          title="OFAC / Sanctions Screening"
          icon={Globe}
          badge={
            amlReview?.status === 'cleared' ? (
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                No Match
              </Badge>
            ) : amlReview?.status === 'flagged' ? (
              <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                <XCircle className="h-3 w-3 mr-1" />
                Match Found
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[10px]">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )
          }
        >
          <ReviewRow label="SDN List (OFAC)" value={amlReview?.status === 'cleared' ? 'No match' : amlReview?.status === 'flagged' ? 'Potential match' : 'Pending screening'} />
          <ReviewRow label="Consolidated Sanctions List" value={amlReview?.status === 'cleared' ? 'No match' : 'Pending screening'} />
          <ReviewRow label="EU Sanctions List" value={amlReview?.status === 'cleared' ? 'No match' : 'Pending screening'} />
          <ReviewRow label="UN Sanctions List" value={amlReview?.status === 'cleared' ? 'No match' : 'Pending screening'} />
        </SectionCard>

        {/* PEP & Adverse Media */}
        <SectionCard title="PEP & Adverse Media Check" icon={Search}>
          <ReviewRow label="Politically Exposed Person (PEP)" value={amlReview?.status === 'cleared' ? 'Not a PEP' : 'Pending review'} />
          <ReviewRow label="Adverse Media Screening" value={amlReview?.status === 'cleared' ? 'No adverse media found' : 'Pending review'} />
          <ReviewRow label="Negative News" value={amlReview?.status === 'cleared' ? 'None found' : 'Pending review'} />
        </SectionCard>

        {/* Risk Assessment */}
        <SectionCard
          title="Risk Assessment"
          icon={ShieldCheck}
          badge={
            amlReview?.status === 'cleared' ? (
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">Low Risk</Badge>
            ) : amlReview?.status === 'flagged' ? (
              <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">High Risk</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-[10px]">Not Assessed</Badge>
            )
          }
        >
          <ReviewRow label="Customer Risk Rating" value={amlReview?.status === 'cleared' ? 'Low' : amlReview?.status === 'flagged' ? 'High' : 'Pending'} />
          <ReviewRow label="Geographic Risk" value={amlReview?.status === 'cleared' ? 'Low — Domestic' : 'Pending assessment'} />
          <ReviewRow label="Product Risk" value={amlReview?.status === 'cleared' ? 'Standard' : 'Pending assessment'} />
        </SectionCard>

        {/* Transaction Monitoring */}
        <SectionCard title="Source of Funds" icon={Landmark}>
          <ReviewRow label="Declared Source" value={party?.accountOwnerIndividual?.sourceOfFunds || 'Not provided'} />
          <ReviewRow label="Employment Status" value={party?.accountOwnerIndividual?.employmentStatus || 'Not provided'} />
          <ReviewRow label="Annual Income" value={party?.accountOwnerIndividual?.annualIncomeRange || 'Not provided'} />
          <ReviewRow label="Net Worth" value={party?.accountOwnerIndividual?.netWorthRange || 'Not provided'} />
        </SectionCard>
      </div>
    </main>
  )
}
