import { Children, type ReactNode } from 'react'

export function VerificationSubjectList({
  children,
  emptyMessage,
}: {
  children: ReactNode
  emptyMessage?: string
}) {
  const isEmpty = Children.count(children) === 0

  return (
    <div className="rounded-lg border border-border p-1">
      <div>
        {isEmpty ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">{emptyMessage ?? 'No subjects.'}</p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
