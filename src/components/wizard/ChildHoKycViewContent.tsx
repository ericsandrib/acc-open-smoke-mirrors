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

function CipIndicator({ status }: { status: 'pass' | 'fail' | 'pending' }) {
  if (status === 'pass') return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" /> Pass
    </span>
  )
  if (status === 'fail') return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700">
      <XCircle className="h-3.5 w-3.5" /> Fail
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
      <Clock className="h-3.5 w-3.5" /> Pending
    </span>
  )
}

export function ChildHoKycViewContent() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  if (!ctx) return null

  const { child } = ctx
  const reviewState = getChildReviewState(state, child.id)
  const amlReview = reviewState?.amlReview
  const cipStatus = reviewState?.cipStatus
  const hoKycReview = reviewState?.hoKycReview

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

  const amlBlocked = amlReview?.status === 'pending' || amlReview?.status === 'flagged' || amlReview?.status === 'info_requested'

  const defaultOpen = useMemo(() => {
    const keys = ['personal', 'address', 'id-verification', 'employment', 'source-of-funds', 'documents']
    if (cipStatus) keys.unshift('cip')
    return keys
  }, [cipStatus])

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Banners */}
        {hoKycReview?.status === 'approved' && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-green-900">KYC Approved</p>
                <p className="text-xs text-green-800/80">
                  This individual's KYC has been approved by the Home Office. Approved at {hoKycReview.decidedAt}.
                </p>
              </div>
            </div>
          </div>
        )}

        {amlReview?.status === 'cleared' && hoKycReview?.status !== 'approved' && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-green-900">AML Cleared — Ready for Approval</p>
                <p className="text-xs text-green-800/80">
                  The AML team has cleared this individual. You may now approve the KYC review.
                </p>
              </div>
            </div>
          </div>
        )}

        {amlBlocked && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-amber-900">Pending AML Review</p>
                <p className="text-xs text-amber-800/80">
                  {amlReview?.status === 'flagged'
                    ? 'The AML team has flagged this individual. KYC approval is blocked until AML review is resolved.'
                    : amlReview?.status === 'info_requested'
                    ? 'The AML team has requested additional information. Please provide the requested details.'
                    : 'AML screening is in progress. KYC approval is blocked until AML review is complete.'}
                </p>
                {amlReview?.status === 'info_requested' && amlReview.infoRequestComments && (
                  <div className="mt-2 rounded-md bg-amber-100/60 px-3 py-2">
                    <p className="text-xs text-amber-900">
                      <span className="font-semibold">AML Team Request:</span> {amlReview.infoRequestComments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge variant="outline" className="text-violet-700 border-violet-200 bg-violet-50 text-[10px]">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Home Office KYC Review
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mt-2">{fullName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review advisor-submitted KYC data and CIP verification results
          </p>
        </div>

        {/* AML Status Chip */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">AML Status:</span>
          {amlReview?.status === 'cleared' ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Clear
            </Badge>
          ) : amlReview?.status === 'flagged' ? (
            <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
              <XCircle className="h-3 w-3 mr-1" /> Flagged
            </Badge>
          ) : amlReview?.status === 'escalated' ? (
            <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
              <AlertTriangle className="h-3 w-3 mr-1" /> SAR Escalated
            </Badge>
          ) : amlReview?.status === 'info_requested' ? (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
              <Clock className="h-3 w-3 mr-1" /> Info Requested
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
              <Clock className="h-3 w-3 mr-1" /> Pending AML Review
            </Badge>
          )}
        </div>

        <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-3">
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
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">ID Verification</span>
                <CipIndicator status={cipStatus.idVerification} />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Address Match</span>
                <CipIndicator status={cipStatus.addressMatch} />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">DOB Match</span>
                <CipIndicator status={cipStatus.dobMatch} />
              </div>
            </AccordionSection>
          )}

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
