import { Link } from 'react-router-dom'
import { ChevronRight, Building2, User } from 'lucide-react'
import { AccessoryBar } from '@/components/accessory-bar'
import { PageTitle } from '@/components/page-title'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/servicing/StatusBadge'
import { TEST_CLIENT, TEST_CLIENT_FLOW, type FlowStep } from '@/data/testClientFlow'
import { cn } from '@/lib/utils'

function OwnerBadge({ owner }: { owner: FlowStep['owner'] }) {
  const Icon = owner === 'Client' ? User : Building2
  const className =
    owner === 'Client'
      ? 'bg-fill-category2-tertiary text-text-category2-primary border-border-category2-primary'
      : 'bg-fill-neutral-secondary text-text-secondary border-border-primary'
  return (
    <Badge variant="outline" className={cn('text-xs gap-1', className)}>
      <Icon className="h-3 w-3" />
      {owner}
    </Badge>
  )
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
        <span>Progress</span>
        <span className="font-medium text-text-primary">{clamped}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-fill-neutral-secondary overflow-hidden">
        <div
          className="h-full bg-fill-category1-primary transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

function StepCard({ step }: { step: FlowStep }) {
  const href = `/onboarding/flow/${step.slug}`
  return (
    <Link
      to={href}
      className={cn(
        'group relative rounded-lg border border-border-primary bg-fill-surface p-5',
        'hover:border-border-category1-primary hover:shadow-md transition-all',
        'flex flex-col gap-4',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary leading-tight">
            {step.title}
          </h3>
          <p className="text-sm text-text-secondary mt-1 leading-snug">{step.description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-text-tertiary group-hover:text-text-category1-primary flex-shrink-0" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <OwnerBadge owner={step.owner} />
        <StatusBadge status={step.status} />
        {step.built && (
          <Badge
            variant="outline"
            className="bg-fill-success-tertiary text-text-success-primary border-border-success-primary text-xs"
          >
            Schwab API wired
          </Badge>
        )}
      </div>

      <ProgressBar value={step.progress} />
    </Link>
  )
}

export function TestClientFlowDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <AccessoryBar
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Onboarding', href: '/onboarding' },
        ]}
        currentPage={TEST_CLIENT.name}
        showBackButton={true}
        showBorder={false}
        className="-mt-6 mb-2"
      />

      <div className="flex items-start justify-between mb-6 gap-4">
        <PageTitle
          title={TEST_CLIENT.name}
          subHead={TEST_CLIENT.summary}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEST_CLIENT_FLOW.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
      </div>
    </div>
  )
}
