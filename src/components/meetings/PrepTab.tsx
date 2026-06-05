import { useState } from 'react'
import { Lock, Sparkles, ArrowRight, Mail } from 'lucide-react'
import { AITextEditor } from './AITextEditor'
import { useMeetings } from '@/stores/meetingsStore'
import type { Meeting } from '@/types/meeting'

export function PrepTab({ meeting, onOpenPrepReport }: { meeting: Meeting; onOpenPrepReport: () => void }) {
  const m = useMeetings()
  const [saved, setSaved] = useState(true)
  const notes = m.prepNotes[meeting.id] ?? ''

  return (
    <div className="flex flex-col gap-4">
      {/* Pre-Meeting Prep Report card (roadmap headline) */}
      {meeting.prepReport && (
        <button
          onClick={onOpenPrepReport}
          className="group flex items-center gap-3 rounded-xl border border-[#0b4f9c33] bg-gradient-to-br from-[#0b4f9c0a] to-transparent p-4 text-left transition-colors hover:border-[#0b4f9c66]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0b4f9c] text-white"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Pre-Meeting Prep Report is ready</span>
              <span className="rounded-full bg-[#0b4f9c14] px-1.5 py-0.5 text-[10px] font-medium text-[#0b4f9c]">Roadmap</span>
            </div>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" /> Generated ahead of the meeting and emailed to you — meeting history, client profile, financials, and a recommended agenda.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#0b4f9c] opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" /> Notes for internal use — never shared with the client.
      </div>

      <AITextEditor
        title="Prep notes"
        placeholder="Write your prep notes here…"
        showAiHint={false}
        content={notes}
        bottomText={saved ? 'All changes saved' : 'Saving…'}
        onChange={(html) => { m.setPrepNotes(meeting.id, html); setSaved(false); setTimeout(() => setSaved(true), 400) }}
      />
    </div>
  )
}
