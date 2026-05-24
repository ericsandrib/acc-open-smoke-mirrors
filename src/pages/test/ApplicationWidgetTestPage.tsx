/**
 * Test sandbox page for the Application Status widget.
 * Filled out in Phase 4 (Spec 006) — for now a scaffold with the title only.
 */
export function ApplicationWidgetTestPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Application Status widget
        </h1>
        <p className="text-sm text-muted-foreground">
          All states the widget can take, in both terminal and active variants.
          Populated in Phase 4.
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        Coming soon — state grid is populated in Phase 4.
      </div>
    </div>
  )
}
