import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NETX360_DEEPLINK = 'https://xat-www2.netx360.inautix.com/plus/servicing/account-service/client-onboarding'

/** Annuity account-opening handoff step: complete remaining work in NetX360. */
export function AcctChildNetx360NextStepsForm() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Complete this workflow in NetX360
        </h3>
        <p className="text-sm text-muted-foreground">
          Account and owner setup is complete in this app. Continue the account opening workflow in{' '}
          <span className="font-medium text-foreground">NetX360</span> to finish:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
          <li>Annuity</li>
          <li>Funding &amp; asset movement</li>
          <li>Account features &amp; services</li>
          <li>Documents &amp; eSign</li>
          <li>KYC &amp; final submission</li>
        </ul>
        <a href={NETX360_DEEPLINK} target="_blank" rel="noreferrer">
          <Button type="button" className="gap-1.5">
            Open NetX360 workflow
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      </section>
    </div>
  )
}
