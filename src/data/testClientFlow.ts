// Canonical 5-step onboarding flow for the demo test client.
// Spec: Stratos onboarding dashboard — one client, five action cards.

export type FlowStepOwner = 'Client' | 'Internal'

export interface FlowStep {
  id: string
  slug: string
  title: string
  description: string
  owner: FlowStepOwner
  progress: number // 0..100
  status: 'not_started' | 'in_progress' | 'complete'
  built: boolean // true once the real UI exists for this step
}

export const TEST_CLIENT = {
  id: 'test-client-001',
  name: 'Lang, Chris M.',
  summary: 'Demo client used to smoke-test the account opening flow against the Schwab API.',
}

export const TEST_CLIENT_FLOW: FlowStep[] = [
  {
    id: 'collect-client-data',
    slug: 'collect-client-data',
    title: 'Collect Client Data',
    description: 'Collect data from prospect',
    owner: 'Client',
    progress: 0,
    status: 'in_progress',
    built: false,
  },
  {
    id: 'financial-plan',
    slug: 'financial-plan',
    title: 'Financial Plan',
    description: 'Create a Financial Plan and Protection Illustrations',
    owner: 'Internal',
    progress: 0,
    status: 'in_progress',
    built: false,
  },
  {
    id: 'kyc',
    slug: 'kyc',
    title: 'KYC - Know Your Customer',
    description: 'KYC - Know Your Customer',
    owner: 'Internal',
    progress: 0,
    status: 'in_progress',
    built: false,
  },
  {
    id: 'account-opening-funding',
    slug: 'account-opening-funding',
    title: 'Account Opening and Funding',
    description: 'Account Opening and Funding',
    owner: 'Internal',
    progress: 0,
    status: 'in_progress',
    built: true,
  },
  {
    id: 'protection-policy',
    slug: 'protection-policy',
    title: 'New Protection Policy',
    description: 'Obtain protection coverage',
    owner: 'Internal',
    progress: 50,
    status: 'in_progress',
    built: false,
  },
]
