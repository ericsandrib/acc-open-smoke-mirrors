// Detail-page queries — sub-data for a single relationship.
//
// Adapts upstream tables (financial_accounts, clients/persons, action_runs,
// tasks, meetings) into shapes the existing UI components expect.

import { useQuery } from '../useQuery'

// ─── Financial Accounts ────────────────────────────────────────────────

export interface FinancialAccountRow {
  id: string
  name: string
  accountNumber: string
  custodian: string
  taxStatus: string
  status: string
  balance: number
  cashBalance: number
}

interface FaRaw {
  id: string
  name: string | null
  account_number: string
  custodian: string | null
  tax_status: string | null
  status: string
  balance: number | null
  cash_balance: number | null
}

export function useFinancialAccounts(orgId: string) {
  const { data, loading, error } = useQuery<FaRaw>(
    `SELECT id, name, account_number, custodian, tax_status, status, balance, cash_balance
     FROM financial_accounts
     WHERE client_organisation_id = $1
     ORDER BY balance DESC NULLS LAST`,
    [orgId],
  )
  return {
    loading,
    error,
    data:
      data?.map<FinancialAccountRow>((r) => ({
        id: r.id,
        name: r.name ?? 'Account',
        accountNumber: r.account_number,
        custodian: r.custodian ?? 'Fidelity',
        taxStatus: r.tax_status ?? 'taxable',
        status: r.status,
        balance: Number(r.balance ?? 0),
        cashBalance: Number(r.cash_balance ?? 0),
      })) ?? null,
  }
}

// ─── Household members ─────────────────────────────────────────────────

export interface HouseholdMember {
  clientId: string
  personId: string
  firstName: string
  lastName: string
  role: string
  isPrimary: boolean
  dob: string | null
}

interface MemberRaw {
  client_id: string
  person_id: string
  first_name: string | null
  last_name: string | null
  role: string | null
  is_primary: boolean
  date_of_birth: string | null
}

export function useHouseholdMembers(orgId: string) {
  const { data, loading, error } = useQuery<MemberRaw>(
    `SELECT c.id AS client_id, p.id AS person_id,
            p.first_name, p.last_name, c.role, c.is_primary, p.date_of_birth
     FROM clients c
     JOIN persons p ON p.id = c.person_id
     WHERE c.organisation_id = $1
       AND c.deleted_at IS NULL
     ORDER BY c.is_primary DESC, c.role NULLS LAST, p.last_name`,
    [orgId],
  )
  return {
    loading,
    error,
    data:
      data?.map<HouseholdMember>((r) => ({
        clientId: r.client_id,
        personId: r.person_id,
        firstName: r.first_name ?? '',
        lastName: r.last_name ?? '',
        role: r.role ?? 'member',
        isPrimary: r.is_primary,
        dob: r.date_of_birth,
      })) ?? null,
  }
}

// ─── Action Runs ───────────────────────────────────────────────────────

export interface ActionRunRow {
  id: string
  name: string
  blueprintName: string
  category: string | null
  status: string
  startedAt: string | null
  deadline: string | null
}

interface ArRaw {
  id: string
  name: string | null
  blueprint_name: string
  blueprint_category: string | null
  status: string
  started_at: string | null
  deadline: string | null
}

export function useActionRuns(orgId: string) {
  const { data, loading, error } = useQuery<ArRaw>(
    `SELECT id, name, blueprint_name, blueprint_category, status, started_at, deadline
     FROM action_runs
     WHERE client_organisation_id = $1
       AND deleted_at IS NULL
     ORDER BY started_at DESC NULLS LAST`,
    [orgId],
  )
  return {
    loading,
    error,
    data:
      data?.map<ActionRunRow>((r) => ({
        id: r.id,
        name: r.name ?? r.blueprint_name,
        blueprintName: r.blueprint_name,
        category: r.blueprint_category,
        status: r.status,
        startedAt: r.started_at,
        deadline: r.deadline,
      })) ?? null,
  }
}

// ─── Tasks ─────────────────────────────────────────────────────────────

export interface TaskRow {
  id: string
  runId: string
  blueprintName: string
  name: string
  status: string
  deadline: string | null
}

interface TaskRaw {
  id: string
  run_id: string
  name: string
  status: string
  deadline: string | null
  blueprint_name: string
}

export function useTasks(orgId: string) {
  const { data, loading, error } = useQuery<TaskRaw>(
    `SELECT t.id, t.run_id, t.name, t.status, t.deadline,
            ar.blueprint_name
     FROM tasks t
     JOIN action_runs ar ON ar.id = t.run_id
     WHERE ar.client_organisation_id = $1
       AND t.deleted_at IS NULL
       AND ar.deleted_at IS NULL
     ORDER BY t.created_at DESC`,
    [orgId],
  )
  return {
    loading,
    error,
    data:
      data?.map<TaskRow>((r) => ({
        id: r.id,
        runId: r.run_id,
        name: r.name,
        status: r.status,
        deadline: r.deadline,
        blueprintName: r.blueprint_name,
      })) ?? null,
  }
}

// ─── Meetings / Communications ─────────────────────────────────────────

export interface MeetingRow {
  id: string
  subject: string
  description: string | null
  startTime: string | null
  endTime: string | null
  location: string | null
  meetingType: string
  status: string
}

interface MeetingRaw {
  id: string
  subject: string | null
  description: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  meeting_type: string
  status: string
}

export function useMeetings(orgId: string) {
  const { data, loading, error } = useQuery<MeetingRaw>(
    `SELECT id, subject, description, start_time, end_time, location, meeting_type, status
     FROM meetings
     WHERE client_organisation_id = $1
     ORDER BY start_time DESC NULLS LAST`,
    [orgId],
  )
  return {
    loading,
    error,
    data:
      data?.map<MeetingRow>((r) => ({
        id: r.id,
        subject: r.subject ?? '(untitled meeting)',
        description: r.description,
        startTime: r.start_time,
        endTime: r.end_time,
        location: r.location,
        meetingType: r.meeting_type,
        status: r.status,
      })) ?? null,
  }
}
