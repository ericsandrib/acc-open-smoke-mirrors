import type { ComponentType } from 'react'
import { ApplicationWidgetTestPage } from './ApplicationWidgetTestPage'

/**
 * Sandbox entries surfaced in the `/test` sidebar.
 *
 * Add a new entry here to grow the sandbox — the sidebar and route resolver in
 * `TestSandboxPage` both read from this array. No per-route wiring needed.
 */
export type TestEntry = {
  slug: string
  title: string
  description?: string
  Component: ComponentType
}

export const TESTS: TestEntry[] = [
  {
    slug: 'application-widget',
    title: 'Application Status widget',
    description:
      'Every state the Application Status widget (right-side panel on a child action page) can render.',
    Component: ApplicationWidgetTestPage,
  },
]
