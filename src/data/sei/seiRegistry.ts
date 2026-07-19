/**
 * SEI Custody account-opening field registry.
 *
 * Source of truth: `sei_registry.json`, extracted verbatim from SEI's
 * `SEI_Account_Open_Form_Analysis` workbook (10 form tabs A–J, 247 unique
 * fields). Every field carries a per-form status and an optional per-form
 * "Visible When" rule. The dynamic SEI form renders a field on form X when
 * `statusByForm[X] !== 'Hidden'` and (for Conditional statuses) its rule
 * evaluates true.
 *
 * This module only normalizes the raw data into typed shapes — no React.
 */
import rawRegistry from './sei_registry.json'

export type SeiFormLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'

/** The 7 status values observed across all 2,470 (field × form) cells. */
export type SeiFieldStatus =
  | 'Required'
  | 'Optional'
  | 'Conditional'
  | 'Hidden'
  | 'Display Only'
  | 'Conditional - Display Only'
  | 'Conditional - Read Only'

/** Normalized control kind the renderer switches on. */
export type SeiControl =
  | 'text'
  | 'textarea'
  | 'number'
  | 'dropdown'
  | 'multiselect'
  | 'toggle'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'display'
  | 'progress'
  | 'typeahead'

interface RawSeiField {
  section: string
  field: string
  apiField: string
  fieldType: string
  options: string
  validation: string
  apiSource: string
  statusByForm: Record<string, string>
  visibleWhenByForm: Record<string, string>
}

export interface SeiField {
  /** Raw workbook section header (used as the grouping key + render order). */
  section: string
  /** Cleaned section header for display (component annotations stripped). */
  sectionLabel: string
  /** UI display label. */
  field: string
  /** SEI DAO / API field name. */
  apiField: string
  /** Normalized control kind. */
  control: SeiControl
  /** Original (often dirty) fieldType string, kept for reference/debug. */
  rawFieldType: string
  /** Raw options string (may be an enumerated list, "Dynamic", or empty). */
  options: string
  validation: string
  apiSource: string
  statusByForm: Record<SeiFormLetter, SeiFieldStatus>
  /** Per-form "Visible When" rule text (only present where authored). */
  visibleWhenByForm: Record<string, string>
  /** Stable id for React keys + state storage. */
  key: string
}

/** Canonical fieldType strings → control. Anything else is inferred. */
const CANONICAL_CONTROL: Record<string, SeiControl> = {
  'Free Form': 'text',
  'Free Form (Number)': 'number',
  'Lookup (Dropdown)': 'dropdown',
  'Lookup (Multi-Select Dropdown)': 'multiselect',
  Toggle: 'toggle',
  'Toggle (Checkbox)': 'checkbox',
  'Toggle or Dropdown': 'dropdown',
  'Radio Button List': 'radio',
  'Date Picker': 'date',
  'Option selection': 'dropdown',
  'Display Only': 'display',
  'Display Only (Progress Bar)': 'progress',
  'Search (Typeahead)': 'typeahead',
}

/**
 * ~75 of 247 rows carry a descriptive sentence in `fieldType` instead of a
 * canonical type. Infer a control from keywords, then from whether the field
 * has an options list, defaulting to a plain text input.
 */
function normalizeControl(fieldType: string, options: string): SeiControl {
  const canonical = CANONICAL_CONTROL[fieldType.trim()]
  if (canonical) return canonical
  const ft = fieldType.toLowerCase()
  if (/\bdate\b|date picker/.test(ft)) return 'date'
  if (/typeahead|elasticsearch|asset search|entity search/.test(ft)) return 'typeahead'
  if (/multi-select|checkbox group/.test(ft)) return 'multiselect'
  if (/dropdown|reference data|options loaded|select(ion)?\b|hierarchy/.test(ft)) return 'dropdown'
  if (/\btoggle\b|yes\/no|checkbox/.test(ft)) return 'toggle'
  if (/text area|free-text|free form/.test(ft)) return 'textarea'
  if (/amount|dollar|number|percent|bps|rate/.test(ft)) return 'number'
  if (options && options.trim() && options.trim().toLowerCase() !== 'n/a') return 'dropdown'
  return 'text'
}

/** Strip "(component, …)" annotations and trailing " - shown when…" notes. */
function cleanSectionLabel(section: string): string {
  let t = section.replace(/\([^)]*\)/g, '').trim()
  t = t.split(' - ')[0].trim()
  // Strip workbook section numbering / symbols so headers read cleanly:
  // "§1 Account Type…" → "Account Type…", "§11b–f Related Party…" → "Related Party…",
  // "4b. Beneficiary…" → "Beneficiary…", "6b Select Accounts…", "11c Trustee…".
  t = t.replace(/^§?\s*\d+[a-zA-Z]?(?:[–-][a-zA-Z])?\.?\s+/, '').trim()
  // Drop any stray leading section symbol that remained.
  t = t.replace(/^§\s*/, '').trim()
  // Collapse leftover double spaces from removed parentheticals.
  return t.replace(/\s{2,}/g, ' ').trim()
}

export const SEI_FORM_LETTERS: SeiFormLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

export const SEI_FIELDS: SeiField[] = (rawRegistry as RawSeiField[]).map((r) => ({
  section: r.section,
  sectionLabel: cleanSectionLabel(r.section),
  field: r.field,
  apiField: r.apiField,
  control: normalizeControl(r.fieldType, r.options),
  rawFieldType: r.fieldType,
  options: r.options,
  validation: r.validation,
  apiSource: r.apiSource,
  statusByForm: r.statusByForm as Record<SeiFormLetter, SeiFieldStatus>,
  visibleWhenByForm: r.visibleWhenByForm,
  key: `${r.section}|||${r.field}`,
}))

/** Distinct section headers in registry (render) order. */
export const SEI_SECTIONS: string[] = (() => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const f of SEI_FIELDS) {
    if (!seen.has(f.section)) {
      seen.add(f.section)
      out.push(f.section)
    }
  }
  return out
})()

/** Map raw section → cleaned label (first occurrence wins). */
export const SEI_SECTION_LABELS: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const f of SEI_FIELDS) if (!(f.section in m)) m[f.section] = f.sectionLabel
  return m
})()

const CONDITIONAL_STATUSES: ReadonlySet<SeiFieldStatus> = new Set([
  'Conditional',
  'Conditional - Display Only',
  'Conditional - Read Only',
])

export function isConditional(status: SeiFieldStatus): boolean {
  return CONDITIONAL_STATUSES.has(status)
}

export function isReadOnly(status: SeiFieldStatus): boolean {
  return (
    status === 'Display Only' ||
    status === 'Conditional - Display Only' ||
    status === 'Conditional - Read Only'
  )
}

export function isRequired(status: SeiFieldStatus): boolean {
  return status === 'Required'
}

/** Fields that are not Hidden on the given form, in registry order. */
export function fieldsForForm(letter: SeiFormLetter): SeiField[] {
  return SEI_FIELDS.filter((f) => f.statusByForm[letter] !== 'Hidden')
}
