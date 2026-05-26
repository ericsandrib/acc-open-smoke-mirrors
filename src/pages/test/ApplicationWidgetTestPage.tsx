import { ApplicationStatusWidget } from '@/components/wizard/ApplicationStatusWidget'
import {
  getStageLabelSemantic,
  isTerminalStageLabel,
} from '@/utils/statusSemanticColors'

/**
 * Every stage label the Application Status widget can render, grouped by
 * semantic bucket. Keep this in sync with the timeline-step `label`s in
 * `ChildActionTimelineSheet`.
 */
const STAGES: string[] = [
  // success — terminal
  'Pending Release',
  'Complete',
  // warning — active
  'Clarification / Document Required',
  'Escalation / Hold',
  // danger — terminal
  'Rejected',
  // neutral — active (in-flight)
  'Draft',
  'ID Verification',
  'Client Signature',
  'Submitted',
  'Awaiting Review',
  'AML Review',
  'Document Review',
  'Principal Review',
  // neutral — terminal (intentionally ended)
  'Canceled',
]

export function ApplicationWidgetTestPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Application Status widget
        </h1>
        <p className="text-sm text-muted-foreground">
          Every stage label the widget can render, each shown in its natural
          treatment. Terminal stages render filled / reversed; active stages
          render tinted / colored.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <div>Stage</div>
          <div>Widget</div>
        </div>
        <ul className="divide-y divide-border">
          {STAGES.map((stage) => {
            const semantic = getStageLabelSemantic(stage)
            const treatment: 'terminal' | 'active' = isTerminalStageLabel(stage)
              ? 'terminal'
              : 'active'
            return (
              <li
                key={stage}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {stage}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {semantic} · {treatment}
                  </div>
                </div>
                <div className="min-w-0">
                  <ApplicationStatusWidget stageLabel={stage} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <section className="space-y-2 text-sm text-muted-foreground">
        <h2 className="text-sm font-semibold text-foreground">Treatments</h2>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong className="text-foreground">Terminal</strong> — solid
            filled box, reversed icon. The workflow has come to rest at this
            stage: Pending Release, Complete, Rejected, Canceled.
          </li>
          <li>
            <strong className="text-foreground">Active</strong> — faded tinted
            box, colored icon. Everything in-flight or pre-flight.
          </li>
        </ul>
      </section>
    </div>
  )
}
