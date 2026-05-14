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
