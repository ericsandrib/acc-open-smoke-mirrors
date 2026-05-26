import { Link, Navigate, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TESTS } from './tests'

/**
 * Developer-facing component sandbox at `/test`.
 *
 * Persistent left sidebar lists entries from `TESTS`; the main pane renders the
 * active entry's component. Intentionally minimal chrome — no AppShell, no
 * production nav. A tiny "back to app" link keeps it reachable for navigation.
 */
export function TestSandboxPage() {
  const { slug } = useParams<{ slug?: string }>()
  const fallbackSlug = TESTS[0]?.slug

  if (!slug && fallbackSlug) {
    return <Navigate to={`/test/${fallbackSlug}`} replace />
  }

  const active = TESTS.find((t) => t.slug === slug)

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-muted/30">
        <div className="border-b border-border px-3 py-3">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to app
          </Link>
          <h2 className="mt-2 text-sm font-semibold text-foreground">
            Sandbox
          </h2>
          <p className="text-[11px] text-muted-foreground">Component inspector</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {TESTS.map((t) => {
              const isActive = t.slug === slug
              return (
                <li key={t.slug}>
                  <Link
                    to={`/test/${t.slug}`}
                    className={cn(
                      'block rounded-md px-2.5 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-foreground/10 font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {t.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {active ? (
          <active.Component />
        ) : (
          <div className="mx-auto max-w-xl rounded-md border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Unknown sandbox entry <code>{slug}</code>. Pick a component from the
            sidebar.
          </div>
        )}
      </main>
    </div>
  )
}
