import { useState } from 'react'
import { useWorkflow, useChildActionContext, getChildReviewState } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  ShieldAlert,
  CheckCircle2,
  FileText,
  User,
  MapPin,
  Landmark,
  AlertTriangle,
  Pencil,
  Save,
  X,
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

function AccordionSection({
  value,
  title,
  icon: Icon,
  children,
}: {
  value: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <AccordionItem value={value} className="rounded-lg border border-border overflow-hidden bg-background">
      <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 border-b border-border data-[state=open]:border-b">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pt-2 pb-4">
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}

export function ChildHoKycViewContent() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const child = ctx?.child
  const childId = child?.id ?? ''
  const activeSubTaskFormKey = ctx?.currentSubTask?.formKey
  const documentsOnlyView = activeSubTaskFormKey === 'kyc-child-documents'
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
  const canEditKycFields = rights.canEditKycFields !== false
  const cipReviewUploads =
    ((taskData.cipReviewUploads as Array<{ id: string; fileName: string; uploadedAt: string }> | undefined) ?? [])

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
        ? 'Changes Requested'
        : 'Pending Review'
  const cipStatusLabel =
    cipStatus?.overallStatus === 'pass'
      ? 'Passed'
      : cipStatus?.overallStatus === 'fail'
        ? 'Failed'
        : 'Pending'

  if (!ctx || !child) return null

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
                  This {isEntity ? 'legal entity' : 'individual'}'s KYC has been approved by Document Review. Approved at {hoKycReview.decidedAt}.
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
                  The AML team has cleared this {isEntity ? 'legal entity' : 'individual'}. You may now approve the KYC review.
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
                    ? `The AML team has flagged this ${isEntity ? 'legal entity' : 'individual'}. KYC approval is blocked until AML review is resolved.`
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
          <h2 className="text-2xl font-semibold text-foreground">{fullName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {documentsOnlyView
              ? (isEntity
                ? 'Review supporting KYB documentation for this subject'
                : 'Review supporting KYC documentation for this subject')
              : (isEntity
                ? 'Review advisor-submitted KYB/KYC legal entity data'
                : 'Review advisor-submitted KYC data and CIP verification results')}
          </p>
          {canEditKycFields && !documentsOnlyView ? (
            <div className="mt-3 flex items-center gap-2">
              {!isEditing ? (
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit KYC fields
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

        {!documentsOnlyView ? (
          <div className="space-y-4">
            <section className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
              <h3 className="text-sm font-semibold">Case Overview</h3>
              <ReviewRow label="CIP Status" value={cipStatusLabel} />
              <ReviewRow label="Review Status" value={reviewStatusLabel} />
              <ReviewRow label="Submission Date" value={String(submissionDate)} />
              <ReviewRow
                label="Verification Confidence"
                value={cipStatus?.overallStatus === 'pass' ? 'High' : cipStatus?.overallStatus === 'fail' ? 'Low' : 'Medium'}
              />
            </section>

            <section className="rounded-lg border border-border p-4 space-y-2">
              <h3 className="text-sm font-semibold">Verification Summary</h3>
              <p className="text-sm">Identity successfully verified</p>
              <p className="text-sm">SSN, date of birth, and address matched</p>
              <p className="text-sm">No mismatches detected</p>
            </section>

            <section className="rounded-lg border border-border p-4 space-y-2">
              <h3 className="text-sm font-semibold">Verification Method</h3>
              <p className="text-sm">Identity verified using trusted data sources</p>
              <p className="text-sm">Verification based on SSN, name, date of birth, and address</p>
            </section>

            <Accordion type="multiple" defaultValue={['identity', 'address']} className="space-y-3">
              <AccordionItem value="identity" className="rounded-lg border border-border overflow-hidden bg-background">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 border-b border-border data-[state=open]:border-b">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Identity
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      {isEntity ? (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Legal Name</Label>
                            <Input value={editVal('legalName')} onChange={(e) => setEditVal('legalName', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Tax ID / EIN</Label>
                            <Input value={editVal('taxId')} onChange={(e) => setEditVal('taxId', e.target.value)} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">First Name</Label>
                              <Input value={editVal('firstName')} onChange={(e) => setEditVal('firstName', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Last Name</Label>
                              <Input value={editVal('lastName')} onChange={(e) => setEditVal('lastName', e.target.value)} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Date of Birth</Label>
                            <Input type="date" value={editVal('dob')} onChange={(e) => setEditVal('dob', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">SSN / Tax ID</Label>
                            <Input value={editVal('taxId')} onChange={(e) => setEditVal('taxId', e.target.value)} />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <ReviewRow label="Full Name" value={fullName} />
                      <ReviewRow label="Date of Birth" value={dob || 'Not provided'} />
                      <ReviewRow label="SSN / Tax ID" value={maskedTaxId} />
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="address" className="rounded-lg border border-border overflow-hidden bg-background">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 border-b border-border data-[state=open]:border-b">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Address
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Street</Label>
                        <Input value={editVal('legalStreet')} onChange={(e) => setEditVal('legalStreet', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Apt / Unit</Label>
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
                    <>
                      <p className="text-sm">
                        {legalStreet
                          ? `${legalStreet}${(taskData.legalApt as string) ? `, ${(taskData.legalApt as string)}` : ''}`
                          : 'Not provided'}
                      </p>
                      <p className="text-sm">
                        {[legalCity, legalState, legalZip].filter(Boolean).join(', ') || 'Not provided'}
                      </p>
                      <p className="text-sm">{legalCountry || 'Not provided'}</p>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="risk" className="rounded-lg border border-border overflow-hidden bg-background">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 border-b border-border data-[state=open]:border-b">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                    Risk Signals
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4">
                  <ReviewRow label="Employment" value={employmentStatus || 'Not provided'} />
                  <div className="py-2">
                    <p className="text-sm text-muted-foreground">Source of Funds</p>
                    <ul className="mt-1 space-y-1">
                      {(sourceOfFundsItems.length > 0 ? sourceOfFundsItems : ['Not provided']).map((item) => (
                        <li key={item} className="text-sm">- {item}</li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="flags" className="rounded-lg border border-border overflow-hidden bg-background">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 border-b border-border data-[state=open]:border-b">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    Flags & Issues
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4">
                  <p className="text-sm">{amlBlocked ? 'Review required before approval' : 'No issues identified'}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Accordion type="multiple" defaultValue={['activity']} className="space-y-3">
              <AccordionItem value="activity" className="rounded-lg border border-border overflow-hidden bg-background">
                <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30 border-b border-border data-[state=open]:border-b">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Activity & System Notes
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4">
                  <ReviewRow label="CIP verification result" value={cipStatusLabel} />
                  <ReviewRow label="Screening batch ID" value="AML-2025-18492" />
                  <ReviewRow label="Last verification timestamp" value={String(verificationTimestamp)} />
                  {cipReviewUploads.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground mb-1">Reviewer uploads</p>
                      <ul className="space-y-1">
                        {cipReviewUploads.map((u) => (
                          <li key={u.id} className="text-sm">{u.fileName}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={[]} className="space-y-3">
          <AccordionSection value={isEntity ? 'entity' : 'personal'} title={isEntity ? 'Legal Entity Information' : 'Personal Information'} icon={FileText}>
            {isEditing ? (
              <div className="space-y-3 py-2">
                {isEntity ? (
                  <>
                    <div className="space-y-1"><Label className="text-xs">Legal name</Label><Input value={editVal('legalName')} onChange={(e) => setEditVal('legalName', e.target.value)} /></div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1"><Label className="text-xs">Entity type</Label><Input value={editVal('entityType')} onChange={(e) => setEditVal('entityType', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Tax ID / EIN</Label><Input value={editVal('taxId')} onChange={(e) => setEditVal('taxId', e.target.value)} /></div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1"><Label className="text-xs">Jurisdiction</Label><Input value={editVal('jurisdiction')} onChange={(e) => setEditVal('jurisdiction', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Contact person</Label><Input value={editVal('contactPerson')} onChange={(e) => setEditVal('contactPerson', e.target.value)} /></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1"><Label className="text-xs">First name</Label><Input value={editVal('firstName')} onChange={(e) => setEditVal('firstName', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Last name</Label><Input value={editVal('lastName')} onChange={(e) => setEditVal('lastName', e.target.value)} /></div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1"><Label className="text-xs">Date of birth</Label><Input type="date" value={editVal('dob')} onChange={(e) => setEditVal('dob', e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">SSN / Tax ID</Label><Input value={editVal('taxId')} onChange={(e) => setEditVal('taxId', e.target.value)} /></div>
                    </div>
                  </>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={editVal('email')} onChange={(e) => setEditVal('email', e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={editVal('phone')} onChange={(e) => setEditVal('phone', e.target.value)} /></div>
                </div>
              </div>
            ) : (
              <>
                <ReviewRow label={isEntity ? 'Legal Name' : 'Full Name'} value={fullName} />
                {isEntity ? (
                  <>
                    <ReviewRow label="Entity Type" value={entityType || 'Not provided'} />
                    <ReviewRow label="Tax ID / EIN" value={ssn ? `**-***${ssn.slice(-4)}` : 'Not provided'} />
                    <ReviewRow label="Jurisdiction" value={jurisdiction || 'Not provided'} />
                    <ReviewRow label="Contact Person" value={contactPerson || 'Not provided'} />
                  </>
                ) : (
                  <>
                    <ReviewRow label="Date of Birth" value={dob} />
                    <ReviewRow label="SSN / Tax ID" value={ssn ? `***-**-${ssn.slice(-4)}` : 'Not provided'} />
                  </>
                )}
                <ReviewRow label="Email" value={email} />
                <ReviewRow label="Phone" value={phone} />
              </>
            )}
            {!isEntity && <ReviewRow label="Relationship" value={party?.relationship} />}
          </AccordionSection>
          

          {!isEntity && (
            <AccordionSection value="address" title="Address" icon={FileText}>
              {isEditing ? (
                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Street</Label>
                    <Input value={editVal('legalStreet')} onChange={(e) => setEditVal('legalStreet', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Apt / Unit</Label>
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
                <>
                  <ReviewRow label="Street" value={legalStreet || 'Not provided'} />
                  <ReviewRow label="Apt / Unit" value={((taskData.legalApt as string) || '').trim() || 'Not provided'} />
                  <ReviewRow label="City" value={legalCity || 'Not provided'} />
                  <ReviewRow label="State" value={legalState || 'Not provided'} />
                  <ReviewRow label="ZIP / Postal code" value={legalZip || 'Not provided'} />
                  <ReviewRow label="Country" value={legalCountry || 'Not provided'} />
                </>
              )}
            </AccordionSection>
          )}

          {!isEntity && (
            <AccordionSection value="id-verification" title="ID Verification" icon={FileText}>
            <ReviewRow label="ID Type" value={idType || 'Not provided'} />
            <ReviewRow label="ID Number" value={idNumber ? `****${idNumber.slice(-4)}` : 'Not provided'} />
            <ReviewRow label="Issuing State" value={idState || 'Not provided'} />
            <ReviewRow label="Expiration" value={idExpiration || 'Not provided'} />
            </AccordionSection>
          )}

          <AccordionSection value={isEntity ? 'business' : 'employment'} title={isEntity ? 'Business Profile' : 'Employment'} icon={FileText}>
            {isEntity ? (
              <>
                <ReviewRow label="Industry" value={industry || 'Not provided'} />
                <ReviewRow label="Annual Revenue Range" value={annualRevenueRange || 'Not provided'} />
                <ReviewRow label="Source of Funds" value={sourceOfFunds || 'Not provided'} />
              </>
            ) : (
              <>
                <ReviewRow label="Status" value={employmentStatus || 'Not provided'} />
                <ReviewRow label="Employer" value={employerName || 'Not provided'} />
                <ReviewRow label="Occupation" value={occupation || 'Not provided'} />
                <ReviewRow label="Industry" value={industry || 'Not provided'} />
              </>
            )}
          </AccordionSection>
          

          {!isEntity && (
            <AccordionSection value="source-of-funds" title="Source of Funds" icon={FileText}>
              <ReviewRow label="Primary Source" value={sourceOfFunds || 'Not provided'} />
            </AccordionSection>
          )}

        </Accordion>
        )}
      </div>
    </main>
  )
}
