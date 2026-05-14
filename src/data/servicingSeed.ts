import type { Journey, JourneyAction, JourneyCategory, JourneyTask } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'
import { actions, tasks } from './seed'
import { generateAccountOpenIdentifiers } from '@/utils/accountOpenIdentifiers'
import { formatOpenAccountsChildRowLabel } from '@/utils/openAccountsChildRowLabel'

/** Synthetic nested “Open Accounts” branch for the Document Review queue (matches live journey id patterns). */
type HoDemoKycLine = {
  section: 'kyc'
  title: string
  nickname: string
  lineKey: string
  childId: string
  displayStatus: string
}

type HoDemoAccountLine = {
  section: 'accounts'
  title: string
  lineKey: string
  childId: string
  displayStatus: string
}

type HoDemoLine = HoDemoKycLine | HoDemoAccountLine

function buildDocumentReviewDemoJourney(
  id: string,
  name: string,
  relationshipName: string,
  assignedTo: string,
  createdBy: string,
  createdAt: string,
  lines: HoDemoLine[],
): Journey {
  const collectTasks: JourneyTask[] = [
    {
      id: `${id}-related-parties`,
      actionId: `${id}-collect-client-data`,
      journeyId: id,
      title: 'Client Info',
      status: 'complete',
      assignedTo,
      nickname: `${name} - Client Setup`,
    },
    {
      id: `${id}-existing-accounts`,
      actionId: `${id}-collect-client-data`,
      journeyId: id,
      title: 'Existing Accounts',
      status: 'complete',
      assignedTo,
      nickname: `${name} - Client Setup`,
    },
  ]

  const openAccountsTask: JourneyTask = {
    id: `${id}-open-accounts`,
    actionId: `${id}-account-opening`,
    journeyId: id,
    title: 'Open Accounts',
    status: 'awaiting_review',
    assignedTo,
    nickname: `${name} - Open Accounts`,
  }

  const collectAction: JourneyAction = {
    id: `${id}-collect-client-data`,
    journeyId: id,
    title: 'Client Setup',
    nickname: `${name} - Client Setup`,
    status: 'complete',
    tasks: collectTasks,
  }

  const accountOpeningAction: JourneyAction = {
    id: `${id}-account-opening`,
    journeyId: id,
    title: 'Open Accounts',
    nickname: `${name} - Open Accounts`,
    status: 'awaiting_review',
    tasks: [openAccountsTask],
  }

  const kycSectionId = `${id}-kyc-child-actions`
  const acctSectionId = `${id}-account-opening-child`
  const kycLines = lines.filter((l) => l.section === 'kyc')
  const accountLines = lines.filter((l) => l.section === 'accounts')

  const grandkids: JourneyAction[] = []

  for (const l of kycLines) {
    const actionId = `${id}-account-opening-${l.lineKey}`
    grandkids.push({
      id: actionId,
      journeyId: id,
      title: l.title,
      nickname: l.nickname,
      status: 'awaiting_review',
      displayStatus: l.displayStatus,
      parentActionId: kycSectionId,
      childId: l.childId,
      tasks: [
        {
          id: `${actionId}-doc`,
          actionId,
          journeyId: id,
          title: 'Supporting documents',
          status: 'awaiting_review',
          assignedTo,
          nickname: l.nickname,
        },
      ],
    })
  }

  for (const l of accountLines) {
    const actionId = `${id}-account-opening-${l.lineKey}`
    const { accountNumber } = generateAccountOpenIdentifiers(l.title, l.childId)
    const workflowListLabel = formatOpenAccountsChildRowLabel(l.title, { accountNumber })
    grandkids.push({
      id: actionId,
      journeyId: id,
      title: l.title,
      nickname: workflowListLabel,
      status: 'awaiting_review',
      displayStatus: l.displayStatus,
      parentActionId: acctSectionId,
      childId: l.childId,
      tasks: [
        {
          id: `${actionId}-acct`,
          actionId,
          journeyId: id,
          title: 'Account setup',
          status: 'awaiting_review',
          assignedTo,
          nickname: workflowListLabel,
        },
      ],
    })
  }

  const sectionActions: JourneyAction[] = []
  if (kycLines.length > 0) {
    sectionActions.push({
      id: kycSectionId,
      journeyId: id,
      title: 'KYC Reviews',
      nickname: `${name} - KYC Reviews`,
      status: 'in_progress',
      parentActionId: `${id}-account-opening`,
      tasks: [],
    })
  }
  if (accountLines.length > 0) {
    sectionActions.push({
      id: acctSectionId,
      journeyId: id,
      title: 'Accounts',
      nickname: `${name} - Accounts`,
      status: 'in_progress',
      parentActionId: `${id}-account-opening`,
      tasks: [],
    })
  }

  return {
    id,
    name,
    category: 'Onboarding',
    relationshipName,
    assignedTo,
    createdBy,
    createdAt,
    status: 'in_progress',
    actions: [collectAction, accountOpeningAction, ...sectionActions, ...grandkids],
  }
}

function buildJourney(
  id: string,
  name: string,
  category: JourneyCategory,
  relationshipName: string,
  assignedTo: string,
  createdBy: string,
  createdAt: string,
  taskStatuses: Record<string, TaskStatus>,
): Journey {
  const journeyActions = actions.map((action) => {
    const actionTasks = tasks
      .filter((t) => t.actionId === action.id)
      .map((t) => ({
        id: `${id}-${t.id}`,
        actionId: `${id}-${action.id}`,
        journeyId: id,
        title: t.title,
        status: taskStatuses[t.id] ?? 'not_started' as TaskStatus,
        assignedTo,
        nickname: `${name} - ${action.title}`,
      }))

    const allComplete = actionTasks.every((t) => t.status === 'complete')
    const anyBlocked = actionTasks.some((t) => t.status === 'blocked')
    const anyAwaitingReview = actionTasks.some((t) => t.status === 'awaiting_review')
    const anyStarted = actionTasks.some(
      (t) =>
        t.status === 'in_progress' ||
        t.status === 'complete' ||
        t.status === 'awaiting_review',
    )

    // Set parent action for certain actions to create nesting
    // Both KYC Cases and Accounts are nested under "Account Opening"
    let parentActionId: string | undefined
    if (action.id === 'kyc-child-actions') {
      parentActionId = `${id}-account-opening`
    } else if (action.id === 'account-opening-child') {
      parentActionId = `${id}-account-opening`
    }

    return {
      id: `${id}-${action.id}`,
      journeyId: id,
      title: action.title,
      nickname: `${name} - ${action.title}`,
      status: allComplete
        ? ('complete' as const)
        : anyAwaitingReview
          ? ('awaiting_review' as const)
          : anyBlocked
            ? ('in_progress' as const)
            : anyStarted
              ? ('in_progress' as const)
              : ('not_started' as const),
      tasks: actionTasks,
      parentActionId,
    }
  })

  const allActionsComplete = journeyActions.every((a) => a.status === 'complete')
  const anyActionStarted = journeyActions.some((a) => a.status !== 'not_started')

  return {
    id,
    name,
    category,
    relationshipName,
    assignedTo,
    createdBy,
    createdAt,
    status: allActionsComplete
      ? 'complete'
      : anyActionStarted
        ? 'in_progress'
        : 'not_started',
    actions: journeyActions,
  }
}

export const seededJourneys: Journey[] = [
  // Onboarding journeys
  buildJourney('journey-johnson', 'Johnson Trust Onboarding', 'Onboarding', 'Johnson Trust', 'Bob Martinez', 'Alice Chen', '2026-03-05', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'blocked',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-davis', 'Davis Household Onboarding', 'Onboarding', 'Davis Household', 'Carol Williams', 'Bob Martinez', '2026-03-20', {
    'existing-accounts': 'in_progress',
    'related-parties': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-garcia', 'Garcia Family Onboarding', 'Onboarding', 'The Garcia Family', 'Diana Torres', 'Carol Williams', '2026-03-28', {
    'existing-accounts': 'complete',
    'related-parties': 'in_progress',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-patel-onboarding', 'Patel Family Onboarding', 'Onboarding', 'Anita Patel', 'Alice Chen', 'Alice Chen', '2026-03-01', {
    'existing-accounts': 'complete',
    'related-parties': 'in_progress',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-kim-onboarding', 'Kim Household Onboarding', 'Onboarding', 'Daniel Kim', 'Bob Martinez', 'Diana Torres', '2026-03-15', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'in_progress',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-thompson-onboarding', 'Thompson Family Onboarding', 'Onboarding', 'Laura Thompson', 'Carol Williams', 'Edward Kim', '2026-02-28', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'complete',
    /** Submitted for Home Office review — surfaces on the “Document Review” actions tab. */
    'open-accounts': 'awaiting_review',
  }),
  buildJourney('journey-nakamura-onboarding', 'Nakamura Client Onboarding', 'Onboarding', 'Kenji Nakamura', 'Diana Torres', 'Alice Chen', '2026-03-10', {
    'existing-accounts': 'in_progress',
    'related-parties': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-oconnor-onboarding', "O'Connor Estate Onboarding", 'Onboarding', "Bridget O'Connor", 'Alice Chen', 'Bob Martinez', '2026-01-15', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'complete',
    'open-accounts': 'in_progress',
  }),
  buildJourney('journey-brooks-onboarding', 'Brooks Family Onboarding', 'Onboarding', 'Hannah Brooks', 'Bob Martinez', 'Carol Williams', '2026-03-22', {
    'existing-accounts': 'in_progress',
    'related-parties': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
  }),

  // Document Review queue demos — nested child workflows (KYC / Accounts) in reviewer pipeline
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-rivera',
    'Rivera / Kim household onboarding',
    'Rivera / Kim household',
    'Alice Chen',
    'Carol Williams',
    '2026-04-02',
    [
      {
        section: 'kyc',
        title: 'Sofia Rivera — KYC',
        nickname: 'Rivera / Kim — Sofia Rivera KYC',
        lineKey: 'line-rivera-kyc',
        childId: 'ho-demo-child-rivera-kyc',
        displayStatus: 'document_review',
      },
      {
        section: 'accounts',
        title: 'Joint brokerage — Rivera / Kim',
        lineKey: 'line-rivera-joint',
        childId: 'ho-demo-child-rivera-joint',
        displayStatus: 'aml_review',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-okonkwo',
    'Okonkwo Family Trust onboarding',
    'Okonkwo Family Trust',
    'Bob Martinez',
    'Alice Chen',
    '2026-04-04',
    [
      {
        section: 'kyc',
        title: 'Chidi Okonkwo — trust KYC',
        nickname: 'Okonkwo Trust — Chidi Okonkwo KYC',
        lineKey: 'line-okonkwo-chidi',
        childId: 'ho-demo-child-okonkwo-chidi',
        displayStatus: 'ho_kyc_review',
      },
      {
        section: 'kyc',
        title: 'Ifeoma Okonkwo — trust KYC',
        nickname: 'Okonkwo Trust — Ifeoma Okonkwo KYC',
        lineKey: 'line-okonkwo-ifeoma',
        childId: 'ho-demo-child-okonkwo-ifeoma',
        displayStatus: 'principal_review',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-falk',
    'Falk succession onboarding',
    'Falk Business Succession LLC',
    'Diana Torres',
    'Edward Kim',
    '2026-04-06',
    [
      {
        section: 'accounts',
        title: 'Rollover IRA',
        lineKey: 'line-falk-ira',
        childId: 'ho-demo-child-falk-ira',
        displayStatus: 'awaiting_review',
      },
      {
        section: 'accounts',
        title: 'Operating cash',
        lineKey: 'line-falk-cash',
        childId: 'ho-demo-child-falk-cash',
        displayStatus: 'nigo_document',
      },
    ],
  ),

  // Account Transfer journeys
  buildJourney('journey-patel', 'Patel IRA Transfer', 'Account Transfer', 'Raj Patel', 'Alice Chen', 'Alice Chen', '2026-03-01', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-chen', 'Chen 401k Rollover', 'Account Transfer', 'Wei Chen', 'Bob Martinez', 'Diana Torres', '2026-03-15', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'complete',
    'open-accounts': 'in_progress',
  }),

  // Investment Review journeys
  buildJourney('journey-williams', 'Williams Portfolio Review', 'Investment Review', 'Williams Family Trust', 'Carol Williams', 'Edward Kim', '2026-02-28', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'complete',
    'open-accounts': 'complete',
  }),
  buildJourney('journey-thompson', 'Thompson Asset Rebalance', 'Investment Review', 'Mark Thompson', 'Diana Torres', 'Alice Chen', '2026-03-10', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
  }),

  // Tax Planning journeys
  buildJourney('journey-lee', 'Lee Tax Optimization', 'Tax Planning', 'Dr. Sandra Lee', 'Alice Chen', 'Bob Martinez', '2026-01-15', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'complete',
    'open-accounts': 'in_progress',
  }),

  // Consolidation journeys
  buildJourney('journey-brown', 'Brown Account Consolidation', 'Consolidation', 'The Brown Family', 'Bob Martinez', 'Carol Williams', '2026-03-22', {
    'existing-accounts': 'complete',
    'related-parties': 'in_progress',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-nguyen', 'Nguyen Multi-Custodian Consolidation', 'Consolidation', 'Nguyen Trust', 'Diana Torres', 'Edward Kim', '2026-03-25', {
    'existing-accounts': 'in_progress',
    'related-parties': 'not_started',
    'kyc-review': 'not_started',
    'open-accounts': 'not_started',
  }),

  // Estate Planning journeys
  buildJourney('journey-anderson', 'Anderson Estate Plan', 'Estate Planning', 'The Anderson Family', 'Carol Williams', 'Alice Chen', '2026-02-20', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'in_progress',
    'open-accounts': 'not_started',
  }),
]
