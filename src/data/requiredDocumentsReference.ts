/**
 * Static reference for required documents by:
 * - Registration / account type (`registrations.personal`, `registrations.entity`)
 * - Funding & transfers / asset movement (`assetMovement`)
 * - Account & service features (`accountFeatures`)
 * - Optional / situational bundles (`optionalForms`)
 *
 * Document audience (`categories`): end_client (investor/owner), firm (PAS/IBD),
 * custodian (Pershing on-platform; `pershingForm: true` on a doc), sponsor, government.
 */
import requiredDocumentsReferenceJson from './requiredDocumentsReference.json'

export const requiredDocumentsReference = requiredDocumentsReferenceJson

export type RequiredDocumentsReference = typeof requiredDocumentsReferenceJson
