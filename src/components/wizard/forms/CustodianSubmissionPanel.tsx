import { useMemo, useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Send,
  PenLine,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Check,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Simulated end-of-flow "submit to custodian" sequence (prototype):
 * Quik PDF-fill → assemble & send one DocuSign envelope → client signs →
 * deliver signed package to the custodian → custodian returns status (approved / NIGO).
 *
 * The InvestorCOM / Best Interest Disclosure (BID) reference number is captured here
 * and is REQUIRED before the envelope can be sent when an owner reports a rollover
 * source of funds (spec Appendix B.2 + supervision Rule "Source of Funds = Rollover").
 */

type SubStatus = 'idle' | 'generated' | 'sent' | 'signed' | 'delivered' | 'approved' | 'nigo'

interface CustodianSubmission {
  status: SubStatus
  quikFormId?: string
  quikAt?: string
  sentAt?: string
  signedAt?: string
  deliveredAt?: string
  custodianRef?: string
  decidedAt?: string
  nigoReason?: string
  investorComRef?: string
}

const FLOW: SubStatus[] = ['idle', 'generated', 'sent', 'signed', 'delivered', 'approved']
const rank = (s: SubStatus) => (s === 'nigo' ? FLOW.indexOf('delivered') : FLOW.indexOf(s))
const rid = (prefix: string) => `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`
const nowIso = () => new Date().toISOString()
const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

function custodianLabel(id: string | undefined): string {
  if (!id) return 'the custodian'
  const map: Record<string, string> = { schwab: 'Schwab', fidelity: 'Fidelity', sei: 'SEI' }
  return map[id] ?? id.charAt(0).toUpperCase() + id.slice(1)
}

const NIGO_REASONS = [
  'Missing signature on custodian application',
  'Beneficiary allocation does not total 100%',
  'Government-issued ID expired',
  'Trust certification not provided',
  'Name mismatch vs. tax records',
]

export function CustodianSubmissionPanel({ taskId }: { taskId: string }) {
  const { state, dispatch } = useWorkflow()

  const sub: CustodianSubmission = useMemo(() => {
    const bag = state.taskData[taskId] as Record<string, unknown> | undefined
    return (bag?.custodianSubmission as CustodianSubmission | undefined) ?? { status: 'idle' }
  }, [state.taskData, taskId])

  // Custodian comes from the first account-opening child's metadata.
  const accountChildId = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.childType === 'account-opening')?.id
  const custodianId = accountChildId
    ? ((state.taskData[accountChildId] as Record<string, unknown> | undefined)?.custodian as string | undefined)
    : undefined
  const custodian = custodianLabel(custodianId)

  // Rollover source of funds → InvestorCOM / BID reference required.
  const rolloverOwner = state.relatedParties.find(
    (p) => (p.accountOwnerIndividual?.sourceOfFunds ?? '').toLowerCase().includes('rollover'),
  )
  const rolloverDetected = Boolean(rolloverOwner)
  const clientName = state.relatedParties.find((p) => p.isPrimary)?.name ?? 'the client'

  const [investorComDraft, setInvestorComDraft] = useState(sub.investorComRef ?? '')
  const [nigoReason, setNigoReason] = useState(NIGO_REASONS[0])

  const r = rank(sub.status)
  const update = (patch: Partial<CustodianSubmission>) =>
    dispatch({ type: 'SET_TASK_DATA', taskId, fields: { custodianSubmission: { ...sub, ...patch } } })

  const investorComMissing = rolloverDetected && !sub.investorComRef && !investorComDraft.trim()

  // ── Step rows ──────────────────────────────────────────────────────
  const steps: Array<{
    key: string
    icon: typeof FileText
    title: string
    done: boolean
    active: boolean
    body: React.ReactNode
  }> = [
    {
      key: 'quik',
      icon: FileText,
      title: 'Generate custodian form (Quik)',
      done: r >= 1,
      active: sub.status === 'idle',
      body:
        r >= 1 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              Quik filled the {custodian} application · form <span className="font-mono text-foreground">{sub.quikFormId}</span>
            </span>
            <a
              href="/docs/client-application.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline"
            >
              View filled PDF <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <Button type="button" size="sm" onClick={() => update({ status: 'generated', quikFormId: rid('QF'), quikAt: nowIso() })}>
            Generate {custodian} PDF via Quik
          </Button>
        ),
    },
    {
      key: 'send',
      icon: Send,
      title: 'Assemble & send DocuSign envelope',
      done: r >= 2,
      active: sub.status === 'generated',
      body:
        r >= 2 ? (
          <p className="text-xs text-muted-foreground">DocuSign envelope sent to {clientName} · {fmt(sub.sentAt)}</p>
        ) : sub.status === 'generated' ? (
          <div className="space-y-3">
            <BundlePreview custodian={custodian} rollover={rolloverDetected} investorComRef={sub.investorComRef ?? investorComDraft} />
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                Best Interest Disclosure — InvestorCOM reference #
                {rolloverDetected ? (
                  <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-800">Required · rollover</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Optional</Badge>
                )}
              </Label>
              <Input
                value={investorComDraft}
                onChange={(e) => setInvestorComDraft(e.target.value)}
                placeholder="e.g. ICOM-4827193"
                className="h-8 max-w-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                {rolloverDetected
                  ? `${rolloverOwner?.name ?? 'An owner'} reported Source of Funds = Rollover, so the BID (InvestorCOM) reference is required before the envelope can be sent.`
                  : 'Required when an owner’s Source of Funds is a rollover; included in the envelope as the Best Interest Disclosure when present.'}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={investorComMissing}
              onClick={() => update({ status: 'sent', sentAt: nowIso(), investorComRef: investorComDraft.trim() || undefined })}
            >
              Assemble & send envelope
            </Button>
            {investorComMissing ? (
              <p className="text-[11px] text-amber-700">Enter the InvestorCOM reference # to continue.</p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/70">Generate the Quik form first.</p>
        ),
    },
    {
      key: 'sign',
      icon: PenLine,
      title: 'Client signs (one ceremony)',
      done: r >= 3,
      active: sub.status === 'sent',
      body:
        r >= 3 ? (
          <p className="text-xs text-muted-foreground">Signed by {clientName} · {fmt(sub.signedAt)} — single signing ceremony</p>
        ) : sub.status === 'sent' ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => update({ status: 'signed', signedAt: nowIso() })}>
            Mark client signed
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground/70">Waiting on envelope.</p>
        ),
    },
    {
      key: 'deliver',
      icon: Truck,
      title: `Deliver signed package to ${custodian}`,
      done: r >= 4,
      active: sub.status === 'signed',
      body:
        r >= 4 ? (
          <p className="text-xs text-muted-foreground">
            Delivered to {custodian} · ref <span className="font-mono text-foreground">{sub.custodianRef}</span> · {fmt(sub.deliveredAt)}
          </p>
        ) : sub.status === 'signed' ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => update({ status: 'delivered', deliveredAt: nowIso(), custodianRef: rid('CUS') })}>
            Deliver to {custodian}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground/70">Waiting on signature.</p>
        ),
    },
    {
      key: 'status',
      icon: sub.status === 'nigo' ? AlertTriangle : ShieldCheck,
      title: 'Custodian account status',
      done: sub.status === 'approved',
      active: sub.status === 'delivered' || sub.status === 'nigo',
      body:
        sub.status === 'approved' ? (
          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
            Approved by {custodian} · {fmt(sub.decidedAt)}
          </Badge>
        ) : sub.status === 'nigo' ? (
          <div className="space-y-2">
            <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
              NIGO — Not In Good Order
            </Badge>
            <p className="text-xs text-red-700">{sub.nigoReason}</p>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => update({ status: 'delivered', nigoReason: undefined, decidedAt: undefined })}>
              <RotateCcw className="h-3.5 w-3.5" /> Correct & resubmit
            </Button>
          </div>
        ) : sub.status === 'delivered' ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Awaiting custodian response…</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={() => update({ status: 'approved', decidedAt: nowIso() })}>
                Return Approved
              </Button>
              <select
                value={nigoReason}
                onChange={(e) => setNigoReason(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              >
                {NIGO_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              <Button type="button" size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => update({ status: 'nigo', nigoReason, decidedAt: nowIso() })}>
                Return NIGO
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/70">Deliver the package to receive a status.</p>
        ),
    },
  ]

  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Submit to {custodian}</h4>
          <p className="text-xs text-muted-foreground">
            Quik fills the official custodian form, Avantos assembles one DocuSign envelope, then delivers the signed package and tracks the custodian's status.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">Simulated</Badge>
      </div>

      <ol className="relative space-y-5">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isLast = i === steps.length - 1
          const isNigo = step.key === 'status' && sub.status === 'nigo'
          return (
            <li key={step.key} className="relative flex gap-3">
              {!isLast ? (
                <span className={cn('absolute left-[15px] top-8 h-[calc(100%-8px)] w-px', step.done ? 'bg-emerald-300' : 'bg-border')} />
              ) : null}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                  step.done && 'border-emerald-300 bg-emerald-50 text-emerald-600',
                  !step.done && step.active && !isNigo && 'border-foreground bg-foreground text-background',
                  !step.done && step.active && isNigo && 'border-red-300 bg-red-50 text-red-600',
                  !step.done && !step.active && 'border-border bg-background text-muted-foreground',
                )}
              >
                {step.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className={cn('text-sm font-medium', step.done ? 'text-foreground' : step.active ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.title}
                </p>
                <div className="mt-1.5">{step.body}</div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function BundlePreview({ custodian, rollover, investorComRef }: { custodian: string; rollover: boolean; investorComRef?: string }) {
  const items = [
    `${custodian} account application (Quik-filled)`,
    'Stratos Client Agreement bundle',
    'Account disclosures & privacy notice',
    ...(rollover ? [`Best Interest Disclosure (BID)${investorComRef ? ` · InvestorCOM ref ${investorComRef}` : ''}`] : []),
  ]
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">DocuSign envelope · 1 ceremony</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
