import { Clock } from 'lucide-react'

export function KycChildResultsForm() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-12 text-center">
      <Clock className="mb-4 h-10 w-10 text-muted-foreground/50" />
      <h3 className="text-base font-semibold text-foreground">KYC Results Pending</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Results will appear here once the compliance review is complete. This process is handled
        asynchronously by the compliance team.
      </p>
    </div>
  )
}
