const JOURNEY_NICKNAME_SEPARATORS = [' - ', ' — '] as const

/**
 * Drops a leading `[Journey name] -` / `[Journey name] —` prefix when the Journey column
 * already shows the journey (servicing / onboarding action tables).
 */
export function shortActionNicknameForTable(
  journeyName: string,
  nickname: string | undefined,
  title: string,
): string {
  const fallback = title.trim() || 'Action'
  const raw = nickname?.trim()
  if (!raw) return fallback
  const jn = journeyName.trim()
  for (const sep of JOURNEY_NICKNAME_SEPARATORS) {
    const prefix = `${jn}${sep}`
    if (raw.startsWith(prefix)) {
      const rest = raw.slice(prefix.length).trim()
      return rest || fallback
    }
  }
  return raw
}

/**
 * For nested child workflow lines, the nickname often repeats the journey and
 * parent workflow label (e.g. "… - Open Financial Account: Rollover IRA").
 * When the journey is already shown on the group row, show only the distinct suffix.
 */
export function compactNestedActionLabel(row: {
  journeyName: string
  isChildWorkflow: boolean
  preferredLabel: string
}): string {
  const { journeyName, isChildWorkflow, preferredLabel } = row
  const label = preferredLabel.trim()
  if (!isChildWorkflow || !label) return preferredLabel

  const prefix = `${journeyName} - `
  const s = label.startsWith(prefix) ? label.slice(prefix.length) : label

  const marker = ': '
  const idx = s.indexOf(marker)
  if (idx !== -1) {
    const after = s.slice(idx + marker.length).trim()
    if (after) return after
  }

  return s.trim() || label
}
