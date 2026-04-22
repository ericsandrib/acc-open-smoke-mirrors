import type { EsignEnvelope } from '@/types/esignEnvelope'

export type EsignEnvelopeStatus = 'draft' | 'sent' | 'delivered' | 'completed' | 'declined' | 'canceled' | 'voided'

export function getEsignEnvelopeStatus(envelope: EsignEnvelope): EsignEnvelopeStatus {
  if (envelope.envelopeStatus) return envelope.envelopeStatus
  if (envelope.clientSignaturesComplete) return 'completed'
  if (envelope.sentToClient) return 'sent'
  return 'draft'
}

export const ESIGN_ENVELOPE_STATUS_LABELS: Record<EsignEnvelopeStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  delivered: 'Delivered',
  completed: 'Completed',
  declined: 'Declined',
  canceled: 'Canceled',
  voided: 'Voided',
}

