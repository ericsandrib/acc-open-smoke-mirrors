# TODO: KYC Data Model

Work items needed before building out the KYC flow.

## Data model changes

- **Model individuals explicitly** — The current `RelatedParty` type represents household members but doesn't capture enough about each person. We need a richer individual model that can track identity, KYC status, and eligibility independently.
- **Track KYC eligibility per individual** — Not every household member needs KYC during onboarding. Some may have completed KYC through prior interactions with the firm. Each individual needs a flag or status indicating whether KYC is required for this journey.

## KYC flow design

- KYC spawns a **child action per eligible household member** (not for members who already have valid KYC)
- Each child action will simulate an **Equifax identity verification poll** (faked for the prototype — no real API call)
- The advisor or compliance officer reviews the result and marks it complete or flags issues

## Seed data updates

Update the dummy relationships to showcase a spread of KYC circumstances:

- **Household where no members need KYC** — all members have prior verified KYC
- **Household where some members need KYC** — e.g., primary is verified but spouse is new
- **Household where all members need KYC** — entirely new to the firm
