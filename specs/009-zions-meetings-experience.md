# Spec 009: Zions Meetings — End-to-End Meeting Assistant

> **Branch:** `zions-poc` · **Status:** In Progress · **Owner:** Eric Sandrib
> Builds on Spec 007 Phase 6 (faithful Meeting Assistant port). Grounded in the live
> Avantos Agent Portal meetings module shipped to **Mercer** prod (June 9 & June 23, 2026)
> plus the **roadmap** (Nick Evans / Petar Stojanovic / Phạm Long).

## Source of truth (research, 2026-06-05)
- **Detail-page PRD** — Notion `meetings-detail-page` (Agent Portal PRDs). 4 tabs (Prep · Summary ·
  Actions · Email), page lifecycle states, right sidebar panels, Aspen AI chat, guided email send.
- **Meeting list/dashboard** — Figma `igmnmCKsqrbaUzOke2uedA` "[Documentation] Meeting Dashboard (Gabby)".
  Filters (Coming Up / This / Next / Last Week · Date), relationship search (All / My / Non-Relationship),
  My/All toggle, day-grouped list, accent bar by RSVP, vendor icons, hover popover, Live meeting Join/Copy,
  declined/maybe/non-attendee states, organizer.
- **Roadmap (Product Roadmap DB):** Pre-Meeting Prep Report (6 topics), Identify Referrals & Moments of
  Delight, Detect Life Events, Identify Topics Discussed, Custom Modifiers for Email & Summary, Advisor Coach.

Smoke & mirrors: no backend, scripted AI, all data seeded for Zions (Whitmore household, City of Cedar
Falls muni trust, Nakamura). Visual = Zions design system (shadcn/Radix, navy `#0b4f9c`), NOT Mercer's reshaped UI.

## Phase 1 — Data model + seed  ✅ foundation
- Extend `Meeting` (lifecycle, vendor, meetingLink, location, organizer, participants w/ RSVP+email+phone,
  meetingType, isAttendee, prepNotes/prepStatus, email, prepReport, referralMoments, lifeEvents, topics).
- New types: `Participant`, `MeetingEmail`, `PrepReport`/`PrepReportSection`, `ReferralMoment`, `LifeEvent`, `MeetingTopic`.
- Expand seed: richer Whitmore (live/ended w/ full AI bundle), upcoming meeting (prep-report demo),
  in-person muni meeting, non-attendee + declined examples.
- Store: prepNotes + emails state and mutations; thumbs feedback (local).

## Phase 2 — Meeting list (dashboard)
- Header + filter row (Coming Up window, relationship filter, My/All toggle).
- Day-grouped list; `MeetingListItem` (accent bar by RSVP, vendor icon, type, relationship chip, time,
  attendee count); Live badge + Copy + Join; hover popover (date/organizer/participants/RSVP/quick actions);
  status chips (Summary ready / Approved / New); non-attendee muted + external arrow.

## Phase 3 — Meeting detail shell
- Header (title, type chip, date/time, "Now" indicator, lifecycle).
- Tabs Prep · Summary · Actions · Email with status indicators + "New" badges.
- Right sidebar (tabbed): **Details** (relationship, date/time, inline-editable meeting link, Join/Call/View
  Map, organizer, participants w/ copy + RSVP, link to Prep Report) · **Transcript** · **Comments**.
- Aspen-style "Ask Anything" chat (existing) stays meeting-aware.

## Phase 4 — Tabs
- **Prep:** internal-use rich-text notes + Pre-Meeting Prep Report card.
- **Summary:** AITextEditor + AI badge + helper-text states + thumbs + transcript-link banner (no-recording)
  + generating state; Topics-discussed chips; Life-events callout.
- **Actions:** existing 3 sections (linked / AI suggestions / other) + **Referral Opportunities & Moments of Delight**.
- **Email:** subject/To/CC + AITextEditor body + AI badge/disclaimer + tone modifiers + Skip/Restore +
  4-step Guided Send + mail status.

## Phase 5 — Pre-Meeting Prep Report (roadmap headline)
- Structured report: Meeting History & Key Themes · Client Profile · Relationship Profile · Servicing
  Productivity · Financial Overview · Recommended Discussion Topics. Highlights + evidence citations.
  "Generated Monday of meeting week · emailed to advisor" framing. Opens from Prep tab + sidebar.

## Phase 6 — AI surfaces / scripted chat
- Extend `chatScript` with referral detection, pre-meeting prep, life events, Zions prompts.

## QA / demo
- `pnpm build` clean; click every tab + list filter + guided send + prep report + chat; demo-ready for Zions.

## Non-goals
- Real LLM/back end, direct email send (copy-paste preserves formatting, per PRD), pixel-match to Mercer Figma.
