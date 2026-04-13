import { useMemo } from 'react'
import { useWorkflow, useChildActionContext, getChildReviewState } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  User,
  MapPin,
  CreditCard,
  Briefcase,
  Landmark,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Globe,
  Search,
  Stamp,
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
        <div className="px-4 py-2 divide-y divide-border">
          {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function StatusChip({ status, label }: { status: 'pass' | 'fail' | 'pending' | 'blocked'; label: string }) {
  const cfg = {
    pass: { bg: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
    fail: { bg: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    pending: { bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
    blocked: { bg: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  }[status]
  const Icon = cfg.icon
  return (
    <Badge className={`${cfg.bg} hover:${cfg.bg}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}

export function ChildHoPrincipalKycContent() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  if (!ctx) return null

  const { child } = ctx
  const reviewState = getChildReviewState(state, child.id)
  const amlReview = reviewState?.amlReview
  const cipStatus = reviewState?.cipStatus
  const hoKycReview = reviewState?.hoKycReview
  const principalKycReview = reviewState?.principalKycReview

  const party = state.relatedParties.find((p) => p.name === child.name)
  const taskData = state.taskData[`${child.id}-info`] ?? {}
  const docData = taskData

  const firstName = (taskData.firstName as string) || party?.firstName || ''
  const lastName = (taskData.lastName as string) || party?.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim() || child.name
  const dob = (taskData.dob as string) || party?.dob || ''
  const ssn = (taskData.taxId as string) || party?.ssn || ''
  const email = (taskData.email as string) || party?.email || ''
  const phone = (taskData.phone as string) || party?.phone || ''
  const citizenship = (taskData.citizenship as string) || ''

  const legalStreet = (taskData.legalStreet as string) || ''
  const legalCity = (taskData.legalCity as string) || ''
  const legalState = (taskData.legalState as string) || ''
  const legalZip = (taskData.legalZip as string) || ''
  const legalCountry = (taskData.legalCountry as string) || ''
  const fullAddress = [legalStreet, legalCity, legalState, legalZip, legalCountry].filter(Boolean).join(', ')

  const idType = (taskData.idType as string) || ''
  const idNumber = (taskData.idNumber as string) || ''
  const idState = (taskData.idState as string) || ''
  const idExpiration = (taskData.idExpiration as string) || ''

  const employmentStatus = (taskData.employmentStatus as string) || ''
  const employerName = (taskData.employerName as string) || ''
  const occupation = (taskData.occupation as string) || ''
  const industry = (taskData.industry as string) || ''

  const sourceOfFunds = (taskData.sourceOfFunds as string) || ''
  const sourceOfFundsDetails = (taskData.sourceOfFundsDetails as string) || ''

  const amlCleared = amlReview?.status === 'cleared'
  const amlEscalated = amlReview?.status === 'escalated'
  const hoKycApproved = hoKycReview?.status === 'approved'

  const readyForSignoff = amlCleared && hoKycApproved
  const hasBlockers = amlEscalated || (!amlCleared && amlReview?.status !== 'pending') || hoKycReview?.status === 'changes_requested'

  const defaultOpen = useMemo(() => {
    const keys = ['review-status', 'personal', 'address', 'id-verification', 'employment', 'source-of-funds', 'documents']
    if (cipStatus) keys.splice(1, 0, 'cip')
    return keys
  }, [cipStatus])

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Outcome banner */}
        {principalKycReview?.status === 'approved' && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-green-900">Principal Sign-Off Complete</p>
                <p className="text-xs text-green-800/80">
                  This individual's KYC package has been approved by the Principal. Signed off at {principalKycReview.decidedAt}.
                </p>
              </div>
            </div>
          </div>
        )}

        {principalKycReview?.status === 'rejected' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-900">Principal Sign-Off Rejected</p>
                <p className="text-xs text-red-800/80">
                  The Principal has rejected this KYC package. Rejected at {principalKycReview.decidedAt}.
                </p>
                {principalKycReview.reason && (
                  <div className="mt-2 rounded-md bg-red-100/60 px-3 py-2">
                    <p className="text-xs text-red-900">
                      <span className="font-semibold">Reason:</span> {principalKycReview.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!principalKycReview && readyForSignoff && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <Stamp className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-blue-900">Ready for Principal Sign-Off</p>
                <p className="text-xs text-blue-800/80">
                  AML has been cleared and the Home Office has approved the KYC review. This package is ready for final sign-off.
                </p>
              </div>
            </div>
          </div>
        )}

        {!principalKycReview && hasBlockers && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-amber-900">Blockers Exist</p>
                <p className="text-xs text-amber-800/80">
                  {amlEscalated
                    ? 'This case has been escalated for SAR filing. Sign-off is blocked.'
                    : !amlCleared
                      ? 'AML review has not been cleared. Sign-off is blocked until AML is resolved.'
                      : 'Home Office has requested changes. Sign-off is blocked until resolved.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {!principalKycReview && !readyForSignoff && !hasBlockers && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-amber-900">Upstream Reviews In Progress</p>
                <p className="text-xs text-amber-800/80">
                  AML and/or Home Office KYC reviews are still pending. The package will be ready for sign-off once both are complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50 text-[10px]">
              <Stamp className="h-3 w-3 mr-1" />
              Principal KYC Review
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mt-2">{fullName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Final review of the complete KYC package before sign-off
          </p>
        </div>

        <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-3">
          {/* Upstream review status roll-up */}
          <AccordionSection
            value="review-status"
            title="Review Status Summary"
            icon={ShieldCheck}
            badge={
              readyForSignoff ? (
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> All Clear
                </Badge>
              ) : hasBlockers ? (
                <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Blockers
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[10px]">
                  <Clock className="h-3 w-3 mr-1" /> In Progress
                </Badge>
              )
            }
          >
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">AML / Sanctions</span>
              {amlCleared ? (
                <StatusChip status="pass" label="Cleared" />
              ) : amlEscalated ? (
                <StatusChip status="blocked" label="SAR Escalated" />
              ) : amlReview?.status === 'flagged' ? (
                <StatusChip status="fail" label="Flagged" />
              ) : (
                <StatusChip status="pending" label="Pending" />
              )}
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Home Office KYC</span>
              {hoKycApproved ? (
                <StatusChip status="pass" label="Approved" />
              ) : hoKycReview?.status === 'changes_requested' ? (
                <StatusChip status="fail" label="Changes Requested" />
              ) : (
                <StatusChip status="pending" label="Pending" />
              )}
            </div>
            {cipStatus && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">CIP Verification</span>
                {cipStatus.overallStatus === 'pass' ? (
                  <StatusChip status="pass" label="Passed" />
                ) : cipStatus.overallStatus === 'fail' ? (
                  <StatusChip status="fail" label="Failed" />
                ) : (
                  <StatusChip status="pending" label="Pending" />
                )}
              </div>
            )}
            {amlReview?.decidedAt && (
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-muted-foreground">AML Decision Time</span>
                <span className="text-sm font-medium">{amlReview.decidedAt}</span>
              </div>
            )}
            {hoKycReview?.decidedAt && (
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-muted-foreground">HO KYC Decision Time</span>
                <span className="text-sm font-medium">{hoKycReview.decidedAt}</span>
              </div>
            )}
          </AccordionSection>

          {/* CIP */}
          {cipStatus && (
            <AccordionSection
              value="cip"
              title="CIP Verification Results"
              icon={ShieldCheck}
              badge={
                cipStatus.overallStatus === 'pass' ? (
                  <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> CIP Passed
                  </Badge>
                ) : cipStatus.overallStatus === 'fail' ? (
                  <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                    <XCircle className="h-3 w-3 mr-1" /> CIP Failed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[10px]">
                    <Clock className="h-3 w-3 mr-1" /> Pending
                  </Badge>
                )
              }
            >
              <ReviewRow label="ID Verification" value={cipStatus.idVerification === 'pass' ? 'Pass' : cipStatus.idVerification === 'fail' ? 'Fail' : 'Pending'} />
              <ReviewRow label="Address Match" value={cipStatus.addressMatch === 'pass' ? 'Pass' : cipStatus.addressMatch === 'fail' ? 'Fail' : 'Pending'} />
              <ReviewRow label="DOB Match" value={cipStatus.dobMatch === 'pass' ? 'Pass' : cipStatus.dobMatch === 'fail' ? 'Fail' : 'Pending'} />
            </AccordionSection>
          )}

          {/* AML Summary (read-only, no editable notes) */}
          <AccordionSection
            value="aml-summary"
            title="AML / Sanctions Summary"
            icon={Globe}
            badge={
              amlCleared ? (
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Clear
                </Badge>
              ) : amlEscalated ? (
                <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                  <ShieldAlert className="h-3 w-3 mr-1" /> SAR
                </Badge>
              ) : amlReview?.status === 'flagged' ? (
                <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 text-[10px]">
                  <XCircle className="h-3 w-3 mr-1" /> Flagged
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[10px]">
                  <Clock className="h-3 w-3 mr-1" /> Pending
                </Badge>
              )
            }
          >
            <ReviewRow label="OFAC / SDN List" value={amlCleared ? 'No match' : amlReview?.status === 'flagged' ? 'Potential match' : 'Pending'} />
            <ReviewRow label="PEP Check" value={amlCleared ? 'Not a PEP' : amlReview?.status === 'flagged' ? 'Level 2 — Close associate' : 'Pending'} />
            <ReviewRow label="Adverse Media" value={amlCleared ? 'None found' : amlReview?.status === 'flagged' ? 'Matches found' : 'Pending'} />
            <ReviewRow label="Risk Rating" value={amlCleared ? 'Low' : amlReview?.status === 'flagged' ? 'High' : 'Not assessed'} />
            {amlReview?.findings && <ReviewRow label="AML Findings" value={amlReview.findings} />}
          </AccordionSection>

          {/* PEP */}
          <AccordionSection value="pep" title="PEP & Adverse Media" icon={Search}>
            <ReviewRow label="PEP Status" value={amlCleared ? 'Not a PEP' : amlReview?.status === 'flagged' ? 'Level 2 — Family / Close Associate' : 'Pending review'} />
            <ReviewRow label="Adverse Media" value={amlCleared ? 'No adverse media found' : amlReview?.status === 'flagged' ? 'Potential matches found' : 'Pending review'} />
          </AccordionSection>

          {/* Personal info */}
          <AccordionSection value="personal" title="Personal Information" icon={User}>
            <ReviewRow label="Full Name" value={fullName} />
            <ReviewRow label="Date of Birth" value={dob} />
            <ReviewRow label="SSN / Tax ID" value={ssn ? `***-**-${ssn.slice(-4)}` : 'Not provided'} />
            <ReviewRow label="Citizenship" value={citizenship || 'Not provided'} />
            <ReviewRow label="Email" value={email} />
            <ReviewRow label="Phone" value={phone} />
            <ReviewRow label="Relationship" value={party?.relationship} />
          </AccordionSection>

          <AccordionSection value="address" title="Address" icon={MapPin}>
            <ReviewRow label="Legal Address" value={fullAddress || 'Not provided'} />
          </AccordionSection>

          <AccordionSection value="id-verification" title="ID Verification" icon={CreditCard}>
            <ReviewRow label="ID Type" value={idType || 'Not provided'} />
            <ReviewRow label="ID Number" value={idNumber ? `****${idNumber.slice(-4)}` : 'Not provided'} />
            <ReviewRow label="Issuing State" value={idState || 'Not provided'} />
            <ReviewRow label="Expiration" value={idExpiration || 'Not provided'} />
          </AccordionSection>

          <AccordionSection value="employment" title="Employment" icon={Briefcase}>
            <ReviewRow label="Status" value={employmentStatus || 'Not provided'} />
            <ReviewRow label="Employer" value={employerName || 'Not provided'} />
            <ReviewRow label="Occupation" value={occupation || 'Not provided'} />
            <ReviewRow label="Industry" value={industry || 'Not provided'} />
          </AccordionSection>

          <AccordionSection value="source-of-funds" title="Source of Funds" icon={Landmark}>
            <ReviewRow label="Primary Source" value={sourceOfFunds || 'Not provided'} />
            <ReviewRow label="Additional Details" value={sourceOfFundsDetails || undefined} />
          </AccordionSection>

          <AccordionSection value="documents" title="Documents" icon={FileText}>
            <ReviewRow label="Government ID" value={docData['doc-gov-id'] ? 'Uploaded' : 'Not uploaded'} />
            <ReviewRow label="Supporting Documents" value={docData['doc-supporting-docs'] ? 'Uploaded' : 'Not uploaded'} />
          </AccordionSection>
        </Accordion>
      </div>
    </main>
  )
}
