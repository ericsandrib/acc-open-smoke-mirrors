// Configuration knobs surfaced through the live overlay.
//
// All copy here is CLIENT-FACING — written for the firm reviewing the
// prototype, not for an internal CSM. No mention of other tenants by name.
// Substance is preserved (e.g. wide vs tight column catalogs) without
// disclosing whose configuration looks like which.
//
// Source of truth lives in the Avantos Product Customization workspace; the
// overlay panel exposes a "Reference" link per knob for follow-up.

export type ConfigTier = 'avantos' | 'admin' | 'user'
export type ConfigScope = 'page' | 'section' | 'knob' | 'direction'

export interface ConfigKnob {
  /** Stable slug — also used as the lookup key */
  id: string
  /** Display title shown in the panel header */
  title: string
  /** Visual / behavioral category */
  scope: ConfigScope
  /** Direct, second-person question for the firm */
  question: string
  /** Plain-English description of what's customizable here */
  description: string
  /** Optional list of things for the firm to weigh while answering */
  considerations?: string[]
  /** Optional preset paths the firm can pick from */
  options?: string[]
  /** Recommended starting point — shown in its own box */
  recommendedDefault?: string
  /** Who is allowed to change this in production */
  who: ConfigTier
  /** Where the value actually lives (file / table / struct) */
  configLocation?: string
  /** Internal reference URL (Avantos Product Customization workspace) */
  referenceUrl?: string
}

export const CONFIG_KNOBS: Record<string, ConfigKnob> = {
  // ─── Cross-cutting / overall direction ─────────────────────────────────
  'platform/landing-route': {
    id: 'platform/landing-route',
    title: 'Landing surface after sign-in',
    scope: 'direction',
    question: 'Where should advisors land when they sign in?',
    description:
      "The first surface advisors see after authentication. If your team starts the day by triaging what's overdue, the Home dashboard is the right entry point. If they prefer opening their book directly, you can skip Home and land them on Relationships, Servicing, or today's Meetings.",
    considerations: [
      "What's the first thing advisors do after signing in — review their queue, or open a specific client?",
      'Should the experience be the same for everyone, or different for managers vs frontline advisors?',
    ],
    options: [
      'Land on Home (dashboard)',
      'Land on Relationships list',
      'Land on Servicing list',
      "Land on today's Meetings",
    ],
    recommendedDefault: 'Land on Home — easiest to change later if the team prefers a different starting surface.',
    who: 'avantos',
    configLocation: 'Routing tree (deploy-class change)',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8188bb0ee54091bae710',
  },

  // ─── Home page ──────────────────────────────────────────────────────────
  'home/page': {
    id: 'home/page',
    title: 'Home dashboard',
    scope: 'page',
    question: 'Do you want a Home dashboard as the daily starting point?',
    description:
      "Home aggregates across Relationships, Servicing, and Meetings into a single 'what's on my plate today' view. The widget set is fully configurable for your firm.",
    considerations: [
      'Do advisors want a daily triage view, or do they prefer to open their book directly?',
      'If yes, which two or three pieces of information drive their morning routine?',
    ],
    who: 'avantos',
    configLocation: '/agent-portal/home — firm dashboard config',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8188bb0ee54091bae710',
  },
  'home/widget-set': {
    id: 'home/widget-set',
    title: 'Widget set',
    scope: 'knob',
    question: 'Which widgets should the Home dashboard show?',
    description:
      'Pick the widgets that matter most for your advisors\' day-to-day. Arranging or hiding the existing widget types is configuration; introducing entirely new widget types is a development effort.',
    considerations: [
      'Which 4–5 widgets actually drive triage behavior for your advisors?',
      "Are there metrics you wish you had at a glance that aren't represented here yet?",
    ],
    options: [
      'Meetings (today)',
      'Insights',
      'Actions queue',
      'Tasks queue',
      'Recently active clients',
      'AI-recommended next actions',
      'KPI cards',
    ],
    who: 'avantos',
    configLocation: 'Firm home dashboard config',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8188bb0ee54091bae710',
  },
  'home/widget-meetings': {
    id: 'home/widget-meetings',
    title: 'Meetings widget',
    scope: 'knob',
    question: "Should today's meetings appear on Home?",
    description:
      "Pulls from your calendar integration. Most useful if advisors keep their day's schedule there and check it first thing.",
    considerations: [
      'Where do advisors currently see their day at a glance?',
      'Is the calendar integration in scope for the rollout, or a phase-two item?',
    ],
    who: 'avantos',
    configLocation: 'Firm home dashboard config • meetings block',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8188bb0ee54091bae710',
  },
  'home/widget-insights': {
    id: 'home/widget-insights',
    title: 'Insights widget',
    scope: 'knob',
    question: 'Which categories of insights should the dashboard surface?',
    description:
      'A running list of flagged conditions across the book — examples include Excess Cash, No Model Assigned, and Trade Holds. The categories and the specific insight rules are configurable for your firm.',
    considerations: [
      'Which conditions do your advisors most want to be alerted to?',
      'Are these reviewed daily, or only when they spike?',
    ],
    options: [
      'Financial Accounts only',
      'Relationship Health only',
      'Both',
      'Custom set',
      'Hide',
    ],
    who: 'avantos',
    configLocation: 'Firm home dashboard config • insights block',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8188bb0ee54091bae710',
  },
  'home/widget-actions': {
    id: 'home/widget-actions',
    title: 'Actions widget',
    scope: 'knob',
    question: "Should the Actions queue show only the advisor's own work, or the firm's total?",
    description:
      "Lists in-flight actions the advisor owns. Most teams want each advisor to see only their own queue here; a broader manager-level view is also possible.",
    considerations: [
      'Do managers and frontline advisors need different scopes here?',
      "Is anyone outside the advisor pool expected to act on this list?",
    ],
    options: ["Advisor's own book", 'Firm-wide total', 'Hide'],
    recommendedDefault: "Advisor's own book — the most common shape across wealth management teams.",
    who: 'avantos',
    configLocation: 'Firm home dashboard config • actions block',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8188bb0ee54091bae710',
  },
  'home/widget-tasks': {
    id: 'home/widget-tasks',
    title: 'Tasks widget',
    scope: 'knob',
    question: 'Do you want a separate Tasks widget, or is the Actions widget enough?',
    description:
      'Shows individual tasks — the smaller sub-steps within an action. Useful when advisors triage at the task level rather than the action level.',
    considerations: [
      'Do advisors think in terms of whole actions, or do they pick off individual tasks?',
      'Would a single combined queue feel cleaner, or do they want both views?',
    ],
    options: ['Show', 'Hide (collapse into Actions)'],
    who: 'avantos',
    configLocation: 'Firm home dashboard config • tasks block',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8188bb0ee54091bae710',
  },
  'home/role-aware': {
    id: 'home/role-aware',
    title: 'Role-aware Home',
    scope: 'knob',
    question: 'Should Home look the same for everyone, or vary by role?',
    description:
      'By default every advisor sees the same widget set. A role-aware variant — for example, managers seeing escalations while frontline advisors see their own queue — is a development effort rather than a configuration switch.',
    considerations: [
      'Are there clear role differences (manager vs advisor vs ops) that need different daily views?',
      'Is this important enough to justify the development effort, or can per-user filters cover it?',
    ],
    options: ['Same for everyone', 'Role-aware (development effort)'],
    recommendedDefault: 'Same for everyone — start here and revisit only if real differences emerge in use.',
    who: 'avantos',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8188bb0ee54091bae710',
  },
  'home/widgets-as-links': {
    id: 'home/widgets-as-links',
    title: 'Widgets as navigation shortcuts',
    scope: 'knob',
    question: 'Should clicking a widget jump into the underlying surface?',
    description:
      'When on, clicking a widget opens the source view (for example, clicking the Actions count opens the filtered Actions list). Most teams find widgets more useful as navigational shortcuts than as static counts.',
    options: ['Linked (default)', 'Read-only counts'],
    recommendedDefault: 'Linked — widgets earn their space when they double as shortcuts.',
    who: 'avantos',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8188bb0ee54091bae710',
  },

  // ─── Relationships list (parent section) ───────────────────────────────
  'relationships/list': {
    id: 'relationships/list',
    title: 'Relationships list',
    scope: 'section',
    question: "How central is this list view to your advisors' daily work?",
    description:
      "The table view of every client an advisor is responsible for. Every advisor has one. Configuration sits in the children below — columns, default views, and the KPI cards above the list.",
    considerations: [
      'Do advisors live in this list, or only deep-link in from another system?',
      'If they live here, the column / views / metrics decisions matter most.',
    ],
    who: 'avantos',
    configLocation: 'relationships/list',
    referenceUrl: 'https://www.notion.so/356d5fe264fa810985bddd57ea915f1d',
  },

  // ─── Relationships list — three child knobs ────────────────────────────
  'relationships/list/columns': {
    id: 'relationships/list/columns',
    title: 'List columns',
    scope: 'knob',
    question: 'Default column set, or a custom one tailored to your firm?',
    description:
      "There are two layers. A firm-wide default — which columns exist and which are visible out of the box — and a per-advisor override. Any advisor can reorder, hide, or add columns themselves; that personal layout sticks for them and always wins over the firm default.",
    considerations: [
      'Which columns do advisors actually look at today?',
      'Are some columns sensitive — compensation, internal scoring, advisor notes — that should be hidden by default but available on demand?',
      'How wide is the screen real estate the team works on (desktop, laptop, tablet)?',
      'Should certain columns be locked into the visible default set, or do you trust advisors to manage their own views?',
    ],
    options: [
      'Wide catalog (~50 columns) with a curated ~10 visible by default — advisors customize their own view',
      'Tight catalog (~20 columns) with all visible by default — less curation needed',
      'Custom catalog and custom default — the column inventory and out-of-the-box visibility tailored to your firm',
    ],
    recommendedDefault:
      'Start with a tight ~20-column set with all visible — smaller cognitive load. Most teams expand from there once they see the surface in use.',
    who: 'admin',
    configLocation:
      'Firm config: column inventory + default visibility • Per-advisor: custom_views.columns_config / column_order',
    referenceUrl: 'https://www.notion.so/356d5fe264fa81b0a89ed5fb169065b8',
  },
  'relationships/list/default-views': {
    id: 'relationships/list/default-views',
    title: 'Default views',
    scope: 'knob',
    question: 'Should the list open with custom default views?',
    description:
      "A view is a saved combination of filters, sort order, and column visibility. Two settings drive what advisors see when they open this page: which view loads by default, and which views are pinned in the sidebar for quick access. Common shapes include 'My active clients', 'Prospects in last 30 days', or 'Households over $1M'.",
    considerations: [
      "Do advisors think in terms of named views — 'my book', 'prospects to follow up on'? Which ones do they use today?",
      'Should every advisor land on the same default, or do regional managers and frontline advisors need different starting views?',
      'How many views should be pinned to the sidebar — three, five, ten? Pinning everything defeats the purpose.',
      'Are any views client-segment-specific (UHNW, retirement, prospects)? Those are natural pin candidates.',
    ],
    options: [
      'Platform default only — no custom pinning',
      'One custom default + 2–4 pinned views (most common shape)',
      'Per-team defaults via filtered views',
    ],
    recommendedDefault:
      'Start with the platform default and pin two views — one for active clients, one for prospects. Adjust after observing what advisors actually use.',
    who: 'admin',
    configLocation:
      'Firm config: default_view_id, default_pinned_view_ids • Saved views in custom_views',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8169996cd11b3cbc97a6',
  },
  'relationships/list/header-metrics': {
    id: 'relationships/list/header-metrics',
    title: 'Header KPI metrics',
    scope: 'knob',
    question: 'Which KPI cards should sit above the Relationships list — or hide them entirely?',
    description:
      "The row of metric cards above the table — typical content includes client count, AUM, household count, and prospect count. Each card runs a server-side aggregation. The set and order are configurable for your firm; the row can also be hidden entirely to give the table more vertical room.",
    considerations: [
      "Which metrics actually drive day-to-day decisions for your advisors?",
      "Should the metrics scope to 'my book' (the current advisor's clients) or to the firm total?",
      'Should metrics recompute live, or is a daily refresh acceptable? (Live is more expensive.)',
      'Should clicking a card open a filtered view — for example, clicking AUM opens high-AUM accounts?',
    ],
    options: [
      'Standard set — client count, AUM, prospect count',
      'Custom set tailored to your firm',
      'Hide the row — more room for the table',
    ],
    recommendedDefault:
      'Start with the standard set. Most teams refine it once they see it in use; few want it hidden up front.',
    who: 'avantos',
    configLocation: 'Firm config • kpi_cards / header_metrics block',
    referenceUrl: 'https://www.notion.so/356d5fe264fa81bd94ddd00fd481316c',
  },

  // ─── Relationship detail page (parent section) ─────────────────────────
  'relationships/detail': {
    id: 'relationships/detail',
    title: 'Relationship detail page',
    scope: 'section',
    question: 'Which tabs should appear, and in what order?',
    description:
      "The page advisors live in. A persistent sidebar on one side (KYC, contact, addresses) plus a tabbed main area. The tab order and which tabs are visible is configurable for your firm. Tabs that are visible but rarely opened add cognitive cost; tabs that are turned off and later needed require a deployment to bring back.",
    considerations: [
      "What's the first thing an advisor wants to see when they open a client — investment summary, recent activity, household roll-up?",
      'Which tabs are needed daily versus once a quarter? Hide the latter to reduce noise.',
      'Does the tab order match the way advisors describe the client mentally?',
    ],
    options: [
      'Investment-led ordering — Investments tab first',
      'Servicing-led ordering — Servicing tab first',
      'Custom order tailored to your firm',
    ],
    who: 'avantos',
    configLocation: 'Firm config • relationships/detail tab order + visibility',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8124bdcdcb5c59978009',
  },
  'relationships/detail/sidebar': {
    id: 'relationships/detail/sidebar',
    title: 'Detail sidebar',
    scope: 'knob',
    question: 'Standard sidebar (KYC, contact, addresses) or a custom layout for your firm?',
    description:
      "The persistent panel that's always visible alongside whichever tab is open. Field set and ordering is configurable for your firm.",
    considerations: [
      'Which client attributes does an advisor need within reach at all times — KYC, contact, addresses, account summary?',
      'Are there compliance-driven fields that must always be visible?',
    ],
    who: 'admin',
    configLocation: 'Firm config • sidebar block',
    referenceUrl: 'https://www.notion.so/356d5fe264fa814f8f18c1450c460bda',
  },
  'relationships/detail/tabs/overview': {
    id: 'relationships/detail/tabs/overview',
    title: 'Overview tab',
    scope: 'knob',
    question: 'Should the Overview lead with the investment summary, or with recent activity?',
    description:
      'The default tab — a top-line summary of the client. Two common shapes: investment-led (AUM and account list at the top) or activity-led (recent interactions at the top).',
    considerations: [
      'Which view does an advisor reach for first when opening a client cold?',
      'Is the investment picture or the relationship history more immediately useful?',
    ],
    options: [
      'Investment-led — AUM and account list at the top',
      'Activity-led — recent interactions at the top',
      'Custom layout',
    ],
    who: 'admin',
    referenceUrl: 'https://www.notion.so/356d5fe264fa81399bacddae2dbd384a',
  },
  'relationships/detail/tabs/household': {
    id: 'relationships/detail/tabs/household',
    title: 'Household tab',
    scope: 'knob',
    question: 'Should advisors see household members, relationship dates, and roles in one place?',
    description:
      'Related clients in the same household. Visibility and which household properties show is configurable for your firm.',
    considerations: [
      'Do advisors work at the household level, or strictly at the individual level?',
      "Are household relationships, dates, and roles already captured upstream, or will they need to be entered here?",
    ],
    who: 'admin',
    referenceUrl: 'https://www.notion.so/356d5fe264fa811d928cc9715aa2bd48',
  },
  'relationships/detail/tabs/investments': {
    id: 'relationships/detail/tabs/investments',
    title: 'Investments tab',
    scope: 'knob',
    question: 'Account-list shape (one row per account, balance + custodian) or a portfolio-grouped shape?',
    description:
      'Financial accounts under custody. The most common shape is one row per account with balance and custodian visible; a portfolio-grouped shape is also available.',
    considerations: [
      'Do advisors think about positions account-by-account, or by portfolio strategy?',
      'Is custodian visibility important to the day-to-day, or only to ops?',
    ],
    options: [
      'Account list — one row per account, balance + custodian',
      'Portfolio-grouped — accounts rolled up by strategy',
    ],
    who: 'admin',
    referenceUrl: 'https://www.notion.so/356d5fe264fa812dab04dd8e1a4507b2',
  },
  'relationships/detail/tabs/servicing': {
    id: 'relationships/detail/tabs/servicing',
    title: 'Servicing tab',
    scope: 'knob',
    question: 'Should advisors see in-flight actions and tasks for this client here?',
    description:
      "Actions, tasks, and journeys against this client, filtered to just this household. Hidden entirely if your firm doesn't use the Servicing surface.",
    considerations: [
      'Do advisors initiate work from the client page, or from the Servicing list?',
      'Should completed work stay visible here as history, or only in-flight work?',
    ],
    who: 'admin',
    configLocation: 'Firm config • servicing_tab block',
    referenceUrl: 'https://www.notion.so/356d5fe264fa81e7935af3237b92433b',
  },
  'relationships/detail/tabs/documents': {
    id: 'relationships/detail/tabs/documents',
    title: 'Documents tab',
    scope: 'knob',
    question: 'Should documents surface inline here, or link out to the document store?',
    description:
      'Uploaded files for the client. Storage provider and folder root are configured per firm.',
    considerations: [
      'Where do client documents live today — internal store, third-party DMS, shared drive?',
      'Is there a classification scheme that needs to map onto the tabs / filters?',
    ],
    options: ['Inline — surface documents in the tab', 'Link out — open the document store in a new view'],
    who: 'admin',
    configLocation: 'Firm config • documents_tab block; document storage integration',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8171bda0f6abb927e8f0',
  },
  'relationships/detail/tabs/communications': {
    id: 'relationships/detail/tabs/communications',
    title: 'Communications tab',
    scope: 'knob',
    question: 'Should call, email, and meeting logs appear in one timeline?',
    description:
      "Call, email, and meeting logs against the client, in one timeline. Quality depends on which communications systems you connect.",
    considerations: [
      'Which communications systems are in scope for the rollout — email, call recording, calendar?',
      'How long should history go back, and where should older history live?',
    ],
    who: 'admin',
    referenceUrl: 'https://www.notion.so/356d5fe264fa8124bdcdcb5c59978009',
  },

  // ─── Servicing sub-knobs ───────────────────────────────────────────────
  'relationships/detail/tabs/servicing/mode': {
    id: 'relationships/detail/tabs/servicing/mode',
    title: 'Servicing default view',
    scope: 'knob',
    question:
      'When an advisor opens the Servicing tab, should they land on Actions or Tasks first?',
    description:
      'Actions are the higher-level work units (a journey of multiple tasks); Tasks are the individual sub-steps. Most teams pick one depending on whether their advisors triage at the work-unit or the step level.',
    considerations: [
      'Do advisors think in terms of whole journeys, or do they pick off individual tasks?',
      'Is the same default right for managers and frontline advisors, or should it vary by role?',
    ],
    options: ['Land on Actions', 'Land on Tasks'],
    recommendedDefault: 'Actions — gives the higher-level picture first; advisors drill into tasks on demand.',
    who: 'admin',
    configLocation: 'Firm config • servicing_tab.default_mode',
  },
  'relationships/detail/tabs/servicing/filters': {
    id: 'relationships/detail/tabs/servicing/filters',
    title: 'Servicing filter chips',
    scope: 'knob',
    question:
      'Which filter chips should appear above the Servicing list, and which is the default selection?',
    description:
      'The standard set is All / All Open / Drafts / Recommended / Snoozed / More. You can hide any of these, add custom chips, or change which one is selected on first load.',
    considerations: [
      "Which subset of work do advisors look at first when opening a client?",
      'Should there be a chip for work the advisor has personally queued versus team-wide?',
    ],
    options: [
      'Standard set, default to All Open',
      'Standard set, default to Recommended (lean into AI suggestions)',
      'Custom set tailored to your team',
    ],
    recommendedDefault:
      'Standard set with All Open as the default — surfaces in-flight work without overwhelming.',
    who: 'admin',
    configLocation: 'Firm config • servicing_tab.filters',
  },

  // ─── Billing sub-knobs ─────────────────────────────────────────────────
  'relationships/detail/tabs/billing': {
    id: 'relationships/detail/tabs/billing',
    title: 'Billing tab',
    scope: 'knob',
    question:
      'Should advisors see fee structure, billable accounts, and unpaid invoices on the client page?',
    description:
      'Billing surfaces what the firm charges and what has been collected. Some firms want this visible to frontline advisors; others restrict it to ops or finance.',
    considerations: [
      'Who needs visibility into billing on the client page — frontline advisors, managers, ops only?',
      'Is there sensitive billing detail (margin, exceptions, write-offs) that should stay hidden by default?',
    ],
    who: 'admin',
    configLocation: 'Firm config • billing_tab visibility + scope',
  },
  'relationships/detail/tabs/billing/subtabs': {
    id: 'relationships/detail/tabs/billing/subtabs',
    title: 'Billing sub-tabs',
    scope: 'knob',
    question: 'Which Billing sub-tabs belong on this page?',
    description:
      'The standard set is Accounts / History & Invoices / Exceptions. You can hide any, add custom sub-tabs, or change which is selected on first load.',
    options: [
      'Standard set (Accounts / History & Invoices / Exceptions)',
      'Accounts only',
      'Custom set tailored to your team',
    ],
    recommendedDefault:
      'Standard set, Accounts selected by default — exceptions and history are reference surfaces, not daily reads.',
    who: 'admin',
    configLocation: 'Firm config • billing_tab.subtabs',
  },
  'relationships/detail/tabs/billing/summary-tiles': {
    id: 'relationships/detail/tabs/billing/summary-tiles',
    title: 'Billing summary tiles',
    scope: 'knob',
    question: 'Which billing metrics should appear as headline tiles?',
    description:
      'The standard tiles are Total Assets / Total Billable Value / Non-Billed Accounts / Unpaid Invoices. Each is a backend aggregation. The set is configurable.',
    considerations: [
      "Which billing metrics actually drive advisor decisions, versus which are nice-to-have reference?",
      'Should advisors see the firm-side metrics (margin, fee revenue) or only the client-side ones?',
    ],
    options: [
      'Standard four tiles',
      'Client-facing only (Total Assets, Billable Value)',
      'Custom set tailored to your firm',
    ],
    recommendedDefault: 'Standard four tiles.',
    who: 'avantos',
    configLocation: 'Firm config • billing_tab.summary_tiles',
  },
  'relationships/detail/tabs/billing/fee-schedule': {
    id: 'relationships/detail/tabs/billing/fee-schedule',
    title: 'Fee schedule visibility',
    scope: 'knob',
    question:
      'Should the fee schedule be visible to advisors on the relationship page, or only in an admin view?',
    description:
      'The fee schedule defines the rates and tiers applied to billable accounts. Visibility varies by firm — some show it inline for transparency, others restrict to billing operations.',
    options: [
      'Visible to all advisors',
      'Visible to managers only',
      'Admin / ops view only',
    ],
    recommendedDefault:
      'Visible to all advisors — transparency tends to reduce client questions advisors then field.',
    who: 'admin',
    configLocation: 'Firm config • billing_tab.fee_schedule.visibility',
  },

  // ─── Planning knob ─────────────────────────────────────────────────────
  'relationships/detail/tabs/planning': {
    id: 'relationships/detail/tabs/planning',
    title: 'Planning tab',
    scope: 'knob',
    question:
      'Which financial-planning surfaces should appear on the Planning tab?',
    description:
      "The standard layout is a Financial Plans table plus a Net Worth roll-up derived from on-file accounts. eMoney or third-party planning tool integration can be linked in addition to or in place of either.",
    considerations: [
      'Do advisors author plans in this surface, or attach plans authored elsewhere?',
      'Is the Net Worth view derived from accounts on file, or pulled from an aggregator?',
      'Should there be a place for plan assumptions (inflation, return rates) to be reviewed alongside the plan?',
    ],
    options: [
      'Plans table + Net Worth (default)',
      'Plans table only',
      'Net Worth only',
      'Custom layout with eMoney / Right Capital / MoneyGuide link-out',
    ],
    recommendedDefault:
      'Plans table + Net Worth — start with the broadest view, narrow once usage patterns emerge.',
    who: 'admin',
    configLocation: 'Firm config • planning_tab.sections',
  },

  // ─── Cross-cutting data decisions ──────────────────────────────────────
  'data/source-of-truth': {
    id: 'data/source-of-truth',
    title: 'Source of truth for client data',
    scope: 'direction',
    question:
      "Which system is the system of record for the client data feeding these views?",
    description:
      "Avantos can be the system of record, or it can mirror data hydrated from an upstream CRM (Salesforce, Redtail, Wealthbox). The choice drives whether edits made here flow back upstream, and how data conflicts are resolved.",
    considerations: [
      'Where do advisors edit client data today — directly in the CRM, or in the planning surface?',
      'Are there fields that must round-trip back to the CRM for compliance or downstream automation?',
    ],
    options: [
      'Avantos is the system of record',
      'Upstream CRM is the system of record; Avantos mirrors',
      'Hybrid — Avantos owns some fields, CRM owns others',
    ],
    who: 'avantos',
    configLocation: 'Firm config • data.system_of_record + sync direction',
  },
  'data/refresh-cadence': {
    id: 'data/refresh-cadence',
    title: 'Data refresh cadence',
    scope: 'direction',
    question:
      'How often should data refresh from upstream systems — live, hourly, or nightly?',
    description:
      "Refresh cadence trades freshness for cost. Live syncs (sub-minute) are the most expensive and most useful when advisors are actively reacting to changes. Hourly is a common middle ground. Nightly is suitable for stable books where data rarely changes within a session.",
    options: [
      'Live (event-driven, sub-minute)',
      'Hourly',
      'Nightly',
      'Mixed — live for high-value tables, nightly for the rest',
    ],
    recommendedDefault:
      'Hourly — captures intra-day changes without the cost overhead of live event streams.',
    who: 'avantos',
    configLocation: 'Firm config • data.refresh_schedule',
  },
}

/** Lookup helper. */
export function getKnob(id: string): ConfigKnob | undefined {
  return CONFIG_KNOBS[id]
}

export const ALL_KNOBS: ConfigKnob[] = Object.values(CONFIG_KNOBS)
