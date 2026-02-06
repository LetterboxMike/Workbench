---
name: b2b-saas-ui-design
description: Design and implement production-grade B2B SaaS product interfaces for authenticated app surfaces such as dashboards, admin panels, workflow tools, settings, analytics, forms, and data-heavy views. Use when Codex must create or refine enterprise-facing UI/UX with clear hierarchy, reusable tokens, accessibility-complete states, and consistent component behavior across screens; not for marketing landing pages.
---

# B2B SaaS UI Design

## Goal

Create interfaces that help professional users complete frequent tasks faster, with lower cognitive load, higher trust, and predictable behavior across the whole product.

## Workflow

### 1. Load existing system memory first

- Check for `.b2b-saas-ui/system.md`.
- If present, treat it as the current source of truth for tokens, patterns, and interaction rules.
- If absent, establish a new baseline system and offer to save it using `references/system-template.md`.

### 2. Frame product context before styling

- Identify primary persona, top tasks, and risk level (operational, financial, compliance, or low-risk).
- Identify hard constraints: framework, accessibility target, responsiveness, localization, performance budget.
- Define success criteria in behavioral terms (fewer steps, faster scan time, fewer input errors).

### 3. Commit to one intentional design direction

- Select one direction from `references/directions.md`.
- State concrete choices for typography, color semantics, surface depth, density, and motion.
- Avoid generic defaults unless the existing product system already requires them.
- Preserve established design language when working inside an existing product.

### 4. Define reusable system tokens

- Define spacing, typography, radius, border/elevation, and semantic color tokens.
- Express tokens as implementation-ready variables (CSS custom properties, Tailwind theme, or framework tokens).
- Keep scale increments consistent; avoid one-off values unless tied to a clear exception.

### 5. Design screen architecture from workflow first

- Structure each screen around task priority.
- Place context and primary actions above fold when possible.
- Use progressive disclosure for advanced controls.
- Keep destructive actions visually and spatially distinct from primary actions.
- Design for realistic enterprise states: dense data, long labels, no-data states, partial permissions.

### 6. Implement component behavior completely

- Define and implement all critical states per component.
- default, hover, focus-visible, active, disabled, loading, success, warning, error, empty.
- Use `references/components.md` for B2B-specific interaction patterns.
- Ensure keyboard navigation and visible focus in all interactive flows.

### 7. Audit before final output

- Run the Quality Gates checklist in this file before finalizing.
- Save any new stable decisions back into `.b2b-saas-ui/system.md`.

## Quality Gates

- Ship only when all checks pass.
- Visual hierarchy clearly signals what matters first.
- Scanning works at a glance (labels, numbers, status, actions).
- Every critical component has complete state coverage.
- Keyboard usage and focus visibility are reliable.
- Contrast, target size, and error messaging meet accessibility expectations.
- Layout remains usable at common desktop sizes and mobile breakpoints when required.
- Tokens are reused consistently; no random spacing, radius, or shadow drift.
- Loading, empty, error, and permission-restricted states are designed, not implied.

## Output Contract

For new screens or major redesigns, provide output in this order:

1. Direction statement
2. Token map
3. Screen structure
4. Component behavior notes
5. Implementation notes
6. Quality gate results

For small edits, return only relevant sections and keep the same ordering.

## Guardrails

- Prioritize clarity and trust over novelty.
- Favor strong, legible typography choices; avoid defaulting to generic UI fonts unless required by existing system constraints.
- Avoid landing-page patterns in product surfaces (hero-first layouts, decorative-only sections, marketing copy blocks).
- Do not hide critical actions behind ambiguous icons alone.
- Protect destructive actions with clear labels, separation, and confirmation where needed.
- Keep motion purposeful; use it to guide attention, not decorate everything.
- Design for real data volume and long enterprise labels.

## Reference Loading

- Read `references/directions.md` when choosing or adjusting visual direction.
- Read `references/components.md` when designing component behavior and states.
- Read `references/system-template.md` when creating or updating `.b2b-saas-ui/system.md`.
