import { useCallback, useState } from 'react'
import {
  useWorkflow,
  useChildActionContext,
  getChildReviewState,
  getChildReviewDecision,
} from '@/stores/workflowStore'
import type { TaskStatus } from '@/types/workflow'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  ShieldAlert,
  CheckCircle2,
  User,
  MapPin,
  Briefcase,
  Scale,
  FolderOpen,
  Pencil,
  Save,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right max-w-[65%]">{value}</span>
    </div>
  )
}

function formatLastChecked(iso: string | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function cipDetailLabel(v: 'pass' | 'fail' | 'pending' | undefined): string {
  if (v === 'pass') return 'Passed'
  if (v === 'fail') return 'Needs attention'
  return 'Pending'
}

function VerificationRunControl({ childId, childStatus }: { childId: string; childStatus: TaskStatus }) {
  const { state, dispatch } = useWorkflow()
  const reviewState = getChildReviewState(state, childId)
  const decision = getChildReviewDecision(state, childId)
  const cip = reviewState?.cipStatus
  const hoApproved = reviewState?.hoKycReview?.status === 'approved'
  const packageCompleteApproved = childStatus === 'complete' && decision?.outcome === 'approved'
  const packageUnavailable = hoApproved || packageCompleteApproved

  const hasRun = Boolean(reviewState?.kycVerificationLastCheckedAt)
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success'>('idle')

  const canRun =
    !packageUnavailable &&
    phase === 'idle' &&
    childStatus !== 'canceled' &&
    childStatus !== 'blocked'

  const handleRun = useCallback(() => {
    if (!canRun) return
    setPhase('loading')
    window.setTimeout(() => {
      dispatch({ type: 'RUN_ADVISOR_KYC_VERIFICATION', childId })
      setPhase('success')
      window.setTimeout(() => setPhase('idle'), 2200)
    }, 850)
  }, [canRun, childId, dispatch])

  const label =
    phase === 'loading'
      ? 'Running identity check…'
      : phase === 'success'
        ? 'Identity check complete'
        : hasRun || cip?.overallStatus === 'pass' || cip?.overallStatus === 'fail'
          ? 'Rerun identity check'
          : 'Run identity check'

  const disabled =
    packageUnavailable || phase === 'loading' || phase === 'success' || childStatus === 'canceled' || childStatus === 'blocked'

  if (packageUnavailable) {
    return (
      <p className="text-xs text-muted-foreground max-w-xs text-right">
        This KYC package has been approved. Verification cannot be rerun.
      </p>
    )
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn('shrink-0', phase === 'success' && 'border-green-600/40 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100')}
      disabled={disabled}
      onClick={handleRun}
    >
      {label}
    </Button>
  )
}

export function ChildHoKycViewContent() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const child = ctx?.child
  const childId = child?.id ?? ''
  const reviewState = getChildReviewState(state, childId)
  const amlReview = reviewState?.amlReview
  const cipStatus = reviewState?.cipStatus
  const hoKycReview = reviewState?.hoKycReview

  const childMeta = (state.taskData[childId] as Record<string, unknown> | undefined) ?? {}
  const subjectPartyId = childMeta.kycSubjectPartyId as string | undefined
  const subjectType = childMeta.kycSubjectType === 'entity' ? 'entity' : 'individual'
  const isEntity = subjectType === 'entity'
  const party =
    state.relatedParties.find((p) => p.id === subjectPartyId) ??
    state.relatedParties.find((p) => p.name === (child?.name ?? ''))
  const taskData = state.taskData[`${childId}-info`] ?? {}
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const rights = (state.taskData[`${childId}-ho-rights`] as Record<string, unknown> | undefined) ?? {}
  const canEditKycFields = state.demoViewMode === 'ho-kyc' && rights.canEditKycFields !== false
  const cipReviewUploads =
    (taskData.cipReviewUploads as Array<{ id: string; fileName: string; uploadedAt: string }> | undefined) ?? []

  const startEdit = () => {
    setDraft({ ...(taskData as Record<string, unknown>) })
    setIsEditing(true)
  }
  const cancelEdit = () => {
    setDraft({})
    setIsEditing(false)
  }
  const saveEdit = () => {
    dispatch({ type: 'SET_TASK_DATA', taskId: `${childId}-info`, fields: draft })
    setIsEditing(false)
  }
  const editVal = (key: string) => ((isEditing ? draft[key] : taskData[key]) as string) ?? ''
  const setEditVal = (key: string, value: string) => setDraft((prev) => ({ ...prev, [key]: value }))
  const firstName = (taskData.firstName as string) || party?.firstName || ''
  const lastName = (taskData.lastName as string) || party?.lastName || ''
  const legalName = (taskData.legalName as string) || party?.organizationName || child?.name || ''
  const fullName = isEntity ? legalName : `${firstName} ${lastName}`.trim() || child?.name || ''
  const dob = (taskData.dob as string) || party?.dob || ''
  const ssn = (taskData.taxId as string) || party?.taxId || party?.ssn || ''
  const email = (taskData.email as string) || party?.email || ''
  const phone = (taskData.phone as string) || party?.phone || ''
  const entityType = (taskData.entityType as string) || party?.entityType || ''
  const jurisdiction = (taskData.jurisdiction as string) || party?.jurisdiction || ''
  const contactPerson = (taskData.contactPerson as string) || party?.contactPerson || ''
  const annualRevenueRange = (taskData.annualRevenueRange as string) || party?.businessProfile?.annualRevenueRange || ''

  const legalStreet = (taskData.legalStreet as string) || ''
  const legalCity = (taskData.legalCity as string) || ''
  const legalState = (taskData.legalState as string) || ''
  const legalZip = (taskData.legalZip as string) || ''
  const legalCountry = (taskData.legalCountry as string) || ''
  const idType = (taskData.idType as string) || ''
  const idNumber = (taskData.idNumber as string) || ''
  const idState = (taskData.idState as string) || ''
  const idExpiration = (taskData.idExpiration as string) || ''

  const employmentStatus = (taskData.employmentStatus as string) || ''
  const employerName = (taskData.employerName as string) || ''
  const occupation = (taskData.occupation as string) || ''
  const industry = (taskData.industry as string) || ''

  const sourceOfFunds = (taskData.sourceOfFunds as string) || ''
  const sourceOfFundsItems = sourceOfFunds
    .split(/[;,]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const amlBlocked = amlReview?.status === 'pending' || amlReview?.status === 'flagged' || amlReview?.status === 'info_requested'
  const maskedTaxId = ssn ? `***-**-${ssn.slice(-4)}` : '*--6789'
  const submissionDate =
    reviewState?.hoKycReview?.decidedAt ||
    reviewState?.amlReview?.decidedAt ||
    (state.taskData[childId] as Record<string, unknown> | undefined)?.submittedAt ||
    'Pending'
  const verificationTimestamp = reviewState?.amlReview?.decidedAt || reviewState?.hoKycReview?.decidedAt || 'Pending'
  const reviewStatusLabel =
    hoKycReview?.status === 'approved'
      ? 'Approved'
      : hoKycReview?.status === 'changes_requested'
        ? 'Changes requested'
        : 'Pending review'
  const cipStatusLabel =
    cipStatus?.overallStatus === 'pass'
      ? 'Passed'
      : cipStatus?.overallStatus === 'fail'
        ? 'Needs attention'
        : 'Pending'

  const lastCheckedDisplay =
    formatLastChecked(reviewState?.kycVerificationLastCheckedAt) ??
    reviewState?.kycPreAmlTimeline?.idVerificationAt ??
    '—'

  const confidenceLabel =
    cipStatus?.overallStatus === 'pass' ? 'High' : cipStatus?.overallStatus === 'fail' ? 'Low' : 'Medium'

  const overall = cipStatus?.overallStatus
  const outcomeBullets =
    overall === 'fail'
      ? [
          'Information could not be fully verified against trusted sources.',
          'Review submitted identity and address before approving or requesting changes.',
        ]
      : overall === 'pass'
        ? [
            'Identity successfully verified.',
            'SSN, date of birth, and address matched.',
            'Automated screening completed with no blocking identity issues (demo).',
          ]
        : ['Verification is in progress or awaiting sufficient data.', 'Run a KYC check when intake is ready.']

  const supportingDocReferences: { label: string; name: string }[] = []
  for (const u of cipReviewUploads) {
    supportingDocReferences.push({ label: 'Reviewer upload', name: u.fileName })
  }
  for (const key of Object.keys(taskData)) {
    if (!key.startsWith('doc-instances-')) continue
    const raw = taskData[key]
    if (!Array.isArray(raw)) continue
    const docType = key.replace('doc-instances-', '')
    for (let i = 0; i < raw.length; i++) {
      const inst = raw[i] as { fileName?: string; id?: string }
      const name = inst.fileName?.trim() || 'No file name'
      supportingDocReferences.push({ label: docType, name })
    }
  }

  const headerBadgeVariant =
    hoKycReview?.status === 'approved'
      ? ('success' as const)
      : hoKycReview?.status === 'changes_requested'
        ? ('warning' as const)
        : ('neutral' as const)

  const amlStatusLabel =
    amlReview?.status === 'cleared'
      ? 'Cleared'
      : amlReview?.status === 'flagged'
        ? 'Flagged'
        : amlReview?.status === 'info_requested'
          ? 'Information requested'
          : amlReview?.status === 'escalated'
            ? 'Escalated'
            : amlReview?.status === 'pending'
              ? 'In progress'
              : '—'

  if (!ctx || !child) return null

  return (
    <main className="flex-1 overflow-y-auto overscroll-contain p-8">
      <div className="max-w-[52.5rem] mx-auto space-y-8">
        {hoKycReview?.status === 'approved' && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/50 dark:bg-green-950/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">KYC approved</p>
                <p className="text-xs text-green-800/80 dark:text-green-200/70">
                  This {isEntity ? 'legal entity' : 'individual'}&apos;s KYC has been approved by Document Review.
                  Approved at {hoKycReview.decidedAt}.
                </p>
              </div>
            </div>
          </div>
        )}

        {amlReview?.status === 'cleared' && hoKycReview?.status !== 'approved' && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/50 dark:bg-green-950/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">AML cleared — ready for approval</p>
                <p className="text-xs text-green-800/80 dark:text-green-200/70">
                  The AML team has cleared this {isEntity ? 'legal entity' : 'individual'}. You may now approve the KYC
                  review.
                </p>
              </div>
            </div>
          </div>
        )}

        {amlBlocked && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Pending AML review</p>
                <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
                  {amlReview?.status === 'flagged'
                    ? `The AML team has flagged this ${isEntity ? 'legal entity' : 'individual'}. KYC approval is blocked until AML review is resolved.`
                    : amlReview?.status === 'info_requested'
                      ? 'The AML team has requested additional information. Please provide the requested details.'
                      : 'AML screening is in progress. KYC approval is blocked until AML review is complete.'}
                </p>
                {amlReview?.status === 'info_requested' && amlReview.infoRequestComments && (
                  <div className="mt-2 rounded-md bg-amber-100/60 dark:bg-amber-900/30 px-3 py-2">
                    <p className="text-xs text-amber-900 dark:text-amber-100">
                      <span className="font-semibold">AML team request:</span> {amlReview.infoRequestComments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">{fullName}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {isEntity
                ? 'Review advisor-submitted legal entity data below, then review system verification and AML outcomes.'
                : 'Review advisor-submitted client data in KYC Information, then review verification and home office outcomes.'}
            </p>
          </div>
          <Badge variant={headerBadgeVariant} className="shrink-0">
            {reviewStatusLabel}
          </Badge>
        </div>

        {/* Section A — submitted / editable data */}
        <section className="rounded-xl border border-border bg-background shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-lg font-semibold text-foreground">KYC Information</h2>
            {canEditKycFields ? (
              <div className="flex flex-wrap items-center gap-2">
                {!isEditing ? (
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={startEdit}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit information
                  </Button>
                ) : (
                  <>
                    <Button type="button" size="sm" className="gap-1.5" onClick={saveEdit}>
                      <Save className="h-3.5 w-3.5" />
                      Save updates
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={cancelEdit}>
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            ) : null}
          </div>
          <div className="p-4 sm:p-5">
            <Accordion type="multiple" defaultValue={['identity', 'address']} className="space-y-3">
              <AccordionItem value="identity" className="rounded-lg border border-border overflow-hidden bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/40 border-b border-border data-[state=open]:border-b">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Identity
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-3 pb-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      {isEntity ? (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Legal name</Label>
                            <Input value={editVal('legalName')} onChange={(e) => setEditVal('legalName', e.target.value)} />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Entity type</Label>
                              <Input value={editVal('entityType')} onChange={(e) => setEditVal('entityType', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tax ID / EIN</Label>
                              <Input value={editVal('taxId')} onChange={(e) => setEditVal('taxId', e.target.value)} />
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Jurisdiction</Label>
                              <Input value={editVal('jurisdiction')} onChange={(e) => setEditVal('jurisdiction', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Contact person</Label>
                              <Input value={editVal('contactPerson')} onChange={(e) => setEditVal('contactPerson', e.target.value)} />
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Email</Label>
                              <Input value={editVal('email')} onChange={(e) => setEditVal('email', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Phone</Label>
                              <Input value={editVal('phone')} onChange={(e) => setEditVal('phone', e.target.value)} />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">First name</Label>
                              <Input value={editVal('firstName')} onChange={(e) => setEditVal('firstName', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Last name</Label>
                              <Input value={editVal('lastName')} onChange={(e) => setEditVal('lastName', e.target.value)} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Date of birth</Label>
                            <Input type="date" value={editVal('dob')} onChange={(e) => setEditVal('dob', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">SSN / Tax ID</Label>
                            <Input value={editVal('taxId')} onChange={(e) => setEditVal('taxId', e.target.value)} />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Email</Label>
                              <Input value={editVal('email')} onChange={(e) => setEditVal('email', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Phone</Label>
                              <Input value={editVal('phone')} onChange={(e) => setEditVal('phone', e.target.value)} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0">
                      <ReviewRow label="Full name" value={fullName} />
                      {!isEntity && (
                        <>
                          <ReviewRow label="Date of birth" value={dob || 'Not provided'} />
                          <ReviewRow label="SSN / Tax ID" value={maskedTaxId} />
                          <ReviewRow label="Relationship" value={party?.relationship} />
                          <ReviewRow label="ID type" value={idType || 'Not provided'} />
                          <ReviewRow label="ID number" value={idNumber ? `****${idNumber.slice(-4)}` : 'Not provided'} />
                          <ReviewRow label="Issuing state" value={idState || 'Not provided'} />
                          <ReviewRow label="ID expiration" value={idExpiration || 'Not provided'} />
                        </>
                      )}
                      {isEntity && (
                        <>
                          <ReviewRow label="Entity type" value={entityType || 'Not provided'} />
                          <ReviewRow label="Tax ID / EIN" value={ssn ? `**-***${ssn.slice(-4)}` : 'Not provided'} />
                          <ReviewRow label="Jurisdiction" value={jurisdiction || 'Not provided'} />
                          <ReviewRow label="Contact person" value={contactPerson || 'Not provided'} />
                          <ReviewRow label="Email" value={email || 'Not provided'} />
                          <ReviewRow label="Phone" value={phone || 'Not provided'} />
                        </>
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="address" className="rounded-lg border border-border overflow-hidden bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/40 border-b border-border data-[state=open]:border-b">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Address
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-3 pb-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Street</Label>
                        <Input value={editVal('legalStreet')} onChange={(e) => setEditVal('legalStreet', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Apt / unit</Label>
                        <Input value={editVal('legalApt')} onChange={(e) => setEditVal('legalApt', e.target.value)} />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">City</Label>
                          <Input value={editVal('legalCity')} onChange={(e) => setEditVal('legalCity', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">State</Label>
                          <Input value={editVal('legalState')} onChange={(e) => setEditVal('legalState', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">ZIP / Postal code</Label>
                          <Input value={editVal('legalZip')} onChange={(e) => setEditVal('legalZip', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Country</Label>
                          <Input value={editVal('legalCountry')} onChange={(e) => setEditVal('legalCountry', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      <ReviewRow label="Street" value={legalStreet || 'Not provided'} />
                      <ReviewRow label="Apt / unit" value={((taskData.legalApt as string) || '').trim() || 'Not provided'} />
                      <ReviewRow label="City" value={legalCity || 'Not provided'} />
                      <ReviewRow label="State" value={legalState || 'Not provided'} />
                      <ReviewRow label="ZIP / Postal code" value={legalZip || 'Not provided'} />
                      <ReviewRow label="Country" value={legalCountry || 'Not provided'} />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="employment" className="rounded-lg border border-border overflow-hidden bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/40 border-b border-border data-[state=open]:border-b">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {isEntity ? 'Business profile' : 'Employment'}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-3 pb-4">
                  {isEditing ? (
                    isEntity ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Industry</Label>
                          <Input value={editVal('bizIndustry')} onChange={(e) => setEditVal('bizIndustry', e.target.value)} />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Annual revenue range</Label>
                          <Input value={editVal('annualRevenueRange')} onChange={(e) => setEditVal('annualRevenueRange', e.target.value)} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Employment status</Label>
                          <Input value={editVal('employmentStatus')} onChange={(e) => setEditVal('employmentStatus', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Employer</Label>
                          <Input value={editVal('employerName')} onChange={(e) => setEditVal('employerName', e.target.value)} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Occupation</Label>
                            <Input value={editVal('occupation')} onChange={(e) => setEditVal('occupation', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Industry</Label>
                            <Input value={editVal('industry')} onChange={(e) => setEditVal('industry', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )
                  ) : isEntity ? (
                    <div className="space-y-0">
                      <ReviewRow label="Industry" value={(taskData.bizIndustry as string) || industry || 'Not provided'} />
                      <ReviewRow label="Annual revenue range" value={annualRevenueRange || 'Not provided'} />
                    </div>
                  ) : (
                    <div className="space-y-0">
                      <ReviewRow label="Employment status" value={employmentStatus || 'Not provided'} />
                      <ReviewRow label="Employer" value={employerName || 'Not provided'} />
                      <ReviewRow label="Occupation" value={occupation || 'Not provided'} />
                      <ReviewRow label="Industry" value={industry || 'Not provided'} />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="suitability" className="rounded-lg border border-border overflow-hidden bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/40 border-b border-border data-[state=open]:border-b">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    Suitability
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-3 pb-4">
                  {isEditing ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Source of funds</Label>
                      <Input value={editVal('sourceOfFunds')} onChange={(e) => setEditVal('sourceOfFunds', e.target.value)} />
                    </div>
                  ) : (
                    <div className="py-2">
                      <p className="text-sm text-muted-foreground">Source of funds</p>
                      <ul className="mt-1 space-y-1">
                        {(sourceOfFundsItems.length > 0 ? sourceOfFundsItems : ['Not provided']).map((item) => (
                          <li key={item} className="text-sm text-foreground">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {supportingDocReferences.length > 0 && (
                <AccordionItem value="supporting-docs" className="rounded-lg border border-border overflow-hidden bg-card">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/40 border-b border-border data-[state=open]:border-b">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      Supporting documents
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-3 pb-4">
                    <ul className="space-y-2 text-sm">
                      {supportingDocReferences.map((r, i) => (
                        <li key={`${r.label}-${r.name}-${i}`} className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="font-medium text-right">{r.name}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </section>

        {/* Section B — read-only verification & review */}
        <section className="rounded-xl border border-border bg-muted/25">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 bg-muted/40">
            <h2 className="text-lg font-semibold text-foreground">Verification results</h2>
            <VerificationRunControl childId={childId} childStatus={child.status} />
          </div>

          <div className="p-4 sm:p-5 space-y-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Status summary</h3>
              <div className="rounded-lg border border-border/80 bg-background/80 px-3 sm:px-4">
                <ReviewRow label="KYC status" value={cipStatusLabel} />
                <ReviewRow label="Review status" value={reviewStatusLabel} />
                <ReviewRow label="Submission date" value={String(submissionDate)} />
                <ReviewRow label="Last checked" value={lastCheckedDisplay} />
                <ReviewRow label="Verification confidence" value={confidenceLabel} />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Verification outcome</h3>
              <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3">
                <ul className="list-disc pl-4 space-y-1.5 text-sm text-foreground">
                  {outcomeBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Verification method</h3>
              <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3 space-y-1.5 text-sm text-foreground">
                <p>Verified using trusted data providers.</p>
                <p>Verification based on SSN, date of birth, and address on file.</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">AML / CIP</h3>
              <div className="rounded-lg border border-border/80 bg-background/80 px-3 sm:px-4">
                <ReviewRow label="AML status" value={amlStatusLabel} />
                {amlReview?.findings ? <ReviewRow label="AML findings" value={amlReview.findings} /> : null}
                <ReviewRow label="Identity verification (CIP)" value={cipDetailLabel(cipStatus?.idVerification)} />
                <ReviewRow label="Address match" value={cipDetailLabel(cipStatus?.addressMatch)} />
                <ReviewRow label="Date of birth match" value={cipDetailLabel(cipStatus?.dobMatch)} />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Risk signals</h3>
              <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3 text-sm text-foreground space-y-1">
                <p>Sanctions screening: No matches (demo).</p>
                <p>PEP screening: Not elevated (demo).</p>
                <p>Negative media: No high-risk hits (demo).</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Flags &amp; issues</h3>
              <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3 text-sm">
                <p className={amlBlocked ? 'text-amber-900 dark:text-amber-100' : 'text-foreground'}>
                  {amlBlocked ? 'AML review must be cleared before final approval.' : 'No blocking flags on this subject (demo).'}
                </p>
                {(reviewState?.validationErrors?.length ?? 0) > 0 && (
                  <ul className="mt-2 list-disc pl-4 space-y-1 text-muted-foreground">
                    {(reviewState?.validationErrors ?? []).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">System notes</h3>
              <div className="rounded-lg border border-border/80 bg-background/80 px-3 sm:px-4">
                <ReviewRow label="Screening batch ID" value="AML-2025-18492" />
                <ReviewRow label="Last verification timestamp" value={String(verificationTimestamp)} />
                {reviewState?.kycVerificationResultSummary ? (
                  <ReviewRow label="Latest check summary" value={reviewState.kycVerificationResultSummary} />
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Reviewer notes</h3>
              <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3 text-sm text-foreground">
                {hoKycReview?.comments ? (
                  <p>{hoKycReview.comments}</p>
                ) : (
                  <p className="text-muted-foreground">No reviewer comments recorded.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
