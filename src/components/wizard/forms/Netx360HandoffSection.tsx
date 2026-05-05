import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NETX360_DEEPLINK = 'https://xat-www2.netx360.inautix.com/plus/servicing/account-service/client-onboarding'

/** Handoff copy for annuity account opening: remaining work continues in NetX360 (parent task). */
export function Netx360HandoffSection() {
  return (
    <a href={NETX360_DEEPLINK} target="_blank" rel="noreferrer" className="inline-block">
      <Button type="button" className="gap-1.5">
        Continue in NetX360
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>
    </a>
  )
}
