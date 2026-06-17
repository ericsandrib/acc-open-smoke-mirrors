import { useEffect, useRef, useState } from 'react'
import { usePGlite } from './PGliteProvider'

/**
 * Tiny query hook for PGlite. Returns rows for a parameterized SELECT.
 *
 *   const { data, loading, error } = useQuery<Row>(
 *     'SELECT * FROM client_organisations WHERE id = $1',
 *     [orgId],
 *   )
 *
 * Re-runs when sql or any param changes (shallow compared).
 *
 * Mutations (INSERT/UPDATE/DELETE) use `useMutation` below.
 */
export interface UseQueryResult<T> {
  data: T[] | null
  loading: boolean
  error: Error | null
  /** Manually re-run the query (useful after a related mutation). */
  refetch: () => void
}

export function useQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): UseQueryResult<T> {
  const pg = usePGlite()
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  // Stable comparison key for params — small arrays of primitives only.
  const key = JSON.stringify(params)
  const sqlRef = useRef(sql)
  sqlRef.current = sql

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    pg.query<T>(sqlRef.current, JSON.parse(key))
      .then((res) => {
        if (cancelled) return
        setData(res.rows)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pg, sql, key, tick])

  return { data, loading, error, refetch: () => setTick((t) => t + 1) }
}

/**
 * Mutation hook for INSERT / UPDATE / DELETE.
 *
 *   const { run, loading, error } = useMutation()
 *   await run('INSERT INTO meetings (...) VALUES ($1, $2)', [a, b])
 */
export function useMutation() {
  const pg = usePGlite()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function run(sql: string, params: unknown[] = []) {
    setLoading(true)
    setError(null)
    try {
      const res = await pg.query(sql, params)
      setLoading(false)
      return res
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      setLoading(false)
      throw e
    }
  }

  return { run, loading, error }
}
