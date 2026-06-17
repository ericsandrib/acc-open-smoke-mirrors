import { Settings2, ListChecks } from 'lucide-react'
import { useConfigOverlay } from './ConfigOverlayProvider'
import { cn } from '@/lib/utils'

/**
 * Floating control bar — top-right corner.
 *
 *   [ Config Overlay  ON / OFF ]   [ Captured (3) ]
 *
 * The toggle controls whether hotspots are visible across the app. The
 * "Captured" pill opens the side panel listing every knob the team has
 * pinned during the live review.
 *
 * Was originally bottom-right but moved up so it doesn't sit over the
 * page's primary call-to-action button (`Create` etc.) in the lower-left
 * sidebar area.
 */
export function ConfigOverlayToggle() {
  const { enabled, toggle, captured, capturePanelOpen, setCapturePanelOpen } =
    useConfigOverlay()
  const count = Object.keys(captured).length

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
      <button
        onClick={toggle}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg transition-colors',
          enabled
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : 'bg-foreground text-background hover:opacity-90',
        )}
        title="Toggle configuration overlay (Shift+?)"
      >
        <Settings2 className="h-4 w-4" />
        Config overlay
        <span
          className={cn(
            'ml-0.5 inline-flex h-5 items-center rounded-full px-1.5 text-[10px] font-bold uppercase tracking-wide',
            enabled ? 'bg-white/25 text-white' : 'bg-background/20 text-background',
          )}
        >
          {enabled ? 'on' : 'off'}
        </span>
      </button>

      <button
        onClick={() => setCapturePanelOpen(!capturePanelOpen)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full bg-white border border-border px-3.5 py-2 text-xs font-semibold text-foreground shadow-lg hover:bg-muted/50',
          capturePanelOpen && 'ring-2 ring-foreground/20',
        )}
        title="Open capture panel"
      >
        <ListChecks className="h-4 w-4" />
        Captured
        <span
          className={cn(
            'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
            count > 0 ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      </button>
    </div>
  )
}
