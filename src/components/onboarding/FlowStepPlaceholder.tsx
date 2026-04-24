import { Link, useParams, Navigate } from 'react-router-dom'
import { Construction, ArrowLeft } from 'lucide-react'
import { AccessoryBar } from '@/components/accessory-bar'
import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TEST_CLIENT, TEST_CLIENT_FLOW } from '@/data/testClientFlow'

export function FlowStepPlaceholder() {
  const { stepSlug } = useParams<{ stepSlug: string }>()
  const step = TEST_CLIENT_FLOW.find((s) => s.slug === stepSlug)

  if (!step) {
    return <Navigate to="/onboarding/flow" replace />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AccessoryBar
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Onboarding', href: '/onboarding' },
          { label: TEST_CLIENT.name, href: '/onboarding/flow' },
        ]}
        currentPage={step.title}
        showBackButton={true}
        showBorder={false}
        className="-mt-6 mb-2"
      />

      <PageTitle title={step.title} subHead={step.description} />

      <div className="mt-6 rounded-lg border border-dashed border-border-primary bg-fill-surface p-10 text-center">
        <Construction className="h-10 w-10 mx-auto text-text-tertiary" />
        <h2 className="text-base font-semibold text-text-primary mt-3">
          This step isn't built yet
        </h2>
        <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">
          Only <span className="font-medium">Account Opening and Funding</span> is wired to the
          Schwab sandbox API for this demo. The other steps are stubs so the dashboard view is
          complete.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant="outline" className="text-xs">
            Owner: {step.owner}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Progress: {step.progress}%
          </Badge>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/onboarding/flow">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to dashboard
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/onboarding/flow/account-opening-funding">Jump to Account Opening</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
