import { useMemo } from 'react'
import {
  SEI_FIELDS,
  SEI_SECTIONS,
  SEI_SECTION_LABELS,
  type SeiField,
  type SeiFormLetter,
} from '@/data/sei/seiRegistry'
import { evaluateField, SEI_PARTY_TOGGLES, type SeiState } from '@/data/sei/seiConditionRules'
import { SchwabSection, SchwabSingleCheckbox } from '../schwab/schwabPrimitives'
import { SeiFieldRenderer } from './SeiFieldRenderer'
import { useSeiFormState } from './useSeiFormState'

interface Props {
  childId: string
  letter: SeiFormLetter
}

type PartyKind = 'trustee' | 'custodian' | 'employer'

const PARTY_META: Record<PartyKind, { label: string; toggleKey: string; match: RegExp }> = {
  trustee: { label: 'Add a Trustee', toggleKey: SEI_PARTY_TOGGLES.addTrustee, match: /trustee/i },
  custodian: { label: 'Add a Custodian', toggleKey: SEI_PARTY_TOGGLES.addCustodian, match: /custodian/i },
  employer: { label: 'Add an Employer', toggleKey: SEI_PARTY_TOGGLES.addEmployer, match: /employer/i },
}

const SELECTION_SECTION_RE = /related parties.*selection|§11 related parties/i

/**
 * Forms whose primary owner is a natural person — their owner identity, address
 * and contact are already captured by the shared Owners picker + client-info, so
 * we suppress those sections here to avoid duplicate data entry. Entity forms
 * (H Trust, I/J Organization) keep §2 because it holds genuine entity detail
 * (Trust Name, Org Name, EIN) that is not captured upstream.
 */
const PERSON_OWNER_FORMS = new Set<SeiFormLetter>(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
const OWNER_IDENTITY_SECTIONS = new Set<string>([
  '§2 Primary Owner / Entity Detail',
  'Legal Address',
  'Mailing Address',
  'Contact Information',
])

// The §1 header section is mostly account-level (Account Type, Advisor, Office —
// kept). It also carries an inline "create the primary owner" cluster
// (Entity Search + name fields) that duplicates the Owners picker. NOTE: §1 also
// holds a §11a related-party create cluster that REUSES the same field names
// (First Name, Last Name, Suffix…) for a *different* person (e.g. a trustee) —
// that one stays. We tell them apart by the visibility condition: the
// related-party cluster's condition references "§11a / Related Party / party type".
const SECTION1_PRIMARY_OWNER_FIELDS = new Set<string>([
  'Entity Search (Primary Owner)',
  'First Name',
  'Middle Name (MI)',
  'Last Name',
  'Suffix',
])

function isRelatedPartyCondition(visibleWhen: string): boolean {
  const v = visibleWhen.toLowerCase()
  return v.includes('§11a') || v.includes('related part') || v.includes('party type')
}

function isDuplicateOwnerField(field: SeiField, letter: SeiFormLetter): boolean {
  if (!PERSON_OWNER_FORMS.has(letter)) return false
  if (OWNER_IDENTITY_SECTIONS.has(field.section)) return true
  if (
    field.section.startsWith('§1') &&
    SECTION1_PRIMARY_OWNER_FIELDS.has(field.field) &&
    !isRelatedPartyCondition(field.visibleWhenByForm[letter] ?? '')
  ) {
    return true
  }
  return false
}

export function SeiDynamicForm({ childId, letter }: Props) {
  const form = useSeiFormState(childId)
  const ctx = { state: form.data as SeiState, letter }

  // Which §11 party blocks exist (not all Hidden) on this form?
  const availableParties = useMemo<PartyKind[]>(() => {
    const kinds: PartyKind[] = []
    for (const kind of ['trustee', 'custodian', 'employer'] as PartyKind[]) {
      // Only offer the add-toggle where the block is actually gated by §11a
      // selection (status ◯/○). Forms where it is mandatory (e.g. Trustee on a
      // Trust) render it unconditionally and need no toggle.
      const has = SEI_FIELDS.some(
        (f) =>
          PARTY_META[kind].match.test(f.section) &&
          f.statusByForm[letter] !== 'Hidden' &&
          /user adds this party type|related party selection/i.test(f.visibleWhenByForm[letter] ?? ''),
      )
      if (has) kinds.push(kind)
    }
    return kinds
  }, [letter])

  // Group visible fields by section, in registry order.
  const groups = useMemo(() => {
    const bySection = new Map<string, Array<{ field: SeiField; readOnly: boolean }>>()
    for (const field of SEI_FIELDS) {
      if (field.statusByForm[letter] === 'Hidden') continue
      if (isDuplicateOwnerField(field, letter)) continue
      const vis = evaluateField(field, ctx)
      if (!vis.visible) continue
      const arr = bySection.get(field.section) ?? []
      arr.push({ field, readOnly: vis.readOnly })
      bySection.set(field.section, arr)
    }
    return SEI_SECTIONS.filter((s) => bySection.has(s)).map((s) => ({
      section: s,
      label: SEI_SECTION_LABELS[s] ?? s,
      fields: bySection.get(s)!,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter, JSON.stringify(form.data)])

  return (
    <div className="space-y-2">
      {groups.map((g) => {
        const isSelectionSection = SELECTION_SECTION_RE.test(g.section)
        return (
          <SchwabSection key={g.section} title={g.label}>
            {/* §11a Related-Party selection toggles reveal the optional party blocks. */}
            {isSelectionSection && availableParties.length > 0 ? (
              <div className="mb-2 space-y-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Add related parties to this account
                </div>
                {availableParties.map((kind) => (
                  <SchwabSingleCheckbox
                    key={kind}
                    label={PARTY_META[kind].label}
                    checked={form.getBool(PARTY_META[kind].toggleKey)}
                    onChange={(v) => form.set(PARTY_META[kind].toggleKey, v)}
                  />
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.fields.map(({ field, readOnly }) => (
                <SeiFieldRenderer
                  key={field.key}
                  field={field}
                  status={field.statusByForm[letter]}
                  readOnly={readOnly}
                  form={form}
                />
              ))}
            </div>
          </SchwabSection>
        )
      })}
    </div>
  )
}
