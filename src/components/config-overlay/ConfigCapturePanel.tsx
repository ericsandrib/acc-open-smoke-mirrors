import { useMemo } from 'react'
import { X, Trash2, Copy, Download } from 'lucide-react'
import { useConfigOverlay } from './ConfigOverlayProvider'
import { getKnob, type ConfigScope } from '@/data/configKnobs'
import { cn } from '@/lib/utils'

/**
 * Side drawer that lists every knob the team has captured during the live
 * review, with a free-text note slot per item and an export button.
 *
 * Export targets:
 *   • Copy — plain markdown to clipboard for pasting into Slack / a ticket
 *   • Download — a .md file
 */
export function ConfigCapturePanel() {
  const {
    capturePanelOpen,
    setCapturePanelOpen,
    captured,
    uncapture,
    updateCapture,
    clearAll,
  } = useConfigOverlay()

  const items = useMemo(() => {
    return Object.values(captured)
      .map((c) => ({ capture: c, knob: getKnob(c.id) }))
      .filter((x): x is { capture: typeof x.capture; knob: NonNullable<typeof x.knob> } => !!x.knob)
      .sort((a, b) => a.capture.capturedAt.localeCompare(b.capture.capturedAt))
  }, [captured])

  if (!capturePanelOpen) return null

  function exportMarkdown(): string {
    if (items.length === 0) return ''
    const lines: string[] = []
    lines.push('# Stratos × Avantos — Live config review')
    lines.push('')
    lines.push(`_Captured ${items.length} configuration item(s) on ${new Date().toLocaleString()}_`)
    lines.push('')

    const byScope: Record<ConfigScope, typeof items> = {
      direction: [],
      page: [],
      section: [],
      knob: [],
    }
    items.forEach((it) => byScope[it.knob.scope].push(it))

    const order: ConfigScope[] = ['direction', 'page', 'section', 'knob']
    for (const scope of order) {
      const group = byScope[scope]
      if (group.length === 0) continue
      lines.push(`## ${scope.charAt(0).toUpperCase() + scope.slice(1)} decisions`)
      lines.push('')
      for (const { knob, capture } of group) {
        lines.push(`### ${knob.title}`)
        lines.push('')
        lines.push(`- **Slug:** \`${knob.id}\``)
        lines.push(`- **Who configures:** ${knob.who}`)
        lines.push(`- **Question:** ${knob.question}`)
        if (capture.selectedOption) {
          lines.push(`- **Selection:** ${capture.selectedOption}`)
        }
        if (capture.note?.trim()) {
          lines.push(`- **Notes:** ${capture.note.trim()}`)
        }
        if (knob.recommendedDefault) {
          lines.push(`- **Recommended starting point:** ${knob.recommendedDefault}`)
        }
        if (knob.configLocation) {
          lines.push(`- **Config location:** \`${knob.configLocation}\``)
        }
        if (knob.referenceUrl) {
          lines.push(`- **Reference:** ${knob.referenceUrl}`)
        }
        lines.push('')
      }
    }
    return lines.join('\n')
  }

  function copyToClipboard() {
    const md = exportMarkdown()
    if (!md) return
    navigator.clipboard
      .writeText(md)
      .then(() => {
        // Lightweight visual feedback — flash a toast-ish message via alert
        // free of dependency. Replace with sonner toast if desired.
        // eslint-disable-next-line no-alert
        alert(`Copied ${items.length} item(s) to clipboard as markdown.`)
      })
      .catch(() => {
        // eslint-disable-next-line no-alert
        alert('Copy failed — try the download button instead.')
      })
  }

  function downloadMarkdown() {
    const md = exportMarkdown()
    if (!md) return
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    a.download = `stratos-config-review-${ts}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <aside className="fixed right-0 top-0 h-screen w-[420px] z-40 bg-white border-l border-border shadow-2xl flex flex-col print:hidden">
      <header className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Captured config items</h2>
          <p className="text-xs text-muted-foreground">
            {items.length === 0
              ? 'Nothing captured yet — click any callout in the prototype.'
              : `${items.length} item${items.length === 1 ? '' : 's'} pinned for follow-up`}
          </p>
        </div>
        <button
          onClick={() => setCapturePanelOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        {items.length === 0 && (
          <div className="text-xs text-muted-foreground py-12 text-center">
            Toggle the config overlay on and click any callout to capture it.
          </div>
        )}

        {items.map(({ capture, knob }) => {
          const scopeColor =
            knob.scope === 'direction'
              ? 'border-purple-300 bg-purple-50/40'
              : knob.scope === 'page'
              ? 'border-rose-300 bg-rose-50/40'
              : knob.scope === 'section'
              ? 'border-amber-300 bg-amber-50/40'
              : 'border-sky-300 bg-sky-50/40'

          return (
            <div
              key={capture.id}
              className={cn(
                'rounded-lg border-2 px-3.5 py-3 space-y-2',
                scopeColor,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {knob.scope}
                  </p>
                  <h3 className="text-sm font-semibold text-foreground leading-tight">
                    {knob.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 italic line-clamp-2">
                    {knob.question}
                  </p>
                </div>
                <button
                  onClick={() => uncapture(capture.id)}
                  className="text-muted-foreground hover:text-rose-600 -mr-1 -mt-1"
                  aria-label="Remove"
                  title="Remove from capture"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {capture.selectedOption && (
                <div className="rounded bg-emerald-50 border border-emerald-200 px-2 py-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 mb-0.5">
                    Picked
                  </p>
                  <p className="text-xs text-emerald-900">
                    {capture.selectedOption}
                  </p>
                </div>
              )}

              <textarea
                value={capture.note}
                onChange={(e) => updateCapture(capture.id, { note: e.target.value })}
                placeholder="Live notes — capture what was decided"
                rows={2}
                className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10"
              />
            </div>
          )
        })}
      </div>

      <footer className="px-5 py-3 border-t border-border flex items-center gap-2 bg-muted/30">
        <button
          onClick={copyToClipboard}
          disabled={items.length === 0}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          <Copy className="h-3.5 w-3.5" /> Copy as markdown
        </button>
        <button
          onClick={downloadMarkdown}
          disabled={items.length === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 disabled:opacity-40"
          title="Download .md"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all captured items? Notes will be lost.')) {
                clearAll()
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            title="Clear all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </footer>
    </aside>
  )
}
