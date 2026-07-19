import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, ArrowRight, NotepadText, Mail, Workflow, HandHeart, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Meeting } from '@/types/meeting'
import { useMeetings } from '@/stores/meetingsStore'
import { fmtDate, fmtTime, LIFECYCLE_LABEL, isLive } from './meetingUtils'
import { VendorMark } from './VendorMark'

type Tab = 'summary' | 'actions' | 'email'

const PROSE = 'prose prose-sm max-w-none text-[13px] prose-headings:text-sm prose-headings:font-semibold prose-p:my-1.5 prose-strong:text-foreground text-foreground/85'

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">{children}</p>
}

export function MeetingQuickView({ meeting, onClose }: { meeting: Meeting | null; onClose: () => void }) {
  const navigate = useNavigate()
  const m = useMeetings()
  const [tab, setTab] = useState<Tab>('summary')

  return (
    <AnimatePresence>
      {meeting && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/20"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key={meeting.id}
            className="fixed right-0 top-0 z-[71] flex h-full w-[440px] max-w-[92vw] flex-col border-l border-border bg-card shadow-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            onAnimationStart={() => setTab('summary')}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {isLive(meeting) ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live</span>
                  ) : (
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{LIFECYCLE_LABEL[meeting.lifecycle ?? 'upcoming']}</span>
                  )}
                  <span className="truncate text-sm font-semibold text-foreground">{meeting.subject}</span>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <VendorMark vendor={meeting.vendor} className="h-3.5 w-3.5" />
                  {meeting.relationshipName || 'No relationship connected'} · {fmtDate(meeting.startTime)}, {fmtTime(meeting.startTime)}
                </p>
              </div>
              <button onClick={onClose} title="Close" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border px-2">
              {([['summary', 'Summary', NotepadText], ['actions', 'Actions', Workflow], ['email', 'Email', Mail]] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs transition-colors', tab === id ? 'border-[#0b4f9c] font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {tab === 'summary' && <SummaryPeek meeting={meeting} html={m.summaries[meeting.id]?.contentHtml} ai={m.summaries[meeting.id]?.isAiEnhanced} />}
              {tab === 'actions' && <ActionsPeek recs={m.recommendations[meeting.id] ?? []} linked={(m.linkedActions[meeting.id] ?? []).length} referrals={(meeting.referralMoments ?? []).length} />}
              {tab === 'email' && <EmailPeek meeting={meeting} html={m.emails[meeting.id]?.bodyHtml} subject={m.emails[meeting.id]?.subject} />}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-3">
              <button
                onClick={() => { navigate(`/meetings/${meeting.id}`); onClose() }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0b4f9c] px-3 py-2 text-sm font-medium text-white hover:bg-[#0a4587]"
              >
                Open full page <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function SummaryPeek({ meeting, html, ai }: { meeting: Meeting; html?: string; ai?: boolean }) {
  if (html) {
    return (
      <div className="flex flex-col gap-2">
        {ai && <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#0b4f9c14] px-2 py-0.5 text-xs font-medium text-[#0b4f9c]"><Sparkles className="h-3 w-3" /> AI-generated summary</span>}
        <div className={PROSE} dangerouslySetInnerHTML={{ __html: html }} />
        {meeting.topics && meeting.topics.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Tag className="h-3.5 w-3.5" /> Topics</span>
            {meeting.topics.map((t) => <span key={t.id} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground/80">{t.label}</span>)}
          </div>
        )}
      </div>
    )
  }
  if (isLive(meeting)) return <Empty>Meeting in progress — the AI summary generates when it ends.</Empty>
  if (meeting.lifecycle === 'no_recording') return <Empty>No recording — link one to generate an AI summary, or write it on the full page.</Empty>
  return <Empty>The AI summary will appear here after the meeting.</Empty>
}

function ActionsPeek({ recs, linked, referrals }: { recs: { id: string; blueprintName: string; blueprintCategory: string }[]; linked: number; referrals: number }) {
  if (recs.length === 0 && linked === 0 && referrals === 0) return <Empty>No actions or AI suggestions yet.</Empty>
  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{linked} linked</span><span>·</span><span>{recs.length} suggested</span><span>·</span><span className="inline-flex items-center gap-1"><HandHeart className="h-3.5 w-3.5 text-rose-500" /> {referrals} referral{referrals === 1 ? '' : 's'}</span>
      </div>
      {recs.length > 0 && (
        <div className="rounded-lg border border-[#0b4f9c33] bg-[#0b4f9c0a] p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#0b4f9c]"><Sparkles className="h-3.5 w-3.5" /> AI suggestions</p>
          <ul className="space-y-1.5">
            {recs.map((r) => (
              <li key={r.id} className="text-foreground/85"><span className="font-medium text-foreground">{r.blueprintName}</span> <span className="text-xs text-muted-foreground">· {r.blueprintCategory}</span></li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Open the full page to create or link actions.</p>
    </div>
  )
}

function EmailPeek({ meeting, html, subject }: { meeting: Meeting; html?: string; subject?: string }) {
  if (!html || meeting.lifecycle === 'upcoming' || meeting.lifecycle === 'live') return <Empty>The follow-up email is drafted after the meeting ends.</Empty>
  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#0b4f9c14] px-2 py-0.5 text-xs font-medium text-[#0b4f9c]"><Sparkles className="h-3 w-3" /> AI-drafted follow-up</span>
      {subject && <p className="text-sm font-medium text-foreground">{subject}</p>}
      <div className={PROSE} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
