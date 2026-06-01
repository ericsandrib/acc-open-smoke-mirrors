import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Workflow,
  Plus,
  Trash2,
  Link as LinkIcon,
  Unlink,
  Eye,
  Sparkles,
  Circle,
  Loader2,
  CheckCircle2,
  Calendar,
  FileText,
  PauseCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMeetings } from '@/stores/meetingsStore'
import type { ActionStatus, MeetingActionItem, ActionRecommendation } from '@/types/meeting'

const STATUS_RING: Record<ActionStatus, string> = {
  todo: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-emerald-100 text-emerald-700',
  recommended: 'bg-emerald-100 text-emerald-700',
  complete: 'bg-slate-100 text-slate-600',
  scheduled: 'bg-slate-100 text-slate-600',
  draft: 'bg-slate-100 text-slate-600',
  blocked_pending: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-600',
  rejected: 'bg-red-100 text-red-600',
  failed: 'bg-red-100 text-red-600',
}

function StatusIcon({ status }: { status: ActionStatus }) {
  const c = 'h-3 w-3'
  switch (status) {
    case 'processing': return <Loader2 className={cn(c, 'animate-spin')} />
    case 'complete': return <CheckCircle2 className={c} />
    case 'scheduled': return <Calendar className={c} />
    case 'draft': return <FileText className={c} />
    case 'blocked_pending': return <PauseCircle className={c} />
    case 'cancelled':
    case 'rejected':
    case 'failed': return <XCircle className={c} />
    default: return <Circle className={c} />
  }
}

function ActionTile({ status }: { status?: ActionStatus }) {
  return (
    <div className="relative size-10 shrink-0 flex items-center justify-center rounded-lg bg-muted">
      <Workflow className="h-5 w-5 text-foreground/60" />
      {status && (
        <span className={cn('absolute -right-2 -bottom-2 p-1 rounded-full border-2 border-card', STATUS_RING[status])}>
          <StatusIcon status={status} />
        </span>
      )}
    </div>
  )
}

function RecommendationItem({ rec, onCreate, onDelete }: { rec: ActionRecommendation; onCreate: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md w-full p-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="size-10 shrink-0 flex items-center justify-center rounded-lg border border-border">
          <Workflow className="h-5 w-5 text-[#0b4f9c]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-medium text-foreground">{rec.blueprintName}</span>
          <span className="text-xs text-muted-foreground">{rec.blueprintCategory}</span>
          {rec.detail && <span className="text-xs text-muted-foreground mt-1 leading-snug">{rec.detail}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5" /> Create
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={onDelete} aria-label="Dismiss recommendation">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ActionRow({ action, onLink, onUnlink, onView }: {
  action: MeetingActionItem
  onLink?: () => void
  onUnlink?: () => void
  onView?: () => void
}) {
  return (
    <div className="group flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/60 w-full">
      <div className="flex items-center gap-3 min-w-0">
        <ActionTile status={action.status} />
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-medium text-foreground truncate">{action.name}</span>
          <span className="text-xs text-muted-foreground truncate">{action.blueprintName}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {action.createdAt && (
          <span className={cn('text-xs text-muted-foreground', (onLink || onUnlink) && 'group-hover:hidden')}>{action.createdAt}</span>
        )}
        <div className={cn('items-center gap-1.5', onLink || onUnlink ? 'hidden group-hover:flex' : 'flex')}>
          {onView && <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onView}><Eye className="h-3.5 w-3.5" /></Button>}
          {onLink && <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onLink}><LinkIcon className="h-3.5 w-3.5" /> Link</Button>}
          {onUnlink && <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onUnlink}><Unlink className="h-3.5 w-3.5" /> Unlink</Button>}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>
}

export function MeetingActionsTab({ meetingId }: { meetingId: string }) {
  const navigate = useNavigate()
  const m = useMeetings()
  const recs = m.recommendations[meetingId] ?? []
  const linked = m.linkedActions[meetingId] ?? []
  const existing = m.relationshipActions[meetingId] ?? []
  const skipped = m.actionsSkipped[meetingId]

  const onCreate = (rec: ActionRecommendation) => {
    m.acceptRecommendation(meetingId, rec)
    if (rec.servicingJourneyId) {
      toast.success('Action created — routed for approval', {
        description: rec.blueprintName,
        action: { label: 'View in Servicing', onClick: () => navigate(`/servicing/${rec.servicingJourneyId}`) },
      })
    } else {
      toast.success('Action created', { description: rec.blueprintName })
    }
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      {/* Linked to this meeting */}
      <section className="flex flex-col gap-2">
        <SectionLabel>Actions linked to this meeting</SectionLabel>
        {linked.length === 0 && skipped ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <span>Actions skipped · no follow-ups required</span>
            <Button size="sm" variant="ghost" onClick={() => m.setActionsSkipped(meetingId, false)}>Undo</Button>
          </div>
        ) : linked.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">No actions linked yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Accept a suggestion below, or skip if no follow-ups are needed.</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => m.setActionsSkipped(meetingId, true)}>Skip</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border bg-card">
            {linked.map((a) => (
              <ActionRow key={a.actionRunId} action={a} onUnlink={() => m.unlinkAction(meetingId, a.actionRunId)}
                onView={a.servicingJourneyId ? () => navigate(`/servicing/${a.servicingJourneyId}`) : undefined} />
            ))}
          </div>
        )}
      </section>

      {/* AI suggestions */}
      {recs.length > 0 && (
        <section className="rounded-xl border border-[#0b4f9c33] bg-[#0b4f9c0a] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0b4f9c] text-white"><Sparkles className="h-4 w-4" /></span>
            <span className="text-sm font-semibold text-[#0b4f9c]">AI suggestions based on the meeting transcript</span>
          </div>
          <div className="mx-3 mb-3 rounded-lg border border-border bg-card divide-y divide-border">
            {recs.map((rec) => (
              <RecommendationItem key={rec.id} rec={rec} onCreate={() => onCreate(rec)} onDelete={() => m.deleteRecommendation(meetingId, rec.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Existing actions for the relationship */}
      <section className="flex flex-col gap-2">
        <SectionLabel>All other actions for this relationship</SectionLabel>
        {existing.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">All actions linked.</div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border bg-card">
            {existing.map((a) => (
              <ActionRow key={a.actionRunId} action={a} onLink={() => m.linkAction(meetingId, a)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
