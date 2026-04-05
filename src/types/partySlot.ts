/** Reusable slot rows for party pickers (owners, interested parties, beneficiaries). */
export type PartySlotBase = {
  id: string
  partyId?: string
}

export type InterestedPartySlot = PartySlotBase & {
  relationshipToAccount?: string
  receiveDuplicateStatements?: boolean
}

export type BeneficiarySlot = PartySlotBase & {
  designationType?: string
  allocationPercent?: string
  perStirpes?: boolean
}
