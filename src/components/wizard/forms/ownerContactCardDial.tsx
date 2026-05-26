import { createContext, useContext, type ReactNode } from 'react'
import { useDialKit } from 'dialkit'

export const ownerContactCardDialDefaults = {
  cardPadding: 20,
  titleCardGap: 8,
  headerBodyGap: 12,
  avatarSize: 48,
  headerGap: 8,
  bodyIndent: 8,
  bodyRowGap: 12,
  cardRadius: 12,
  layoutVersion: 'v2',
  kycStatusVersion: 'v1',
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

function OwnerContactCardDialProvider({ children }: { children: ReactNode }) {
  const dial = useDialKit('Owner contact card', {
    cardPadding: [20, 0, 40],
    titleCardGap: [8, 0, 24],
    headerBodyGap: [12, 0, 32],
    avatarSize: [48, 32, 64],
    headerGap: [8, 0, 24],
    bodyIndent: [8, 0, 32],
    bodyRowGap: [12, 0, 24],
    cardRadius: [12, 0, 24],
    layoutVersion: {
      type: 'select',
      options: [
        { value: 'v1', label: 'Version 1 — stacked fields' },
        { value: 'v2', label: 'Version 2 — horizontal fields' },
      ],
      default: 'v2',
    },
    kycStatusVersion: {
      type: 'select',
      options: [
        { value: 'v1', label: 'Version 1 — pill badge' },
        { value: 'v2', label: 'Version 2 — alert banner' },
      ],
      default: 'v1',
    },
  })

  return (
    <OwnerContactCardDialContext.Provider
      value={{
        ...dial,
        layoutVersion: dial.layoutVersion === 'v2' ? 'v2' : 'v1',
        kycStatusVersion: dial.kycStatusVersion === 'v2' ? 'v2' : 'v1',
      }}
    >
      {children}
    </OwnerContactCardDialContext.Provider>
  )
}

export function OwnerContactCardDialRoot({ children }: { children: ReactNode }) {
  if (!import.meta.env.DEV) {
    return children
  }

  return <OwnerContactCardDialProvider>{children}</OwnerContactCardDialProvider>
}

export function useOwnerContactCardDial() {
  return useContext(OwnerContactCardDialContext)
}
