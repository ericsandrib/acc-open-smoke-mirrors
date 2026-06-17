// Relationships list + detail queries.
//
// Adapts the upstream Avantos `client_organisations` table (28 columns,
// faithful upstream mirror) into the shape the existing UI expects so the
// rest of the prototype barely changes. The legacy `Relationship` type in
// src/data/relationshipsSeed.ts remains the canonical UI type.

import { useQuery, type UseQueryResult } from '../useQuery'
import type { Relationship, RelationshipType, Offering } from '@/data/relationshipsSeed'

interface ClientOrgRow {
  id: string
  name: string
  relationship_status: string | null
  approx_aum: number | null
  next_meeting: string | null
  client_segmentation: string | null
  relationship_start_date: string | null
  last_interaction_date: string | null
  notes: string | null
  /** Orion-derived attributes, parked in extra_properties.orion. */
  extra_properties: { orion?: Record<string, unknown> } | null
}

function mapTypeFromStatus(s: string | null): RelationshipType {
  switch (s) {
    case 'onboarding':
      return 'Onboarding'
    case 'prospect':
      return 'Prospect'
    case 'active':
    default:
      return 'Existing'
  }
}

function formatDateLong(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function parseCityState(notes: string | null): { city: string; state: string } {
  // Seed stores "Household X • CITY, ST" in notes — extract back out.
  if (!notes) return { city: '', state: '' }
  const m = notes.match(/•\s*([^,]+?)(?:,\s*([A-Z]{2}))?$/)
  if (!m) return { city: '', state: '' }
  const cityRaw = m[1]?.trim() ?? ''
  const city = cityRaw === 'no city on file' ? '' : cityRaw
  return { city, state: m[2]?.trim() ?? '' }
}

function rowToRelationship(r: ClientOrgRow): Relationship {
  const type = mapTypeFromStatus(r.relationship_status)
  const aum = r.approx_aum ?? 0
  const lastInteraction = formatDateLong(r.last_interaction_date)
  const { city, state } = parseCityState(r.notes)
  return {
    id: r.id,
    household: r.name,
    advisor: 'Greta Friedrichs',
    advisorInitials: 'GF',
    offering: (r.client_segmentation as Offering | null) ?? 'Guided Investing',
    type,
    aum: type === 'Prospect' ? 0 : aum,
    lastMeeting: lastInteraction,
    nextMeeting: formatDateLong(r.next_meeting),
    city,
    state,
    targetedAum: type === 'Prospect' ? null : null,
    updatedAt: lastInteraction || '—',
    status:
      type === 'Existing'
        ? 'Onboarded'
        : type === 'Onboarding'
        ? 'Account opening in progress'
        : null,
    clientSince: formatDateLong(r.relationship_start_date) || undefined,
    totalAum: aum,
  }
}

const LIST_SQL = `
  SELECT id, name, relationship_status, approx_aum, next_meeting,
         client_segmentation, relationship_start_date, last_interaction_date, notes,
         extra_properties
  FROM client_organisations
  WHERE deleted_at IS NULL
  ORDER BY name
`

export function useRelationships(): UseQueryResult<Relationship> & {
  data: Relationship[] | null
} {
  const q = useQuery<ClientOrgRow>(LIST_SQL)
  return {
    ...q,
    data: q.data ? q.data.map(rowToRelationship) : null,
  } as UseQueryResult<Relationship> & { data: Relationship[] | null }
}

/**
 * Pull the Orion-derived attributes for a relationship out of
 * client_organisations.extra_properties.orion. Used by the Household tab
 * and account drawer to render the suitability/risk/billing profile.
 */
export function useOrionProfile(id: string): {
  data: Record<string, unknown> | null
  loading: boolean
  error: Error | null
} {
  const { data, loading, error } = useQuery<ClientOrgRow>(
    `SELECT id, name, relationship_status, approx_aum, next_meeting,
            client_segmentation, relationship_start_date, last_interaction_date, notes,
            extra_properties
     FROM client_organisations
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  )
  return {
    loading,
    error,
    data:
      data && data.length > 0
        ? (data[0].extra_properties?.orion as Record<string, unknown> | undefined) ?? null
        : null,
  }
}

export function useRelationship(id: string) {
  const q = useQuery<ClientOrgRow>(
    `${LIST_SQL.replace('WHERE deleted_at IS NULL', 'WHERE deleted_at IS NULL AND id = $1')}`,
    [id],
  )
  return {
    ...q,
    data: q.data && q.data.length > 0 ? rowToRelationship(q.data[0]) : null,
  }
}

/** Aggregate KPI numbers for the three header cards on the list page. */
export interface RelationshipMetrics {
  totalClients: number
  prospective: { total: number; targetedAum: string }
  new: { total: number; aum: string }
  existing: { total: number; aum: string }
  tabs: {
    all: number
    prospective: number
    onboarding: number
    existing: number
    transferred: number
  }
}

const METRICS_SQL = `
  WITH agg AS (
    SELECT
      relationship_status,
      COUNT(*)::int                                                 AS total,
      COALESCE(SUM(approx_aum), 0)::numeric                         AS aum_sum
    FROM client_organisations
    WHERE deleted_at IS NULL
    GROUP BY relationship_status
  )
  SELECT
    (SELECT COUNT(*)::int FROM client_organisations WHERE deleted_at IS NULL) AS total_clients,
    COALESCE((SELECT total FROM agg WHERE relationship_status = 'prospect'), 0)   AS prospect_total,
    COALESCE((SELECT aum_sum FROM agg WHERE relationship_status = 'prospect'), 0) AS prospect_aum,
    COALESCE((SELECT total FROM agg WHERE relationship_status = 'onboarding'), 0)   AS onboarding_total,
    COALESCE((SELECT aum_sum FROM agg WHERE relationship_status = 'onboarding'), 0) AS onboarding_aum,
    COALESCE((SELECT total FROM agg WHERE relationship_status = 'active'), 0)   AS existing_total,
    COALESCE((SELECT aum_sum FROM agg WHERE relationship_status = 'active'), 0) AS existing_aum
`

function fmtMillions(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(Math.round(n))
}

export function useRelationshipMetrics(): {
  data: RelationshipMetrics | null
  loading: boolean
  error: Error | null
} {
  const { data, loading, error } = useQuery<{
    total_clients: number
    prospect_total: number
    prospect_aum: number
    onboarding_total: number
    onboarding_aum: number
    existing_total: number
    existing_aum: number
  }>(METRICS_SQL)
  if (!data || data.length === 0) return { data: null, loading, error }
  const r = data[0]
  return {
    loading,
    error,
    data: {
      totalClients: r.total_clients,
      prospective: {
        total: r.prospect_total,
        targetedAum: fmtMillions(Number(r.prospect_aum) || 0),
      },
      new: {
        total: r.onboarding_total,
        aum: fmtMillions(Number(r.onboarding_aum) || 0),
      },
      existing: {
        total: r.existing_total,
        aum: fmtMillions(Number(r.existing_aum) || 0),
      },
      tabs: {
        all: r.total_clients,
        prospective: r.prospect_total,
        onboarding: r.onboarding_total,
        existing: r.existing_total,
        transferred: 0,
      },
    },
  }
}
