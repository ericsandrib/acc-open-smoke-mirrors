import type { EsignEnvelope, EsignEnvelopeSigner, EnvelopeFormSelection } from '@/types/esignEnvelope'

export function createNewEnvelope(
  formSelections: EnvelopeFormSelection[],
  signers: EsignEnvelopeSigner[],
): EsignEnvelope {
  return {
    id: `env-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    deliveryMethod: 'esignature',
    formSelections: formSelections.map((r) => ({ ...r })),
    optionalFormIdsIncluded: [],
    uploadedFiles: [],
    signers: signers.map((s) => ({ ...s })),
    createdAt: new Date().toISOString(),
    sentToClient: false,
    clientSignaturesComplete: false,
  }
}
