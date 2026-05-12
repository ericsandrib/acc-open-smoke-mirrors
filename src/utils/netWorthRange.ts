/**
 * Parses the net-worth-range bucket strings used in
 * `AccountOwnerIndividualProfile.netWorthRange` /
 * `.liquidNetWorthRange` into numeric estimates so the per-account validation
 * (Approximate Account Value vs Liquid/Net Worth) can run on numbers.
 *
 * Ranges are bucket strings sourced from `src/types/accountOwnerIndividual.ts`:
 *   NET_WORTH_RANGES         — "Under $100,000", "$100,000–$249,999", …, "Over $2M"
 *   LIQUID_NET_WORTH_RANGES  — "Under $50,000", "$50,000–$99,999", …, "$500,000+"
 *
 * We return the midpoint for closed ranges, the upper bound for "Under $X"
 * buckets, and a generous lower-bound floor for open-ended "Over $X" / "$X+"
 * buckets so an unspecified ceiling doesn't silently pass every validation.
 */

const SUFFIX_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000,
}

function parseDollarToken(raw: string): number | null {
  const cleaned = raw.replace(/[,$\s]/g, '').toLowerCase()
  const match = cleaned.match(/^([0-9]+(?:\.[0-9]+)?)([kmb])?$/)
  if (!match) return null
  const [, num, suffix] = match
  const n = Number.parseFloat(num)
  if (!Number.isFinite(n)) return null
  return n * (suffix ? SUFFIX_MULTIPLIERS[suffix] ?? 1 : 1)
}

/**
 * Parse a single range label to numeric `{ low, high, midpoint }`. Returns
 * null when the string can't be interpreted.
 */
export function parseRangeBucket(label: string | undefined | null):
  | { low: number; high: number; midpoint: number }
  | null {
  if (!label) return null
  const trimmed = label.trim().toLowerCase()
  if (!trimmed) return null

  // "Under $X" / "Less than $X"
  const underMatch = trimmed.match(/^(?:under|less than|<)\s*\$?([0-9.,kmb]+)/)
  if (underMatch) {
    const ceiling = parseDollarToken(underMatch[1])
    if (ceiling == null) return null
    return { low: 0, high: ceiling, midpoint: ceiling / 2 }
  }

  // "Over $X" / "$X+" / ">= $X"
  const overMatch = trimmed.match(/^(?:over|>=|>|at least)\s*\$?([0-9.,kmb]+)/)
  if (overMatch) {
    const floor = parseDollarToken(overMatch[1])
    if (floor == null) return null
    // Use floor as the conservative estimate; a 50% headroom keeps validation
    // strict without inventing a ceiling we can't justify.
    return { low: floor, high: floor * 1.5, midpoint: floor * 1.25 }
  }
  const plusMatch = trimmed.match(/^\$?([0-9.,kmb]+)\s*\+/)
  if (plusMatch) {
    const floor = parseDollarToken(plusMatch[1])
    if (floor == null) return null
    return { low: floor, high: floor * 1.5, midpoint: floor * 1.25 }
  }

  // "$X–$Y" or "$X-$Y" (en-dash, em-dash, hyphen, "to")
  const rangeMatch = trimmed.match(
    /^\$?([0-9.,kmb]+)\s*(?:[\u2013\u2014\-]|to)\s*\$?([0-9.,kmb]+)$/,
  )
  if (rangeMatch) {
    const low = parseDollarToken(rangeMatch[1])
    const high = parseDollarToken(rangeMatch[2])
    if (low == null || high == null) return null
    return { low, high, midpoint: (low + high) / 2 }
  }

  return null
}

/**
 * Returns the midpoint estimate for a bucket label, or null when the label
 * can't be parsed.
 */
export function rangeToMidpoint(label: string | undefined | null): number | null {
  const parsed = parseRangeBucket(label)
  return parsed ? parsed.midpoint : null
}

/**
 * Sum the midpoints of multiple range labels. Labels that fail to parse are
 * skipped — the returned object reports how many were missing so the caller
 * can surface a hint to the operator.
 */
export function sumRangeMidpoints(labels: Array<string | undefined | null>): {
  total: number
  parsedCount: number
  missingCount: number
} {
  let total = 0
  let parsedCount = 0
  let missingCount = 0
  for (const label of labels) {
    const mid = rangeToMidpoint(label)
    if (mid == null) {
      missingCount += 1
    } else {
      total += mid
      parsedCount += 1
    }
  }
  return { total, parsedCount, missingCount }
}
