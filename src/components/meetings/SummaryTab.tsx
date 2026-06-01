import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AITextEditor } from './AITextEditor'
import { useMeetings } from '@/stores/meetingsStore'
import { cn } from '@/lib/utils'

export function SummaryTab({ meetingId }: { meetingId: string }) {
  const m = useMeetings()
  const summary = m.summaries[meetingId]
  const [busy, setBusy] = useState(false)

  if (!summary) {
    return <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No summary for this meeting yet.</div>
  }

  const attested = summary.isAttested

  const toggle = () => {
    setBusy(true)
    setTimeout(() => {
      if (attested) m.unattestSummary(meetingId)
      else m.attestSummary(meetingId, 'Priya Raman')
      setBusy(false)
    }, 300)
  }

  const footer = (
    <div className="flex items-center justify-between h-full px-4">
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          attested ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600',
        )}
      >
        {attested ? `Summary approved${summary.attestingAgent ? ` · by ${summary.attestingAgent}` : ''}` : 'Pending approval'}
      </span>
      <Button size="sm" disabled={busy} onClick={toggle}>
        {attested ? 'Undo approval' : 'Approve'}
      </Button>
    </div>
  )

  return (
    <AITextEditor
      content={summary.contentHtml}
      disabled={attested}
      bottomText={attested ? 'Approved — read only. The advisor remains accountable for the final summary.' : 'AI-generated draft. Review for accuracy before approving.'}
      footer={footer}
      onChange={(html) => m.setSummaryContent(meetingId, html)}
    />
  )
}
