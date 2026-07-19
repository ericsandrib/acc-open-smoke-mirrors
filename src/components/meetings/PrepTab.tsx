import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, Sparkles, Mail } from 'lucide-react'
import { AITextEditor } from './AITextEditor'
import { PrepReportBody } from './PrepReportView'
import { useMeetings } from '@/stores/meetingsStore'
import type { Meeting } from '@/types/meeting'

export function PrepTab({ meeting }: { meeting: Meeting }) {
  const m = useMeetings()
  const [saved, setSaved] = useState(true)
  const [nonce, setNonce] = useState(0)
  const notes = m.prepNotes[meeting.id] ?? ''

  const addAgendaToNotes = () => {
    const topics = meeting.prepReport?.recommendedTopics ?? []
    if (!topics.length) return
    const agendaHtml = `<p><strong>Recommended agenda</strong> (from the Pre-Meeting Prep Report)</p><ul>${topics.map((t) => `<li>${t}</li>`).join('')}</ul>`
    m.setPrepNotes(meeting.id, agendaHtml + notes)
    setNonce((n) => n + 1)
    toast.success('Agenda added to your prep notes')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pre-Meeting Prep Report — rendered inline (roadmap headline) */}
      {meeting.prepReport && (
        <section className="rounded-xl border border-[#0b4f9c33] bg-gradient-to-br from-[#0b4f9c0a] to-transparent p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0b4f9c] text-white"><Sparkles className="h-5 w-5" /></span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Pre-Meeting Prep Report</span>
                <span className="rounded-full bg-[#0b4f9c14] px-1.5 py-0.5 text-[10px] font-medium text-[#0b4f9c]">Roadmap</span>
              </div>
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> Generated ahead of the meeting and emailed to you.</p>
            </div>
          </div>
          <PrepReportBody meeting={meeting} onAddAgenda={addAgendaToNotes} />
        </section>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" /> Notes for internal use — never shared with the client.
      </div>

      <AITextEditor
        key={`prep-${meeting.id}-${nonce}`}
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
