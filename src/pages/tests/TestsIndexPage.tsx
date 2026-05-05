import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'

type TestEntry = {
  slug: string
  title: string
  description: string
}

const TESTS: TestEntry[] = [
  {
    slug: 'progress-indicator',
    title: 'Progress indicator',
    description:
      'Pizza-tracker icon variants used in the wizard StepSidebar. Verify each discrete state and the pickVariant runtime mapping.',
  },
]

export function TestsIndexPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Component tests
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Visual test sheets for components as we build them. Pick a sub-page
            below.
          </p>
        </header>

        <ul className="grid gap-3">
          {TESTS.map((t) => (
            <li key={t.slug}>
              <Link
                to={`/tests/${t.slug}`}
                className="block rounded-lg border border-border bg-[var(--bg-secondary)]/40 px-4 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-secondary)]/70"
              >
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {t.title}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {t.description}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}
