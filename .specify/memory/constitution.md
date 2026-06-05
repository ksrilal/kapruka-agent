<!--
SYNC IMPACT REPORT
==================
Version change: [UNVERSIONED] → 1.0.0
Bump rationale: MAJOR — initial constitution authoring; all principles and sections created from scratch.

Modified principles: N/A (first-time population)

Added sections:
  - Core Principles (10 principles)
  - Technical Standards
  - Quality Gates
  - Governance

Removed sections: N/A

Template propagation status:
  - .specify/templates/plan-template.md    ✅ Constitution Check section aligned
  - .specify/templates/spec-template.md    ✅ Responsive design + typed API requirements reflected
  - .specify/templates/tasks-template.md   ✅ Task phases align with principle-driven categories
  - .specify/templates/checklist-template.md ✅ No changes required; generic structure is compatible

Deferred TODOs: None
-->

# Kiyo Shopping Agent Constitution

## Core Principles

### I. User Experience First

Every decision — architectural, visual, interaction, or technical — MUST prioritise the end-user
experience above engineering convenience or feature volume. Features that degrade user experience
MUST NOT ship, regardless of implementation completeness.

- The primary metric for any feature is whether it makes the shopper's journey faster, clearer,
  or more delightful.
- Friction MUST be minimised at every step: product discovery, cart management, checkout, and
  post-purchase support.
- User feedback and usability signals MUST inform iteration priority.

### II. Mobile-First Design

All UI and interaction design MUST begin from the smallest supported viewport (≥ 320 px) and
scale upward. Desktop layouts are enhancements, not the baseline.

- Every component MUST be touch-optimised: tap targets ≥ 44 × 44 px, swipe gestures where
  natural, no hover-only interactions.
- CSS breakpoints MUST follow a mobile-first cascade (`min-width` queries, not `max-width`).
- Performance budgets (see Principle IX) MUST be validated on mid-range mobile hardware.

### III. Visual Shopping Experience

The interface MUST lead with imagery, product cards, and visual cues. Text-heavy walls of content
are prohibited in primary shopping flows.

- Product listings MUST display high-quality images as the dominant element.
- AI-generated responses that include products MUST render rich cards (image, price, rating, CTA),
  not plain text lists.
- Visual hierarchy MUST guide the user from discovery → detail → action without explicit
  instruction.
- Loading states MUST use skeleton screens, not spinner-only placeholders.

### IV. Conversational Commerce

The agent interaction model MUST feel like a knowledgeable, friendly sales assistant — not a
search box or a chatbot FAQ. Every conversation turn MUST move the user closer to a purchase
decision or a resolved query.

- Responses MUST be concise and action-oriented; verbose explanations MUST be collapsed behind
  progressive disclosure.
- The agent MUST proactively suggest related products, offers, and alternatives when appropriate.
- Conversation context MUST be preserved across turns within a session.
- The agent MUST gracefully handle ambiguous queries with clarifying questions rather than
  returning empty results.

### V. Accessibility and Inclusiveness

The application MUST meet WCAG 2.1 AA compliance as a minimum. No feature is complete until it
is accessible.

- All interactive elements MUST have keyboard focus management and visible focus indicators.
- All images MUST have descriptive `alt` text; decorative images MUST use `alt=""`.
- Colour contrast ratios MUST meet AA thresholds (4.5:1 for normal text, 3:1 for large text).
- Screen-reader semantics MUST be validated with at least one assistive technology (NVDA, JAWS,
  or VoiceOver) before a feature ships.
- Font sizes MUST be relative (`rem`/`em`) to respect user browser preferences.

### VI. Sinhala, English, and Tanglish Support

The application MUST support trilingual content across all user-facing strings: English, Sinhala
(Unicode, Sinhalese script), and Tanglish (Tamil written in Latin script).

- All UI strings MUST be externalised into i18n resource files; no hard-coded display text in
  components.
- The active locale MUST be persisted per user session and respected across page navigations.
- Sinhala rendering MUST be validated with correct Unicode normalisation (NFC) and a supported
  web font (e.g., Noto Sans Sinhala).
- RTL layout is not required for current supported locales but the component architecture MUST
  not preclude future RTL addition.
- AI-generated content (Gemini API responses) MUST be prompted and validated to return
  language-appropriate text for the active locale.

### VII. Production-Quality Code

All committed code MUST meet production standards. Prototype-quality, commented-out blocks, or
`TODO`-heavy code MUST NOT be merged to main.

- TypeScript strict mode (`"strict": true`) is mandatory across the entire codebase.
- No `any` type escapes without an explicit, approved justification comment.
- ESLint and Prettier rules MUST pass with zero warnings in CI.
- Code MUST be reviewed before merge; self-merges to main are prohibited.
- Secrets, API keys, and credentials MUST NEVER be committed; `.env.local` is gitignored by
  default and MUST remain so.

### VIII. Type Safety and Maintainability

Strong typing is the primary mechanism for preventing runtime errors and ensuring long-term
maintainability. Every public API boundary — internal or external — MUST be fully typed.

- All Kapruka MCP tool call payloads and responses MUST have TypeScript interfaces generated
  or maintained in a shared `types/` directory.
- All Gemini API request/response shapes MUST be typed; use Zod schemas for runtime validation
  at API boundaries.
- Component props MUST be fully typed; no implicit `any` from missing type annotations.
- Utility functions with non-trivial logic MUST have JSDoc-level descriptions of parameters and
  return types.
- Avoid type assertions (`as`) unless provably safe; prefer type guards.

### IX. Performance Optimization

The application MUST deliver a fast, smooth experience. Performance is a feature, not an
afterthought.

- Core Web Vitals targets (production):
  - **LCP** ≤ 2.5 s on 4G mobile
  - **INP** ≤ 200 ms
  - **CLS** ≤ 0.1
- Images MUST use Next.js `<Image>` with appropriate `sizes` and `priority` attributes.
- AI/MCP API calls MUST be streamed where possible to minimise perceived latency.
- Route segments MUST use Next.js `loading.tsx` and React Suspense boundaries.
- Third-party scripts MUST be loaded with `next/script` strategy `lazyOnload` unless
  render-critical.
- Bundle size MUST be monitored via Next.js bundle analyser; no unreviewed dependency addition
  that increases the main bundle by > 50 kB (gzipped).

### X. Reusable Component Architecture

UI components MUST be designed for reuse across features before being written for a single
feature. Component duplication is a defect.

- Primitive components (Button, Input, Badge, Card, etc.) MUST be sourced from shadcn/ui and
  extended via Tailwind variants — never rebuilt from scratch.
- Feature-level components MUST be decomposed into `ui/` (presentational) and container
  (data-fetching) layers.
- Shared components MUST live in `src/components/` and be documented with a usage example in
  their file.
- A new component that duplicates an existing one's purpose MUST replace or extend the existing
  one, not coexist with it.
- Design tokens (colours, spacing, typography) MUST flow through `tailwind.config.ts` theme
  extension; inline magic values are prohibited.

## Technical Standards

The following technologies are mandatory. Deviations require explicit constitution amendment.

| Concern           | Mandated Technology      |
| ----------------- | ------------------------ |
| Framework         | Next.js (App Router)     |
| Language          | TypeScript (strict mode) |
| Styling           | Tailwind CSS             |
| Component Library | shadcn/ui                |
| AI Provider       | Gemini API               |
| Commerce Data     | Kapruka MCP              |

**Mandatory rules for every feature:**

- Every feature MUST support responsive design across mobile (≥ 320 px), tablet (≥ 768 px),
  and desktop (≥ 1280 px) viewports.
- Every API interaction (Gemini, Kapruka MCP, internal route handlers) MUST be strongly typed
  end-to-end using TypeScript interfaces or Zod schemas.
- Every feature MUST implement error handling: user-visible error states, fallback UI, and
  server-side error logging. Silent failures are prohibited.

## Quality Gates

The following gates MUST pass before any feature branch is merged to main:

1. **Type check**: `tsc --noEmit` exits with code 0.
2. **Lint**: ESLint exits with zero errors and zero warnings.
3. **Format**: Prettier check passes on all staged files.
4. **Responsive validation**: Feature tested at 375 px, 768 px, and 1280 px widths.
5. **Accessibility audit**: Axe or Lighthouse accessibility score ≥ 90 on primary user flows.
6. **i18n coverage**: All new UI strings present in all three locale files (en, si, ta-Latn).
7. **Error states**: All async operations have a visible error and loading state.
8. **Performance**: Lighthouse Performance score ≥ 80 on mobile simulation.

## Governance

- This constitution supersedes all other practices, style guides, and informal agreements.
- **Amendment procedure**: Any principle change MUST be proposed as a pull request updating this
  file, reviewed by at least one additional team member, and merged with a version bump commit.
- **Versioning policy**: Follow semantic versioning (MAJOR.MINOR.PATCH) as defined in the Sync
  Impact Report header of each amendment.
- **Compliance review**: All feature PR descriptions MUST include a "Constitution Check" section
  confirming which principles are exercised and noting any approved exceptions.
- **Exceptions**: Any approved exception to a principle MUST be documented inline in code with
  a comment referencing the approver and date, and recorded in the PR description.

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
