/**
 * Builds src/data/pasRequiredDocuments.json in the PAS schema (registration_types arrays,
 * required_forms with index_code / esignature_platform / pershing_form, cip_requirements strings)
 * from src/data/requiredDocumentsReference.json (same source material as v8.9.2025 PAS matrix).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const ref = JSON.parse(readFileSync(join(root, 'src/data/requiredDocumentsReference.json'), 'utf8'))

/** @param {string} docId */
function docToForm(docId, conditional = null) {
  const d = ref.documents[docId]
  if (!d) return null
  let esignature_platform = 'NA'
  if (d.eSign?.eligible && d.eSign?.platforms?.length) {
    const p = d.eSign.platforms[0]
    esignature_platform = p === 'PASe-Sign' ? 'PAS_ESIGN' : p
  } else if (docId === 'TFRR') {
    esignature_platform = 'NetX360+_ACAT_ONLY'
  } else if (docId === 'PROC') {
    esignature_platform = 'NetX360+_ELECTRONIC_CHECKS_ONLY'
  }
  return {
    name: d.name,
    index_code: d.indexCode ?? null,
    esignature_platform,
    pershing_form: !!d.pershingForm,
    conditional,
  }
}

/** @param {string[]} docIds */
function docsToForms(docIds, conditionals = {}) {
  const out = []
  for (const id of docIds) {
    const f = docToForm(id, conditionals[id] ?? null)
    if (f) out.push(f)
  }
  return out
}

function cipFromEntry(entry) {
  const lines = []
  if (Array.isArray(entry.cipRequirements)) {
    for (const id of entry.cipRequirements) {
      const doc = ref.documents[id]
      lines.push(doc ? doc.name : id)
    }
  } else if (entry.cipRequirements && typeof entry.cipRequirements === 'object') {
    const o = entry.cipRequirements
    if (o.oneOf) {
      lines.push(`${o.note}: ${o.oneOf.join('; ')}`)
    }
  }
  if (entry.cipNotes) lines.push(entry.cipNotes)
  return lines
}

function personalEntry(pasId, key) {
  const reg = ref.registrations.personal[key]
  if (!reg) throw new Error(`Missing personal registration: ${key}`)
  const forms = docsToForms(reg.requiredDocuments ?? [])
  if (reg.conditionalDocuments) {
    for (const c of reg.conditionalDocuments) {
      const f = docToForm(c.documentId, c.condition)
      if (f) forms.push(f)
    }
  }
  return {
    id: pasId,
    label: reg.label.replace(/\s*\(IND\)\s*|\s*\(JT\)\s*/g, '').trim(),
    category: 'personal',
    required_forms: forms,
    cip_requirements: cipFromEntry(reg),
    notes: reg.notes ?? null,
  }
}

function entityEntry(pasId, key) {
  const reg = ref.registrations.entity[key]
  if (!reg) throw new Error(`Missing entity registration: ${key}`)
  const forms = docsToForms(reg.requiredDocuments ?? [])
  if (reg.conditionalDocuments) {
    for (const c of reg.conditionalDocuments) {
      const f = docToForm(c.documentId, c.condition)
      if (f) forms.push(f)
    }
  }
  return {
    id: pasId,
    label: reg.label,
    category: 'entity',
    required_forms: forms,
    cip_requirements: cipFromEntry(reg),
    notes: reg.notes ?? null,
  }
}

const personal_accounts = [
  personalEntry('IND', 'individual'),
  personalEntry('JT', 'joint'),
  personalEntry('TOD_IND', 'transferOnDeathIndividual'),
  personalEntry('TOD_JT', 'transferOnDeathJoint'),
  personalEntry('IRA', 'traditionalIRA'),
  personalEntry('ROTH_IRA', 'rothIRA'),
  personalEntry('SEP_IRA', 'sepIRA'),
  personalEntry('SIMPLE_5304_IRA', 'simple5304IRA'),
  personalEntry('INHERITED_IRA', 'inheritedIRA'),
  personalEntry('INHERITED_ROTH_IRA', 'inheritedRothIRA'),
  personalEntry('GUARDIAN_IRA', 'guardianIRA'),
  personalEntry('UTMA_UGMA', 'utmaUgma'),
  personalEntry('GUARDIAN', 'guardian'),
  personalEntry('529_ON_PLATFORM', '529OnPlatform'),
  personalEntry('529_OFF_PLATFORM', '529OffPlatform'),
  personalEntry('ADVISORY_ON_PLATFORM_PERSONAL', 'advisoryOnPlatform'),
  personalEntry('ADVISORY_OFF_PLATFORM_PERSONAL', 'advisoryOffPlatform'),
  personalEntry('BROKERAGE_OFF_PLATFORM', 'brokerageOffPlatform'),
  personalEntry('VUL_OFF_PLATFORM', 'vulOffPlatform'),
  personalEntry('OFF_PLATFORM_COB_PERSONAL', 'offPlatformChangeOfBrokerDealer'),
]

const entity_accounts = [
  entityEntry('TRUST', 'trust'),
  entityEntry('ESTATE', 'estate'),
  entityEntry('LLC', 'llc'),
  entityEntry('CAPTIVE_INSURANCE', 'captiveInsurance'),
  entityEntry('CORPORATION', 'corporation'),
  entityEntry('PARTNERSHIP', 'partnership'),
  entityEntry('NON_PROFIT', 'nonProfitOrganization'),
  entityEntry('SOLE_PROPRIETORSHIP', 'soleProprietorship'),
  entityEntry('CORP_PENSION_PROFIT_SHARING_401K', 'corporatePensionProfitSharing'),
  entityEntry('NON_QUALIFIED_DEFERRED_COMP', 'nonQualifiedDeferredComp'),
  entityEntry('INDIVIDUAL_401K_ASCENSUS', 'individual401kSuperSimplified'),
  entityEntry('THIRD_PARTY_CUSTODIAN_ERISA_QRP', 'thirdPartyCustodianERISA'),
  entityEntry('ADVISORY_ON_PLATFORM_ENTITY', 'advisoryOnPlatformEntity'),
  entityEntry('ADVISORY_OFF_PLATFORM_ENTITY', 'advisoryOffPlatformEntity'),
  entityEntry('OFF_PLATFORM_COB_ENTITY', 'offPlatformChangeOfBrokerDealerEntity'),
]

function featureToForms(movementKey) {
  const m = ref.assetMovement[movementKey]
  const forms = docsToForms(m.requiredDocuments ?? [])
  if (m.conditionalDocuments) {
    for (const c of m.conditionalDocuments) {
      const f = docToForm(c.documentId, c.condition)
      if (f) forms.push(f)
    }
  }
  return forms
}

const asset_movements = [
  {
    id: 'ACCOUNT_TRANSFERS',
    label: ref.assetMovement.accountTransfersACAT.label,
    category: 'asset_movement',
    required_forms: featureToForms('accountTransfersACAT'),
    notes: ref.assetMovement.accountTransfersACAT.notes ?? null,
  },
  {
    id: 'STANDING_ACH',
    label: ref.assetMovement.standingACHInstructions.label,
    category: 'asset_movement',
    required_forms: featureToForms('standingACHInstructions'),
    notes: ref.assetMovement.standingACHInstructions.notes ?? null,
  },
  {
    id: 'ADHOC_1ST_PARTY_WIRES',
    label: ref.assetMovement.adHocFirstPartyWires.label,
    category: 'asset_movement',
    required_forms: featureToForms('adHocFirstPartyWires'),
    notes: null,
  },
  {
    id: '3RD_PARTY_WIRES',
    label: ref.assetMovement.thirdPartyWires.label,
    category: 'asset_movement',
    required_forms: featureToForms('thirdPartyWires'),
    notes: null,
  },
  {
    id: 'JOURNALS_DIFF_TAX',
    label: ref.assetMovement.journalsDifferentTaxIdRegistration.label,
    category: 'asset_movement',
    required_forms: featureToForms('journalsDifferentTaxIdRegistration'),
    notes: null,
  },
  {
    id: 'STANDING_PERIODIC_WIRES',
    label: ref.assetMovement.standingPeriodicWireInstructions.label,
    category: 'asset_movement',
    required_forms: featureToForms('standingPeriodicWireInstructions'),
    notes: null,
  },
  {
    id: 'IRA_DISTRIBUTIONS',
    label: ref.assetMovement.iraDistributions.label,
    category: 'asset_movement',
    required_forms: featureToForms('iraDistributions'),
    notes: null,
  },
  {
    id: 'QUALIFIED_PLAN_DISTRIBUTIONS',
    label: ref.assetMovement.qualifiedPlanDistributions.label,
    category: 'asset_movement',
    required_forms: featureToForms('qualifiedPlanDistributions'),
    notes: null,
  },
]

const account_features_services = [
  {
    id: 'CORESTONE_CHECKING',
    label: ref.accountFeatures.corestoneCheckingAccounts.label,
    category: 'feature',
    required_forms: docsToForms(ref.accountFeatures.corestoneCheckingAccounts.requiredDocuments ?? []),
    notes: ref.accountFeatures.corestoneCheckingAccounts.notes ?? null,
  },
  {
    id: 'EDELIVERY',
    label: ref.accountFeatures.eDelivery.label,
    category: 'feature',
    required_forms: docsToForms(ref.accountFeatures.eDelivery.requiredDocuments ?? []),
    notes: null,
  },
  {
    id: 'MARGIN',
    label: ref.accountFeatures.margin.label,
    category: 'feature',
    required_forms: docsToForms(ref.accountFeatures.margin.requiredDocuments ?? []),
    notes: ref.accountFeatures.margin.notes ?? null,
  },
  {
    id: 'OPTIONS',
    label: ref.accountFeatures.options.label,
    category: 'feature',
    required_forms: docsToForms(ref.accountFeatures.options.requiredDocuments ?? []),
    notes: ref.accountFeatures.options.notes ?? null,
  },
  {
    id: 'SELECTLINK',
    label: ref.accountFeatures.selectLinkStatementConsolidation.label,
    category: 'feature',
    required_forms: docsToForms(ref.accountFeatures.selectLinkStatementConsolidation.requiredDocuments ?? []),
    notes: null,
  },
  {
    id: 'ALTERNATIVE_STRATEGY',
    label: ref.accountFeatures.alternativeStrategySelection.label,
    category: 'feature',
    required_forms: docsToForms(ref.accountFeatures.alternativeStrategySelection.requiredDocuments ?? []),
    notes: null,
  },
]

const optional_forms = [
  {
    id: 'ADVISORY_ON_PLATFORM_OPTIONAL',
    label: ref.optionalForms.advisoryOnPlatform.label,
    category: 'optional',
    required_forms: docsToForms(ref.optionalForms.advisoryOnPlatform.documents ?? []),
    notes: null,
  },
  {
    id: 'ADVISORY_OFF_PLATFORM_OPTIONAL',
    label: ref.optionalForms.advisoryOffPlatform.label,
    category: 'optional',
    required_forms: docsToForms(ref.optionalForms.advisoryOffPlatform.documents ?? []),
    notes: null,
  },
  {
    id: 'POWER_OF_ATTORNEY',
    label: ref.optionalForms.powerOfAttorney.label,
    category: 'optional',
    required_forms: [],
    cip_requirements: (ref.optionalForms.powerOfAttorney.cipRequirements ?? []).map(
      (id) => ref.documents[id]?.name ?? id,
    ),
    notes: ref.optionalForms.powerOfAttorney.notes ?? null,
  },
  {
    id: 'CHECK_IMAGE',
    label: ref.optionalForms.checkImage.label,
    category: 'optional',
    required_forms: docsToForms(ref.optionalForms.checkImage.documents ?? []),
    notes: null,
  },
  {
    id: 'NAME_CHANGE',
    label: ref.optionalForms.nameChange.label,
    category: 'optional',
    required_forms: docsToForms(ref.optionalForms.nameChange.documents ?? []),
    cip_requirements: (ref.optionalForms.nameChange.cipRequirements ?? []).map(
      (id) => ref.documents[id]?.name ?? id,
    ),
    notes: null,
  },
  {
    id: 'CHANGE_OF_RR_IAR',
    label: ref.optionalForms.changeOfRRIAR.label,
    category: 'optional',
    required_forms: docsToForms(ref.optionalForms.changeOfRRIAR.documents ?? []),
    notes: ref.optionalForms.changeOfRRIAR.notes ?? null,
  },
  {
    id: 'ANNUITY_APPLICATION',
    label: ref.optionalForms.annuityApplication.label,
    category: 'optional',
    required_forms: docsToForms(ref.optionalForms.annuityApplication.documents ?? []),
    notes: ref.optionalForms.annuityApplication.notes ?? null,
  },
  {
    id: 'EOI_SUITABILITY',
    label: ref.optionalForms.eoiSuitabilityQuestionnaire.label,
    category: 'optional',
    required_forms: docsToForms(ref.optionalForms.eoiSuitabilityQuestionnaire.documents ?? []),
    notes: null,
  },
  {
    id: 'REQUEST_TO_EXCHANGE',
    label: ref.optionalForms.requestToExchangeInvestments.label,
    category: 'optional',
    required_forms: docsToForms(ref.optionalForms.requestToExchangeInvestments.documents ?? []),
    notes: ref.optionalForms.requestToExchangeInvestments.notes ?? null,
  },
]

const global = ref.registrations.personal._allPersonalAccounts

const out = {
  source: 'Park Avenue Securities – Account Opening: Required Documents, Index Codes & Identification Requirements',
  version: ref.version ?? '8.9.2025',
  notes: [
    'Additional identification requirements may be requested if the client cannot be identified by the listed methods.',
    'Failure to upload/complete required forms and CIP requirements will delay account opening.',
    'NetX360+ offers integrated e-Signature solutions via DocuSign and SIGNiX. Alternatively, the PAS e-Sign tool on GOL can be utilized.',
    'Pershing form required for on-platform accounts only. Off-platform accounts only require sponsor paperwork.',
  ],
  global_requirements: {
    description: global?.label ?? 'Required for ALL personal accounts regardless of registration type',
    forms: docsToForms(global?.requiredDocuments ?? ['NAW9']),
  },
  registration_types: {
    personal_accounts,
    entity_accounts,
    asset_movements,
    account_features_services,
    optional_forms,
  },
  esignature_platform_legend: {
    'NetX360+': 'Pershing NetX360+ integrated e-Signature (DocuSign or SIGNiX)',
    PAS_ESIGN: 'PAS e-Sign tool on GOL',
    NA: 'No e-Signature platform; physical/manual processing required',
    NOT_ELIGIBLE: 'Not eligible for e-Signature',
    'NetX360+_ACAT_ONLY': 'NetX360+ e-Sign for ACAT transfers only',
    'NetX360+_ELECTRONIC_CHECKS_ONLY': 'NetX360+ e-Sign for electronic checks only',
  },
}

const outPath = join(root, 'src/data/pasRequiredDocuments.json')
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log('Wrote', outPath)
