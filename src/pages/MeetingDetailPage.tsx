import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { MeetingLayout } from '@/components/meetings/MeetingLayout'
import { useMeetings } from '@/stores/meetingsStore'

export function MeetingDetailPage() {
  const { meetingId } = useParams()
  const m = useMeetings()
  const meeting = m.meetings.find((x) => x.id === meetingId)

  if (!meeting) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto py-12 text-center text-sm text-muted-foreground">Meeting not found.</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* key by id so all per-meeting view state (tabs, sidebar panel, link/relationship fields) resets on navigation */}
      <MeetingLayout key={meeting.id} meeting={meeting} />
    </AppShell>
  )
}
