// Synthetic seed orchestrator.
//
// Runs against a freshly-migrated PGlite instance. All data is synthetic;
// see ./data.ts for source records. Idempotent by truncation — re-running
// wipes prior seeded data first (only relevant in dev when HMR re-runs boot).

import type { PGlite } from '@electric-sql/pglite'
import {
  ACTION_BLUEPRINTS,
  ADVISOR_ID,
  ADVISOR_ORG_ID,
  ADVISOR_PERSON_ID,
  HOUSEHOLDS,
  TENANT_ID,
  type SeedHousehold,
} from './data'

const TODAY = new Date().toISOString().slice(0, 10)

// ─── helpers ───────────────────────────────────────────────────────────

let _counter = 0
const nextSuffix = () => `${Date.now().toString(36)}${(++_counter).toString(36)}`

function id(prefix: string) {
  return `${prefix}_${nextSuffix()}`
}

async function exec(pg: PGlite, sql: string, params: unknown[] = []) {
  return pg.query(sql, params)
}

// ─── orchestrator ──────────────────────────────────────────────────────

export async function runSeed(pg: PGlite): Promise<void> {
  await seedAgentOrganisation(pg)
  await seedAdvisor(pg)
  await seedActionBlueprints(pg)
  for (const hh of HOUSEHOLDS) {
    await seedHousehold(pg, hh)
  }
}

// ─── agent organisation (Stratos) ──────────────────────────────────────

async function seedAgentOrganisation(pg: PGlite) {
  await exec(
    pg,
    `INSERT INTO agent_organisations
     (id, tenant_id, name, agent_organisation_type, agent_organisation_role, description, status)
     VALUES ($1, $2, $3, 'firm', 'primary', $4, 'Active')
     ON CONFLICT DO NOTHING`,
    [ADVISOR_ORG_ID, TENANT_ID, 'Stratos Advisors', 'Stratos Advisors firm'],
  )
}

// ─── advisor (Greta) ───────────────────────────────────────────────────

async function seedAdvisor(pg: PGlite) {
  await exec(
    pg,
    `INSERT INTO persons (tenant_id, id, first_name, last_name, gender, preferred_contact_method)
     VALUES ($1, $2, 'Greta', 'Friedrichs', 'F', 'email')
     ON CONFLICT DO NOTHING`,
    [TENANT_ID, ADVISOR_PERSON_ID],
  )

  await exec(
    pg,
    `INSERT INTO agents
     (tenant_id, id, person_id, organisation_id, qualification, type, active)
     VALUES ($1, $2, $3, $4, 'Lead Advisor', 'advisor', true)
     ON CONFLICT DO NOTHING`,
    [TENANT_ID, ADVISOR_ID, ADVISOR_PERSON_ID, ADVISOR_ORG_ID],
  )
}

// ─── action blueprints ────────────────────────────────────────────────

async function seedActionBlueprints(pg: PGlite) {
  for (const bp of ACTION_BLUEPRINTS) {
    await exec(
      pg,
      `INSERT INTO action_blueprints
       (id, tenant_id, name, description, category, short_description)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [
        `abp_${bp.slug}`,
        TENANT_ID,
        bp.name,
        bp.description,
        bp.category,
        bp.description.slice(0, 80),
      ],
    )
  }
}

// ─── household + members + accounts + actions + meetings ───────────────

async function seedHousehold(pg: PGlite, hh: SeedHousehold) {
  const orgId = `co_${hh.slug}`

  // 1. client_organisation
  const relationshipStatus =
    hh.type === 'Existing' ? 'active' : hh.type === 'Onboarding' ? 'onboarding' : 'prospect'

  await exec(
    pg,
    `INSERT INTO client_organisations
     (tenant_id, id, name, client_organisation_type, agent_organisation_id,
      relationship_status, approx_aum, next_meeting,
      client_segmentation, relationship_start_date, last_interaction_date, notes)
     VALUES ($1, $2, $3, 'household', $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      TENANT_ID,
      orgId,
      hh.household,
      ADVISOR_ORG_ID,
      relationshipStatus,
      hh.totalAum || null,
      hh.nextMeeting,
      hh.offering,
      hh.clientSince,
      hh.lastInteraction,
      `Household ${hh.household} • ${hh.city || 'no city on file'}${hh.state ? ', ' + hh.state : ''}`,
    ],
  )

  // 2. advisor-org assignment
  await exec(
    pg,
    `INSERT INTO agent_client_organisation_relationships
     (id, tenant_id, client_organisation_id, agent_id, relationship_type, description, direct_assignment)
     VALUES ($1, $2, $3, $4, 'lead_advisor', 'Lead advisor', true)`,
    [id('acor'), TENANT_ID, orgId, ADVISOR_ID],
  )

  // 3. members → persons + clients
  let memberIdx = 0
  for (const m of hh.members) {
    const personId = `per_${hh.slug}_${memberIdx}`
    const clientId = `cli_${hh.slug}_${memberIdx}`
    await exec(
      pg,
      `INSERT INTO persons
       (tenant_id, id, first_name, last_name, date_of_birth, preferred_contact_method)
       VALUES ($1, $2, $3, $4, $5, 'email')`,
      [TENANT_ID, personId, m.firstName, m.lastName, m.dob],
    )
    await exec(
      pg,
      `INSERT INTO clients
       (tenant_id, id, person_id, organisation_id, role, is_primary, status, subtype)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', 'individual')`,
      [
        TENANT_ID,
        clientId,
        personId,
        orgId,
        m.role,
        m.role === 'primary',
      ],
    )
    memberIdx++
  }

  // 4. household address (single primary address)
  if (hh.city) {
    const addrId = `addr_${hh.slug}`
    await exec(
      pg,
      `INSERT INTO addresses
       (tenant_id, id, address_line1, city, state, zipcode, country)
       VALUES ($1, $2, $3, $4, $5, $6, 'US')`,
      [TENANT_ID, addrId, `${100 + addrId.length} ${hh.household.split(' ')[0]} Street`, hh.city, hh.state || '', String(10000 + (hh.slug.charCodeAt(0) * 31 + hh.slug.length))],
    )
    await exec(
      pg,
      `INSERT INTO address_entity_relationships
       (id, tenant_id, client_organisation_id, address_id, address_type)
       VALUES ($1, $2, $3, $4, 'primary')`,
      [id('aer'), TENANT_ID, orgId, addrId],
    )
  }

  // 5. financial accounts (Fidelity)
  const primaryClientId = `cli_${hh.slug}_0`
  if (hh.accountCount > 0 && hh.totalAum > 0) {
    const perAccount = Math.floor(hh.totalAum / hh.accountCount)
    const types: Array<{ name: string; tax: string }> = [
      { name: 'Joint Brokerage', tax: 'taxable' },
      { name: 'Traditional IRA', tax: 'tax-deferred' },
      { name: 'Roth IRA', tax: 'tax-free' },
      { name: '401(k) Rollover', tax: 'tax-deferred' },
    ]
    for (let i = 0; i < hh.accountCount; i++) {
      const t = types[i % types.length]
      const acctId = `fa_${hh.slug}_${i}`
      const acctNum = `FID${(900000000 + Math.floor(Math.random() * 100000000)).toString()}`
      const balance = i === hh.accountCount - 1
        ? hh.totalAum - perAccount * (hh.accountCount - 1)
        : perAccount
      await exec(
        pg,
        `INSERT INTO financial_accounts
         (tenant_id, id, account_number, open_date, status, primary_owner_id,
          tax_status, currency_code, client_organisation_id, name, balance,
          cash_balance, custodian)
         VALUES ($1, $2, $3, $4, 'active', $5, $6, 'USD', $7, $8, $9, $10, 'Fidelity')`,
        [
          TENANT_ID,
          acctId,
          acctNum,
          hh.clientSince ?? TODAY,
          primaryClientId,
          t.tax,
          orgId,
          t.name,
          balance,
          Math.floor(balance * 0.03), // ~3% cash
        ],
      )
    }
  }

  // 6. action runs + tasks
  const statuses = ['in_progress', 'ready', 'draft', 'completed']
  for (let i = 0; i < hh.actionRunCount; i++) {
    const bp = ACTION_BLUEPRINTS[i % ACTION_BLUEPRINTS.length]
    const runId = `run_${hh.slug}_${i}`
    const status = i === 0 ? 'in_progress' : statuses[i % statuses.length]
    await exec(
      pg,
      `INSERT INTO action_runs
       (id, tenant_id, action_id, status, started_by, client_organisation_id,
        blueprint_version_id, blueprint_name, blueprint_category, blueprint_description,
        run_context, environment, name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'manual', 'prototype', $11)`,
      [
        runId,
        TENANT_ID,
        `abp_${bp.slug}`,
        status,
        ADVISOR_ID,
        orgId,
        `abv_${bp.slug}_v1`,
        bp.name,
        bp.category,
        bp.description,
        bp.name,
      ],
    )

    // 2-4 tasks per run
    const taskCount = 2 + (i % 3)
    for (let j = 0; j < taskCount; j++) {
      const taskStatuses = ['pending', 'in_progress', 'completed']
      const ts = taskStatuses[(i + j) % taskStatuses.length]
      await exec(
        pg,
        `INSERT INTO tasks
         (id, tenant_id, run_id, component_key, name, type, status, assigned_agent_id, data)
         VALUES ($1, $2, $3, $4, $5, 'form', $6, $7, '{}'::jsonb)`,
        [
          `tsk_${hh.slug}_${i}_${j}`,
          TENANT_ID,
          runId,
          `step_${j + 1}`,
          taskNameFor(bp.slug, j),
          ts,
          ADVISOR_ID,
        ],
      )
    }
  }

  // 7. meetings
  if (primaryClientId && hh.meetingCount > 0) {
    const titles = [
      'Quarterly review',
      'Onboarding kickoff',
      'Planning conversation',
      'Tax preparation walkthrough',
      'Retirement projection update',
      'Document signing',
    ]
    const locations = ['In-person', 'Phone', 'Video', 'Email thread']
    for (let i = 0; i < hh.meetingCount; i++) {
      const subject = titles[i % titles.length]
      const loc = locations[i % locations.length]
      const start = new Date()
      start.setDate(start.getDate() - (i + 1) * 14)
      const end = new Date(start.getTime() + 45 * 60 * 1000)
      await exec(
        pg,
        `INSERT INTO meetings
         (id, tenant_id, initiating_agent_id, primary_client_id, subject,
          description, start_time, end_time, location, meeting_type, status,
          client_organisation_id, record_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'one_on_one', 'completed', $10, 'review')`,
        [
          `mtg_${hh.slug}_${i}`,
          TENANT_ID,
          ADVISOR_ID,
          primaryClientId,
          subject,
          `${subject} for ${hh.household}`,
          start.toISOString(),
          end.toISOString(),
          loc,
          orgId,
        ],
      )
    }
  }
}

function taskNameFor(blueprintSlug: string, taskIdx: number): string {
  const lookup: Record<string, string[]> = {
    onboard: [
      'Collect identity documents',
      'Open primary account',
      'Initial funding',
      'Confirm beneficiaries',
    ],
    sloa: [
      'Collect SLOA form',
      'Verify destination account',
      'Submit to operations',
      'Confirm activation',
    ],
    close: [
      'Initiate close request',
      'Confirm zero balance',
      'File closing letter',
    ],
    rebalance: [
      'Pull current allocation',
      'Generate rebalance proposal',
      'Get client approval',
      'Execute trades',
    ],
    review: [
      'Schedule review meeting',
      'Prepare review packet',
      'Discuss goals',
      'Document next steps',
    ],
  }
  const list = lookup[blueprintSlug] ?? ['Step ' + (taskIdx + 1)]
  return list[taskIdx % list.length]
}
