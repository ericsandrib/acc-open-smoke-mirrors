# Spec 010: Zions Meetings — Maturity Build-out (full slate)

> **Branch:** `zions-poc` · **Status:** In Progress · **Owner:** Eric Sandrib
> Builds on Spec 009. Goal: show the **full slate** of Avantos meeting-AI capabilities in the
> POC — close every gap between the live build and the planning docs, and fix the
> inconsistencies that undercut a "mature" demo.

## Source of truth (2026-06-05)
Adversarial audit of the live build vs. the Notion "Meetings page roadmap info" synthesis
(6 docs: *Mercer Meeting List page Updates · PRD: Meeting List View · meetings-detail-page ·
Avantos + Mercer Product Review (June 2) · AI meeting page template · Meetings Components with
update*) + Spec 009. Smoke & mirrors only — no backend, scripted AI, Zions navy `#0b4f9c`.

## Audit verdict
**Strong:** list/dashboard, 4-tab detail, 6 lifecycle states, AI summary+approve, guided email,
action suggestions→servicing, referral/moments-of-delight, life events, topics, prep report, chat.
**Gaps/inconsistencies drive the phases below.**

## P0 — Credibility base (one coherent, consistent, no-dead-ends world)
- **P0.1 Seed reconcile.** Home dashboard ↔ meetings module: Whitmore review 11:00→9:00 AM,
  "6/1 review"→"6/5", dashboard date→Fri Jun 5; make the Meetings widget link to the meeting +
  show the live Nakamura row; tie the meeting's headline referral (Carol) into Growth.
- **P0.2 Vendor identity.** Per-vendor icons (Teams/Zoom/Meet/Phone/In-person) + real vendor on
  list cards (today every card says "Video call").
- **P0.3 Meeting-aware Ask Anything.** Route scripted replies by meeting/relationship; add
  Nakamura + Cedar Falls reply sets so off-Whitmore meetings don't return Whitmore answers.
- **P0.4 Spread the AI bundle.** Give Nakamura (live + a historical) and Cedar Falls real
  summary/topics/actions so clicking any meeting isn't empty.

## P1 — Headline capabilities (the full slate, visible)
- **P1.1 Summary custom modifiers** — parity with the email Refine menu (shorten/expand/formal/
  de-jargon/regenerate), scripted.
- **P1.2 "Edited since AI" treatment** — badge flips to "AI draft · edited by you" on edit +
  restore-to-original (June 2 decision: clearer AI-content treatment, esp. after edits).
- **P1.3 Live notetaker / streaming transcript** — notetaker-joined + consent chip + streaming
  partial transcript for the live Nakamura meeting.
- **P1.4 Inline Prep Report** — render on the Prep tab (not just modal), keep citations, add
  "push recommended agenda → summary/notes".
- **P1.5 "No relationship connected" state** — bolder list + detail treatment (Mercer headline
  delta) + a seed meeting with no relationship + a connect affordance.
- **P1.6 List quick-preview slide-over** — peek summary/email/actions from the list without full
  nav (PRD: Meeting List View sidebar flow).

## P2 — Depth & polish
- **P2.1 Advisor Coach** — post-meeting coaching (talk-ratio, discovery questions, follow-up
  discipline), labeled Roadmap.
- **P2.2 Relationship Detail → Communications tab** embeds the meeting comms timeline.
- **P2.3 Recording consent + retention controls** in the detail/sidebar.
- **P2.4 Global meeting search** + declined/maybe card states + hover-popover keyboard a11y.

## QA / demo
- `pnpm build` clean each tier; click every new surface in preview; console clean; demo-ready.

## Non-goals
- Real LLM/backend, real calendar ingestion (Outlook/MS Graph deferred per Mercer List doc),
  direct email send, pixel-match to Mercer Figma.
