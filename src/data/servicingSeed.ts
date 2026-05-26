import type { Journey, JourneyAction, JourneyCategory, JourneyStatus, JourneyTask } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'

function hoDemoLineTaskStatus(status: JourneyStatus): TaskStatus {
  if (status === 'cancelled') return 'canceled'
  return status
}
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
  /** Defaults to `awaiting_review`; use `complete` for Completed tab demos. */
  status?: Journey['status']
}

type HoDemoAccountLine = {
  section: 'accounts'
  title: string
  lineKey: string
  childId: string
  displayStatus: string
  status?: Journey['status']
}

type HoDemoLine = HoDemoKycLine | HoDemoAccountLine

type HoDemoJourneyOpts = {
  journeyStatus?: Journey['status']
  clientSetupTaskStatus?: TaskStatus
  openAccountsTaskStatus?: TaskStatus
}

function buildDocumentReviewDemoJourney(
  id: string,
  name: string,
  relationshipName: string,
  assignedTo: string,
  createdBy: string,
  createdAt: string,
  lines: HoDemoLine[],
  opts?: HoDemoJourneyOpts,
): Journey {
  const clientSetupTaskStatus = opts?.clientSetupTaskStatus ?? 'complete'
  const openAccountsTaskStatus = opts?.openAccountsTaskStatus ?? 'awaiting_review'

  const collectTasks: JourneyTask[] = [
    {
      id: `${id}-related-parties`,
      actionId: `${id}-collect-client-data`,
      journeyId: id,
      title: 'Client Info',
      status: clientSetupTaskStatus,
      assignedTo,
      nickname: `${name} - Client Setup`,
    },
    {
      id: `${id}-existing-accounts`,
      actionId: `${id}-collect-client-data`,
      journeyId: id,
      title: 'Existing Accounts',
      status: clientSetupTaskStatus,
      assignedTo,
      nickname: `${name} - Client Setup`,
    },
  ]

  const collectAllComplete = collectTasks.every((t) => t.status === 'complete')
  const collectAnyStarted = collectTasks.some((t) => t.status !== 'not_started')

  const openAccountsTask: JourneyTask = {
    id: `${id}-open-accounts`,
    actionId: `${id}-account-opening`,
    journeyId: id,
    title: 'Open Accounts',
    status: openAccountsTaskStatus,
    assignedTo,
    nickname: `${name} - Open Accounts`,
  }

  const collectAction: JourneyAction = {
    id: `${id}-collect-client-data`,
    journeyId: id,
    title: 'Client Setup',
    nickname: `${name} - Client Setup`,
    status: collectAllComplete
      ? 'complete'
      : collectAnyStarted
        ? 'in_progress'
        : 'not_started',
    tasks: collectTasks,
  }

  const accountOpeningAction: JourneyAction = {
    id: `${id}-account-opening`,
    journeyId: id,
    title: 'Open Accounts',
    nickname: `${name} - Open Accounts`,
    status:
      openAccountsTaskStatus === 'complete'
        ? 'complete'
        : openAccountsTaskStatus === 'not_started'
          ? 'not_started'
          : openAccountsTaskStatus === 'awaiting_review'
            ? 'awaiting_review'
            : 'in_progress',
    tasks: [openAccountsTask],
  }

  const kycSectionId = `${id}-kyc-child-actions`
  const acctSectionId = `${id}-account-opening-child`
  const kycLines = lines.filter((l) => l.section === 'kyc')
  const accountLines = lines.filter((l) => l.section === 'accounts')

  const grandkids: JourneyAction[] = []

  for (const l of kycLines) {
    const actionId = `${id}-account-opening-${l.lineKey}`
    const lineStatus = l.status ?? 'awaiting_review'
    const taskStatus = hoDemoLineTaskStatus(lineStatus)
    grandkids.push({
      id: actionId,
      journeyId: id,
      title: l.title,
      nickname: l.nickname,
      status: lineStatus,
      displayStatus: l.displayStatus,
      parentActionId: kycSectionId,
      childId: l.childId,
      tasks: [
        {
          id: `${actionId}-info`,
          actionId,
          journeyId: id,
          title: 'Client Verification Information',
          status: taskStatus,
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
    const lineStatus = l.status ?? 'awaiting_review'
    const taskStatus = hoDemoLineTaskStatus(lineStatus)
    grandkids.push({
      id: actionId,
      journeyId: id,
      title: l.title,
      nickname: workflowListLabel,
      status: lineStatus,
      displayStatus: l.displayStatus,
      parentActionId: acctSectionId,
      childId: l.childId,
      tasks: [
        {
          id: `${actionId}-acct`,
          actionId,
          journeyId: id,
          title: 'Account setup',
          status: taskStatus,
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

  const shellActions = [collectAction, accountOpeningAction, ...sectionActions, ...grandkids]
  const derivedJourneyStatus: Journey['status'] = shellActions.every((a) => a.status === 'complete')
    ? 'complete'
    : shellActions.some((a) => a.status !== 'not_started')
      ? 'in_progress'
      : 'not_started'

  return {
    id,
    name,
    category: 'Onboarding',
    relationshipName,
    assignedTo,
    createdBy,
    createdAt,
    status: opts?.journeyStatus ?? derivedJourneyStatus,
    actions: shellActions,
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
  buildJourney(
    'journey-john-smith',
    'Hartley household account opening',
    'Onboarding',
    'Hartley / Owens household',
    'Sarah Chen',
    'Sarah Chen',
    '2026-05-15',
    {
      'existing-accounts': 'in_progress',
      'related-parties': 'in_progress',
      'open-accounts': 'in_progress',
    },
  ),
  buildJourney('journey-johnson', 'Johnson Trust Onboarding', 'Onboarding', 'Johnson Trust', 'Bob Martinez', 'Alice Chen', '2026-03-05', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'kyc-review': 'blocked',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-davis', 'Davis Household Onboarding', 'Onboarding', 'Davis Household', 'Carol Williams', 'Bob Martinez', '2026-03-20', {
    'existing-accounts': 'not_started',
    'related-parties': 'not_started',
    'open-accounts': 'not_started',
  }),
  buildJourney('journey-finch-onboarding', 'Finch LLP Onboarding', 'Onboarding', 'Finch LLP', 'Alice Chen', 'Carol Williams', '2026-02-10', {
    'existing-accounts': 'complete',
    'related-parties': 'complete',
    'open-accounts': 'complete',
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
    'existing-accounts': 'not_started',
    'related-parties': 'not_started',
    'open-accounts': 'not_started',
  }),

  // Document Review queue demos — nested child workflows (KYC / Accounts) in reviewer pipeline
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-not-started-blake',
    'Blake IRA onboarding (queued)',
    'Blake IRA custodial',
    'Diana Torres',
    'Alice Chen',
    '2026-04-01',
    [],
    {
      journeyStatus: 'not_started',
      clientSetupTaskStatus: 'not_started',
      openAccountsTaskStatus: 'not_started',
    },
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-completed-ashford',
    'Ashford family onboarding (closed)',
    'Ashford Family Office',
    'Bob Martinez',
    'Edward Kim',
    '2026-01-20',
    [
      {
        section: 'kyc',
        title: 'Morgan Ashford — KYC',
        nickname: 'Ashford — Morgan Ashford KYC',
        lineKey: 'line-ashford-kyc',
        childId: 'ho-demo-child-ashford-kyc',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'accounts',
        title: 'Family advisory SMA',
        lineKey: 'line-ashford-sma',
        childId: 'ho-demo-child-ashford-sma',
        displayStatus: 'complete',
        status: 'complete',
      },
    ],
    {
      journeyStatus: 'complete',
      clientSetupTaskStatus: 'complete',
      openAccountsTaskStatus: 'complete',
    },
  ),

  /**
   * Demo journeys: account child workflows stay in `awaiting_documents` / `awaiting_review`
   * until every KYC line on that journey is `complete`. Principal / document review on
   * accounts only appear after owner KYC has cleared.
   */
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
        displayStatus: 'awaiting_documents',
      },
      {
        section: 'accounts',
        title: 'Joint brokerage — Rivera / Kim',
        lineKey: 'line-rivera-joint',
        childId: 'ho-demo-child-rivera-joint',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'kyc',
        title: 'Daniel Kim — KYC',
        nickname: 'Rivera / Kim — Daniel Kim KYC',
        lineKey: 'line-rivera-kyc-daniel',
        childId: 'ho-demo-child-rivera-kyc-daniel',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'kyc',
        title: 'Daniel Kim — KYC (prior household)',
        nickname: 'Rivera / Kim — Daniel Kim KYC (complete)',
        lineKey: 'line-rivera-kyc-done',
        childId: 'ho-demo-child-rivera-kyc-done',
        displayStatus: 'complete',
        status: 'complete',
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
        displayStatus: 'awaiting_documents',
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
        section: 'kyc',
        title: 'James Falk — KYC',
        nickname: 'Falk — James Falk KYC',
        lineKey: 'line-falk-kyc',
        childId: 'ho-demo-child-falk-kyc',
        displayStatus: 'complete',
        status: 'complete',
      },
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

  /**
   * AML / Document / Principal reviewer queues (Actions tab) use account child `displayStatus`
   * when KYC rows are hidden (single-flow). Use `escalation_hold` / `rejected_aml` on account lines
   * for AML; `awaiting_documents` / `nigo_*` for Document Review; `principal_review` for Principal.
   */
  /** AML team queue — KYC child workflows in AML / rejection stages (accounts follow after KYC clears). */
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-aml-northpoint',
    'NorthPoint institutional AML bundle',
    'NorthPoint Institutional clients',
    'Alice Chen',
    'Carol Williams',
    '2026-04-08',
    [
      {
        section: 'kyc',
        title: 'Elena North — KYC',
        nickname: 'NorthPoint — Elena North KYC',
        lineKey: 'line-np-kyc-elena',
        childId: 'ho-demo-child-np-kyc-elena',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'kyc',
        title: 'Marcus North — KYC',
        nickname: 'NorthPoint — Marcus North KYC',
        lineKey: 'line-np-kyc-marcus',
        childId: 'ho-demo-child-np-kyc-marcus',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'kyc',
        title: 'Trustee designee — KYC',
        nickname: 'NorthPoint — Trustee designee KYC',
        lineKey: 'line-np-kyc-trustee',
        childId: 'ho-demo-child-np-kyc-trustee',
        displayStatus: 'rejected_aml',
      },
      {
        section: 'kyc',
        title: 'Beneficial owner — offshore entity',
        nickname: 'NorthPoint — BVI beneficial owner KYC',
        lineKey: 'line-np-kyc-bvi',
        childId: 'ho-demo-child-np-kyc-bvi',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'accounts',
        title: 'Growth SMA — IMA',
        lineKey: 'line-np-sma',
        childId: 'ho-demo-child-np-sma',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'accounts',
        title: 'Custodial UTMA',
        lineKey: 'line-np-utma',
        childId: 'ho-demo-child-np-utma',
        displayStatus: 'escalation_hold',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-aml-santos',
    'Santos family office onboarding',
    'Santos Family Office',
    'Bob Martinez',
    'Diana Torres',
    '2026-04-09',
    [
      {
        section: 'kyc',
        title: 'Isabel Santos — KYC',
        nickname: 'Santos — Isabel Santos KYC',
        lineKey: 'line-santos-kyc-isabel',
        childId: 'ho-demo-child-santos-kyc-isabel',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'kyc',
        title: 'Carlos Santos — KYC',
        nickname: 'Santos — Carlos Santos KYC',
        lineKey: 'line-santos-kyc-carlos',
        childId: 'ho-demo-child-santos-kyc-carlos',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'accounts',
        title: 'Private credit feeder',
        lineKey: 'line-santos-feeder',
        childId: 'ho-demo-child-santos-feeder',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'accounts',
        title: 'Offshore blocker (BVI)',
        lineKey: 'line-santos-blocker',
        childId: 'ho-demo-child-santos-blocker',
        displayStatus: 'escalation_hold',
      },
    ],
  ),

  /** Document Review team — additional document / escalation pipeline lines. */
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-doc-summit',
    'Summit Partners LP onboarding',
    'Summit Partners LP',
    'Bob Martinez',
    'Alice Chen',
    '2026-04-09',
    [
      {
        section: 'kyc',
        title: 'Alex Morgan — KYC',
        nickname: 'Summit — Alex Morgan KYC',
        lineKey: 'line-summit-alex',
        childId: 'ho-demo-child-summit-alex',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'kyc',
        title: 'Jordan Lee — KYC',
        nickname: 'Summit — Jordan Lee KYC',
        lineKey: 'line-summit-jordan',
        childId: 'ho-demo-child-summit-jordan',
        displayStatus: 'awaiting_documents',
      },
      {
        section: 'accounts',
        title: 'Operating partnership account',
        lineKey: 'line-summit-op',
        childId: 'ho-demo-child-summit-op',
        displayStatus: 'awaiting_documents',
      },
      {
        section: 'accounts',
        title: 'Follow-on PIPE allocation',
        lineKey: 'line-summit-pipe',
        childId: 'ho-demo-child-summit-pipe',
        displayStatus: 'awaiting_documents',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-doc-meridian',
    'Meridian rollover package',
    'Meridian Dental Group 401(k)',
    'Diana Torres',
    'Edward Kim',
    '2026-04-10',
    [
      {
        section: 'kyc',
        title: 'Dr. Sam Okonkwo — KYC',
        nickname: 'Meridian — Sam Okonkwo KYC',
        lineKey: 'line-meridian-sam',
        childId: 'ho-demo-child-meridian-sam',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'accounts',
        title: 'Safe harbor match account',
        lineKey: 'line-meridian-sh',
        childId: 'ho-demo-child-meridian-sh',
        displayStatus: 'escalation_hold',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-doc-hargrove',
    'Hargrove household account opening',
    'Hargrove / Ngo household',
    'Alice Chen',
    'Bob Martinez',
    '2026-04-10',
    [
      {
        section: 'kyc',
        title: 'Elena Hargrove — KYC',
        nickname: 'Hargrove — Elena Hargrove KYC',
        lineKey: 'line-hargrove-kyc-elena',
        childId: 'ho-demo-child-hargrove-kyc-elena',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'kyc',
        title: 'Minh Ngo — KYC',
        nickname: 'Hargrove — Minh Ngo KYC',
        lineKey: 'line-hargrove-kyc-minh',
        childId: 'ho-demo-child-hargrove-kyc-minh',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'accounts',
        title: 'Joint taxable brokerage',
        lineKey: 'line-hargrove-joint',
        childId: 'ho-demo-child-hargrove-joint',
        displayStatus: 'awaiting_documents',
      },
      {
        section: 'accounts',
        title: 'Roth IRA — Elena',
        lineKey: 'line-hargrove-roth',
        childId: 'ho-demo-child-hargrove-roth',
        displayStatus: 'principal_review',
      },
    ],
  ),

  /** Principal review — additional principal-stage account lines. */
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-principal-altadena',
    'Altadena trust restatement',
    'Altadena Family Trust',
    'Diana Torres',
    'Carol Williams',
    '2026-04-10',
    [
      {
        section: 'kyc',
        title: 'Grantor — KYC',
        nickname: 'Altadena — Grantor KYC',
        lineKey: 'line-alt-kyc-grantor',
        childId: 'ho-demo-child-alt-kyc-grantor',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'kyc',
        title: 'Co-trustee — KYC',
        nickname: 'Altadena — Co-trustee KYC',
        lineKey: 'line-alt-kyc-trustee',
        childId: 'ho-demo-child-alt-kyc-trustee',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'accounts',
        title: 'Irrevocable life insurance trust',
        lineKey: 'line-alt-ilit',
        childId: 'ho-demo-child-alt-ilit',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'accounts',
        title: 'Crummey withdrawal notices',
        lineKey: 'line-alt-crummey',
        childId: 'ho-demo-child-alt-crummey',
        displayStatus: 'principal_review',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-principal-vance',
    'Vance dynasty trust funding',
    'Vance Dynasty Trust',
    'Alice Chen',
    'Bob Martinez',
    '2026-04-11',
    [
      {
        section: 'kyc',
        title: 'Dynasty grantor — KYC',
        nickname: 'Vance — Dynasty grantor KYC',
        lineKey: 'line-vance-kyc',
        childId: 'ho-demo-child-vance-kyc',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'accounts',
        title: 'Directed trust — art collection',
        lineKey: 'line-vance-art',
        childId: 'ho-demo-child-vance-art',
        displayStatus: 'principal_review',
      },
      {
        section: 'accounts',
        title: 'Charitable remainder unitrust',
        lineKey: 'line-vance-crut',
        childId: 'ho-demo-child-vance-crut',
        displayStatus: 'nigo_principal',
      },
    ],
  ),

  /** HO KYC review — additional KYC subjects in HO KYC lane. */
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-kyc-linden',
    'Linden household expansion',
    'Linden / Wu household',
    'Carol Williams',
    'Diana Torres',
    '2026-04-11',
    [
      {
        section: 'kyc',
        title: 'Morgan Linden — KYC',
        nickname: 'Linden — Morgan KYC',
        lineKey: 'line-linden-m',
        childId: 'ho-demo-child-linden-m',
        displayStatus: 'ho_kyc_review',
      },
      {
        section: 'kyc',
        title: 'Priya Wu — KYC',
        nickname: 'Linden — Priya Wu KYC',
        lineKey: 'line-linden-p',
        childId: 'ho-demo-child-linden-p',
        displayStatus: 'ho_kyc_review',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-kyc-hartley',
    'Hartley entity verification',
    'Hartley Medical Holdings LLC',
    'Bob Martinez',
    'Alice Chen',
    '2026-04-12',
    [
      {
        section: 'kyc',
        title: 'Hartley Medical Holdings — KYB',
        nickname: 'Hartley — entity KYB',
        lineKey: 'line-hartley-kyb',
        childId: 'ho-demo-child-hartley-kyb',
        displayStatus: 'ho_kyc_review',
      },
    ],
  ),

  /** More Document Review lane demos — multi-line journeys for grouped Actions. */
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-doc-chestnut',
    'Chestnut Grove advisory onboarding',
    'Chestnut Grove Family Office',
    'Alice Chen',
    'Carol Williams',
    '2026-04-13',
    [
      {
        section: 'kyc',
        title: 'Taylor Reed — KYC',
        nickname: 'Chestnut — Taylor Reed KYC',
        lineKey: 'line-chestnut-reed',
        childId: 'ho-demo-child-chestnut-reed',
        displayStatus: 'awaiting_documents',
      },
      {
        section: 'kyc',
        title: 'Jamie Park — KYC',
        nickname: 'Chestnut — Jamie Park KYC',
        lineKey: 'line-chestnut-park',
        childId: 'ho-demo-child-chestnut-park',
        displayStatus: 'nigo_document',
      },
      {
        section: 'accounts',
        title: 'Consolidated advisory SMA',
        lineKey: 'line-chestnut-sma',
        childId: 'ho-demo-child-chestnut-sma',
        displayStatus: 'awaiting_documents',
      },
      {
        section: 'accounts',
        title: 'Anchor escrow account',
        lineKey: 'line-chestnut-escrow',
        childId: 'ho-demo-child-chestnut-escrow',
        displayStatus: 'nigo_document',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-doc-perimeter',
    'Perimeter biotech secondaries',
    'Perimeter Sciences LP',
    'Bob Martinez',
    'Edward Kim',
    '2026-04-13',
    [
      {
        section: 'kyc',
        title: 'Dr. Nina Cho — KYC',
        nickname: 'Perimeter — Nina Cho KYC',
        lineKey: 'line-perim-cho',
        childId: 'ho-demo-child-perim-cho',
        displayStatus: 'awaiting_documents',
      },
      {
        section: 'accounts',
        title: 'Side pocket — Series D',
        lineKey: 'line-perim-side',
        childId: 'ho-demo-child-perim-side',
        displayStatus: 'awaiting_documents',
      },
      {
        section: 'accounts',
        title: 'Co-invest SPV — clean team',
        lineKey: 'line-perim-spv',
        childId: 'ho-demo-child-perim-spv',
        displayStatus: 'awaiting_documents',
      },
    ],
  ),

  /** More Principal review lane demos — grouped journey headers with multiple children. */
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-principal-keystone',
    'Keystone foundation grant cycle',
    'Keystone Charitable Foundation',
    'Carol Williams',
    'Bob Martinez',
    '2026-04-13',
    [
      {
        section: 'kyc',
        title: 'Foundation board chair — KYC',
        nickname: 'Keystone — Board chair KYC',
        lineKey: 'line-key-kyc-chair',
        childId: 'ho-demo-child-key-kyc-chair',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'kyc',
        title: 'Treasurer — KYC',
        nickname: 'Keystone — Treasurer KYC',
        lineKey: 'line-key-kyc-treasurer',
        childId: 'ho-demo-child-key-kyc-treasurer',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'accounts',
        title: 'Quasi-endowment pool',
        lineKey: 'line-key-quasi',
        childId: 'ho-demo-child-key-quasi',
        displayStatus: 'principal_review',
      },
      {
        section: 'accounts',
        title: 'SPAC allocation sleeve',
        lineKey: 'line-key-spac',
        childId: 'ho-demo-child-key-spac',
        displayStatus: 'nigo_principal',
      },
      {
        section: 'accounts',
        title: 'Board-designated reserves',
        lineKey: 'line-key-reserves',
        childId: 'ho-demo-child-key-reserves',
        displayStatus: 'principal_review',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-principal-winslow',
    'Winslow donor-advised rollout',
    'Winslow Philanthropic Trust',
    'Diana Torres',
    'Carol Williams',
    '2026-04-14',
    [
      {
        section: 'kyc',
        title: 'Donor advisor — KYC',
        nickname: 'Winslow — Donor advisor KYC',
        lineKey: 'line-wins-kyc-advisor',
        childId: 'ho-demo-child-wins-kyc-advisor',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'kyc',
        title: 'Successor advisor — KYC',
        nickname: 'Winslow — Successor advisor KYC',
        lineKey: 'line-wins-kyc-successor',
        childId: 'ho-demo-child-wins-kyc-successor',
        displayStatus: 'complete',
        status: 'complete',
      },
      {
        section: 'accounts',
        title: 'DAF — impact sleeve',
        lineKey: 'line-wins-daf',
        childId: 'ho-demo-child-wins-daf',
        displayStatus: 'principal_review',
      },
      {
        section: 'accounts',
        title: 'Mission-related investment note',
        lineKey: 'line-wins-mri',
        childId: 'ho-demo-child-wins-mri',
        displayStatus: 'principal_review',
      },
    ],
  ),

  /** AML lane — mixed KYC pipeline statuses for reviewer queue demos. */
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-aml-crescent',
    'Crescent clearing firm uplift',
    'Crescent Advisors clearing stack',
    'Diana Torres',
    'Alice Chen',
    '2026-04-13',
    [
      {
        section: 'kyc',
        title: 'Priya Mehta — KYC',
        nickname: 'Crescent — Priya Mehta KYC',
        lineKey: 'line-cres-kyc-priya',
        childId: 'ho-demo-child-cres-kyc-priya',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'kyc',
        title: 'Jonah Crescent — KYC',
        nickname: 'Crescent — Jonah Crescent KYC',
        lineKey: 'line-cres-kyc-jonah',
        childId: 'ho-demo-child-cres-kyc-jonah',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'kyc',
        title: 'Control person — prior SAR',
        nickname: 'Crescent — Control person KYC',
        lineKey: 'line-cres-kyc-sar',
        childId: 'ho-demo-child-cres-kyc-sar',
        displayStatus: 'rejected_aml',
      },
      {
        section: 'kyc',
        title: 'Authorized signer — dual citizen',
        nickname: 'Crescent — Authorized signer KYC',
        lineKey: 'line-cres-kyc-signer',
        childId: 'ho-demo-child-cres-kyc-signer',
        displayStatus: 'awaiting_documents',
      },
      {
        section: 'accounts',
        title: 'Proprietary sleeve — large cap',
        lineKey: 'line-cres-lcap',
        childId: 'ho-demo-child-cres-lcap',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'accounts',
        title: 'Omnibus margin overlay',
        lineKey: 'line-cres-omni',
        childId: 'ho-demo-child-cres-omni',
        displayStatus: 'escalation_hold',
      },
    ],
  ),
  buildDocumentReviewDemoJourney(
    'journey-ho-demo-aml-piedmont',
    'Piedmont RIA custody migration',
    'Piedmont Wealth Partners',
    'Alice Chen',
    'Diana Torres',
    '2026-04-14',
    [
      {
        section: 'kyc',
        title: 'Lena Hart — KYC',
        nickname: 'Piedmont — Lena Hart KYC',
        lineKey: 'line-pied-kyc-lena',
        childId: 'ho-demo-child-pied-kyc-lena',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'kyc',
        title: 'Owen Hart — KYC',
        nickname: 'Piedmont — Owen Hart KYC',
        lineKey: 'line-pied-kyc-owen',
        childId: 'ho-demo-child-pied-kyc-owen',
        displayStatus: 'rejected_aml',
      },
      {
        section: 'kyc',
        title: 'RIA principal — KYC refresh',
        nickname: 'Piedmont — RIA principal KYC',
        lineKey: 'line-pied-kyc-ria',
        childId: 'ho-demo-child-pied-kyc-ria',
        displayStatus: 'ho_kyc_review',
      },
      {
        section: 'accounts',
        title: 'TAMP model delivery — equity',
        lineKey: 'line-pied-eq',
        childId: 'ho-demo-child-pied-eq',
        displayStatus: 'escalation_hold',
      },
      {
        section: 'accounts',
        title: 'Held-away aggregation feed',
        lineKey: 'line-pied-away',
        childId: 'ho-demo-child-pied-away',
        displayStatus: 'awaiting_documents',
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
