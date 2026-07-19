import { Video, Phone, MapPin } from 'lucide-react'
import type { MeetingVendor } from '@/types/meeting'
import { cn } from '@/lib/utils'

// Brand-accurate hues for the meeting source. Smoke & mirrors — a colored tile + glyph
// reads as Teams/Zoom/Meet without shipping the actual (trademarked) logos.
const VENDOR_BG: Record<MeetingVendor, string> = {
  teams: '#6264A7', // Microsoft Teams purple
  zoom: '#2D8CFF', // Zoom blue
  meet: '#00832D', // Google Meet green
  phone: '#475569', // slate
  in_person: '#0b4f9c', // Zions navy
}

/** Small brand-colored vendor tile. Caller sets the box size via className (e.g. h-4 w-4). */
export function VendorMark({ vendor, className }: { vendor?: MeetingVendor; className?: string }) {
  const v = vendor ?? 'teams'
  const Glyph = v === 'in_person' ? MapPin : v === 'phone' ? Phone : Video
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[4px] text-white', className)}
      style={{ background: VENDOR_BG[v] }}
      aria-hidden
    >
      <Glyph className="h-[60%] w-[60%]" />
    </span>
  )
}
