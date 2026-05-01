import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Link2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getSchwabHealth, getSchwabAuthUrl, type SchwabHealthStatus } from '@/lib/schwabClient'
import { cn } from '@/lib/utils'

function row(label: string, value: React.ReactNode) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-text-secondary">{label}</span>
      <span className="font-mono text-text-primary truncate max-w-[180px] text-right">{value}</span>
    </div>
  )
}

export function SchwabConnectivityPanel({
  onHealthChange,
}: {
  onHealthChange?: (h: SchwabHealthStatus | null) => void
}) {
  const [health, setHealth] = useState<SchwabHealthStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const h = await getSchwabHealth()
      setHealth(h)
      onHealthChange?.(h)
    } finally {
      setLoading(false)
    }
  }, [onHealthChange])

  useEffect(() => {
    void refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  const connect = async () => {
    const url = await getSchwabAuthUrl()
    window.location.href = url
  }

  const proxyUp = health?.proxyUp ?? false
  const configured = health?.configured ?? false
  const tokenPresent = health?.tokenPresent ?? false
  const mode = health?.mode ?? 'mock'

  const state: { icon: typeof CheckCircle2; label: string; tone: string } = !proxyUp
    ? { icon: XCircle, label: 'Proxy offline', tone: 'text-text-danger-primary' }
    : !configured
      ? { icon: AlertCircle, label: 'Credentials missing', tone: 'text-text-warning-primary' }
      : !tokenPresent
        ? { icon: AlertCircle, label: 'Not authorized', tone: 'text-text-warning-primary' }
        : { icon: CheckCircle2, label: 'Ready', tone: 'text-text-success-primary' }

  const Icon = state.icon

  return (
    <div className="rounded-lg border border-border-primary bg-fill-surface p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', state.tone)} />
          <div>
            <div className="text-sm font-semibold text-text-primary">Schwab API</div>
            <div className={cn('text-xs', state.tone)}>{state.label}</div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-xs uppercase',
            mode === 'live'
              ? 'bg-fill-success-tertiary text-text-success-primary border-border-success-primary'
              : 'bg-fill-neutral-secondary text-text-secondary border-border-primary',
          )}
        >
          {mode}
        </Badge>
      </div>

      <div className="space-y-1.5 pt-1 border-t border-border-primary pt-3">
        {row('Proxy', proxyUp ? 'up' : 'down')}
        {row('Client ID / Secret', configured ? 'configured' : 'missing')}
        {row('Access token', tokenPresent ? 'cached' : 'none')}
        {health?.tokenExpiresAt &&
          row(
            'Expires',
            new Date(health.tokenExpiresAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            }),
          )}
        {health?.sandboxBaseUrl && row('Base URL', health.sandboxBaseUrl.replace(/^https?:\/\//, ''))}
        {health?.lastCorrelId && row('Last CorrelId', health.lastCorrelId.slice(0, 8) + '…')}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
        {configured && !tokenPresent && proxyUp && (
          <Button size="sm" onClick={connect}>
            <Link2 className="h-3.5 w-3.5" />
            Connect Schwab
          </Button>
        )}
      </div>

      {!proxyUp && (
        <p className="text-xs text-text-danger-primary bg-fill-danger-tertiary rounded-md p-2">
          Start the proxy: <code className="font-mono">pnpm server</code>
        </p>
      )}
      {proxyUp && !configured && (
        <p className="text-xs text-text-secondary bg-fill-neutral-secondary rounded-md p-2">
          Add <code className="font-mono">SCHWAB_CLIENT_ID</code> and{' '}
          <code className="font-mono">SCHWAB_CLIENT_SECRET</code> to <code className="font-mono">.env</code>, restart the
          proxy, then click Connect.
        </p>
      )}
    </div>
  )
}
