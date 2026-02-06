---
name: b2b-saas-ui-design-notion-minimal
description: Design and implement authenticated B2B SaaS product interfaces in a Notion-level minimalist style. Use when Codex must create or refine dashboards, admin panels, workspaces, settings, forms, tables, and data views with low-noise visual language, complete light and dark modes, consistent tokens, and strict gray-based color systems with no true black or true white values.
---

# B2B SaaS UI Design: Notion Minimal

## Goal

Create calm, text-first enterprise interfaces that reduce cognitive load while preserving speed for frequent professional workflows.

## Workflow

### 1. Load existing system memory first

- Check for `.b2b-saas-ui-minimal/system.md`.
- If present, treat it as the current source of truth for tokens, patterns, and interaction rules.
- If absent, establish a new baseline system and offer to save it using `references/system-template.md`.

### 2. Frame product context before styling

- Identify primary persona, top tasks, and risk level (operational, financial, compliance, or low-risk).
- Identify hard constraints: framework, accessibility target, responsiveness, localization, performance budget.
- Define success criteria in behavioral terms (fewer steps, faster scan time, fewer input errors).

### 3. Establish dual-mode palette and minimal direction first

- Select direction rules from `references/directions.md`.
- Define both light and dark tokens before writing layout or components.
- Keep both modes neutral-first and gray-dominant.
- Apply this hard rule everywhere: never use true black or true white.
- Ban `#000`, `#000000`, `rgb(0,0,0)`, `hsl(0 0% 0%)`, `#fff`, `#ffffff`, `rgb(255,255,255)`, and `hsl(0 0% 100%)`.
- Use very dark gray and very light gray instead.
- Preserve established design language when working inside an existing product.

### 4. Define reusable system tokens

- Define spacing, typography, radius, border, and semantic color tokens for both modes.
- Express tokens as implementation-ready variables (CSS custom properties, Tailwind theme, or framework tokens).
- Keep scale increments consistent; avoid one-off values unless tied to a clear exception.
- Keep depth restrained: subtle borders first, very light shadow only when needed.

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
- Ensure state styling is coherent in both light and dark modes.

### 7. Audit before final output

- Run the Quality Gates checklist in this file before finalizing.
- Save any new stable decisions back into `.b2b-saas-ui-minimal/system.md`.

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
- Light and dark modes are both fully specified for the same component set.
- No token or component style uses true black or true white values.

## Output Contract

For new screens or major redesigns, provide output in this order:

1. Direction statement
2. Light mode token map
3. Dark mode token map
4. Screen structure
5. Component behavior notes
6. Implementation notes
7. Quality gate results (include black/white ban check)

For small edits, return only relevant sections and keep the same ordering.

## Guardrails

- Prioritize clarity and trust over novelty.
- Favor restrained typography with strong readability and compact rhythm.
- Avoid landing-page patterns in product surfaces (hero-first layouts, decorative-only sections, marketing copy blocks).
- Do not hide critical actions behind ambiguous icons alone.
- Protect destructive actions with clear labels, separation, and confirmation where needed.
- Keep motion subtle and purposeful; avoid decorative animation.
- Design for real data volume and long enterprise labels.
- Keep backgrounds, surfaces, and text on gray ramps only.
- Never use pure black or pure white, even in borders, text, icons, or focus rings.

## Reference Loading

- Read `references/directions.md` when choosing or adjusting visual direction.
- Read `references/components.md` when designing component behavior and states.
- Read `references/system-template.md` when creating or updating `.b2b-saas-ui-minimal/system.md`.
