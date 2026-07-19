import { useState } from 'react'
import { toast } from 'sonner'
import {
  Sparkles, ThumbsUp, ThumbsDown, Wand2, Check, Copy, MailOpen, Send, X, RotateCcw, ChevronDown, Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { AITextEditor } from './AITextEditor'
import { useMeetings } from '@/stores/meetingsStore'
import type { Meeting } from '@/types/meeting'
import { cn } from '@/lib/utils'

function Recipients({ label, people }: { label: string; people: string[] }) {
  if (people.length === 0) return null
  return (
    <div className="flex items-center gap-2 px-1 py-1.5 text-xs">
      <span className="w-7 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {people.map((p) => <span key={p} className="rounded-full bg-muted px-2 py-0.5 text-foreground/80">{p}</span>)}
      </div>
    </div>
  )
}

function GuidedSend({ meeting, onSent }: { meeting: Meeting; onSent: () => void }) {
  const m = useMeetings()
  const email = m.emails[meeting.id]
  const [step, setStep] = useState(0)
  const steps = ['Select the email text', 'Copy', 'Paste in your email app', 'Mark as Sent']

  const plain = email.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const mailto = `mailto:${email.to.join(',')}?cc=${email.cc.join(',')}&subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(plain)}`

  const doStep = (i: number) => {
    if (i === 1) { navigator.clipboard?.writeText(plain).catch(() => {}); toast.success('Email copied to clipboard') }
    if (i === 2) { window.open(mailto, '_blank') }
    if (i === 3) { onSent(); return }
    setStep(Math.max(step, i + 1))
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-xs font-medium text-foreground">Send through your email app — preserves formatting</p>
      <ol className="space-y-1.5">
        {steps.map((label, i) => {
          const done = i < step
          const current = i === step
          return (
            <li key={i} className={cn('flex items-center justify-between rounded-lg px-2.5 py-2 text-sm', current ? 'bg-[#0b4f9c0a]' : '')}>
              <span className="flex items-center gap-2">
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold', done ? 'bg-emerald-100 text-emerald-700' : current ? 'bg-[#0b4f9c] text-white' : 'bg-muted text-muted-foreground')}>
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={cn(done ? 'text-muted-foreground line-through' : 'text-foreground')}>{label}</span>
              </span>
              {current && (
                <Button size="sm" variant={i === 3 ? 'default' : 'outline'} className="h-7 gap-1.5" onClick={() => doStep(i)}>
                  {i === 0 && <>Select All</>}
                  {i === 1 && <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  {i === 2 && <><MailOpen className="h-3.5 w-3.5" /> Open mail</>}
                  {i === 3 && <><Send className="h-3.5 w-3.5" /> Mark Sent</>}
                </Button>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function EmailTab({ meeting }: { meeting: Meeting }) {
  const m = useMeetings()
  const email = m.emails[meeting.id]
  const fb = m.feedback[`email-${meeting.id}`]
  const [regenerating, setRegenerating] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [nonce, setNonce] = useState(0)
  const edited = !!m.dirty[`email-${meeting.id}`]

  // Pre-meeting placeholder (no draft yet).
  if (!email || meeting.lifecycle === 'upcoming' || meeting.lifecycle === 'live') {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#0b4f9c14] text-[#0b4f9c]"><Sparkles className="h-5 w-5" /></span>
        <p className="text-sm font-medium text-foreground">AI will write a follow-up</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">Once the session ends, we'll draft a message you can refine, copy, and send to the client.</p>
      </div>
    )
  }

  if (email.status === 'skipped') {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Email skipped — we've kept the draft on file.</span>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => m.setEmailStatus(meeting.id, 'draft')}><RotateCcw className="h-3.5 w-3.5" /> Restore draft</Button>
      </div>
    )
  }

  const sent = email.status === 'sent'

  const refine = (label: string) => {
    setRegenerating(true)
    setTimeout(() => { setRegenerating(false); toast.success(`Email rewritten — ${label.toLowerCase()}`) }, 800)
  }

  const restoreAi = () => { m.restoreEmail(meeting.id); setNonce((n) => n + 1); toast.success('Restored the AI draft') }

  const footer = (
    <div className="flex h-full items-center justify-between gap-2 px-4">
      <div className="flex items-center gap-2">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', sent ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
          <Mail className="h-3 w-3" /> {sent ? 'Mail Sent' : 'Mail Not Sent'}
        </span>
        {email.isAi && !sent && (
          <span className="inline-flex items-center gap-0.5">
            <button onClick={() => m.setFeedback(`email-${meeting.id}`, fb === 'up' ? undefined : 'up')} className={cn('rounded p-1 hover:bg-muted', fb === 'up' ? 'text-emerald-600' : 'text-muted-foreground')}><ThumbsUp className="h-3.5 w-3.5" /></button>
            <button onClick={() => m.setFeedback(`email-${meeting.id}`, fb === 'down' ? undefined : 'down')} className={cn('rounded p-1 hover:bg-muted', fb === 'down' ? 'text-red-600' : 'text-muted-foreground')}><ThumbsDown className="h-3.5 w-3.5" /></button>
          </span>
        )}
      </div>
      {sent ? (
        <Button size="sm" variant="outline" onClick={() => m.setEmailStatus(meeting.id, 'draft')}>Mark Not Sent</Button>
      ) : (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => m.setEmailStatus(meeting.id, 'skipped')}><X className="h-3.5 w-3.5" /> Skip</Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowSend((s) => !s)}><Send className="h-3.5 w-3.5" /> Send via email <ChevronDown className="h-3 w-3" /></Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {/* subject + recipients */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="w-7 shrink-0 text-xs text-muted-foreground">Subj</span>
          <input
            value={email.subject}
            onChange={(e) => { m.setEmailSubject(meeting.id, e.target.value); m.setDirty(`email-${meeting.id}`, true) }}
            disabled={sent}
            className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none disabled:opacity-70"
          />
        </div>
        <Recipients label="To" people={email.to} />
        <div className="border-t border-border" />
        <Recipients label="Cc" people={email.cc} />
      </div>

      {/* AI controls */}
      {email.isAi && !sent && (
        <div className="flex items-center justify-between">
          {edited ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"><Sparkles className="h-3 w-3" /> AI draft · edited by you</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0b4f9c14] px-2 py-0.5 text-xs font-medium text-[#0b4f9c]"><Sparkles className="h-3 w-3" /> AI-drafted from your summary</span>
          )}
          <div className="flex items-center gap-1.5">
            {edited && (
              <button type="button" onClick={restoreAi} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                <RotateCcw className="h-3.5 w-3.5" /> Restore AI draft
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50">
                  <Wand2 className="h-3.5 w-3.5 text-[#0b4f9c]" /> Refine <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {['Make it warmer', 'More concise', 'More formal', 'Add next-meeting date'].map((o) => (
                  <DropdownMenuItem key={o} onClick={() => refine(o)}>{o}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {regenerating ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-10 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse text-[#0b4f9c]" /> Rewriting the email…
        </div>
      ) : (
        <AITextEditor
          key={`email-${meeting.id}-${nonce}`}
          title="Follow-up email"
          placeholder="Write your follow-up email…"
          content={email.bodyHtml}
          disabled={sent}
          bottomText="This draft is based on your meeting notes. Edit it, then copy and send through your email app."
          footer={footer}
          onChange={(html) => { m.setEmailContent(meeting.id, html); m.setDirty(`email-${meeting.id}`, true) }}
        />
      )}

      {showSend && !sent && <GuidedSend meeting={meeting} onSent={() => { m.setEmailStatus(meeting.id, 'sent'); setShowSend(false); toast.success('Logged as sent') }} />}
    </div>
  )
}
