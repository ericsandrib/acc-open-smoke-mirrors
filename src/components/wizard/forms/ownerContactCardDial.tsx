import { createContext, useContext, type ReactNode } from 'react'

export const ownerContactCardDialDefaults = {
  cardPadding: 20,
  titleCardGap: 8,
  headerBodyGap: 12,
  avatarSize: 48,
  headerGap: 8,
  bodyIndent: 8,
  bodyRowGap: 4,
  cardRadius: 12,
  layoutVersion: 'v2',
  kycStatusVersion: 'v2',
} as const

export type OwnerContactCardDialValues = {
  cardPadding: number
  titleCardGap: number
  headerBodyGap: number
  avatarSize: number
  headerGap: number
  bodyIndent: number
  bodyRowGap: number
  cardRadius: number
  layoutVersion: 'v1' | 'v2'
  kycStatusVersion: 'v1' | 'v2'
}

const OwnerContactCardDialContext =
  createContext<OwnerContactCardDialValues>(ownerContactCardDialDefaults)

/**
 * Previously wrapped children in a DialKit-powered provider so designers could
 * tune the contact card live. The dials have been removed in favor of fixed
 * defaults — this stays as a passthrough so existing call sites keep working
 * and we can reintroduce live tuning later without touching consumers.
 */
export function OwnerContactCardDialRoot({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useOwnerContactCardDial() {
  return useContext(OwnerContactCardDialContext)
}
