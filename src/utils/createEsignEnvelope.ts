import type { EsignEnvelope, EsignEnvelopeSigner, EnvelopeFormSelection } from '@/types/esignEnvelope'

export function createNewEnvelope(
  formSelections: EnvelopeFormSelection[],
  signers: EsignEnvelopeSigner[],
): EsignEnvelope {
  const createdAt = new Date().toISOString()
  return {
    id: `env-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    deliveryMethod: 'esignature',
    formSelections: formSelections.map((r) => ({ ...r })),
    optionalFormIdsIncluded: [],
    uploadedFiles: [],
    signers: signers.map((s) => ({ ...s, signingStatus: s.signingStatus ?? 'pending' })),
    createdAt,
    envelopeStatus: 'draft',
    history: [
      {
        id: `evt-${Date.now()}-created`,
        occurredAt: createdAt,
        source: 'advisor',
        eventType: 'envelope_status',
        envelopeStatus: 'draft',
        note: 'Envelope created',
      },
    ],
    sentToClient: false,
    clientSignaturesComplete: false,
  }
}
