# B2B SaaS UI System (Reset Baseline)

## Current State
- UI styling system intentionally removed.
- No global CSS file is loaded by Nuxt.
- No component/page/layout scoped styles are present.
- Templates are intentionally plain and unstyled.

## Purpose
- Provide the cleanest possible functional baseline before a full redesign.
- Keep behavior and navigation flows intact while removing visual debt.

## Baseline Rules
- Do not introduce design tokens until the new direction is approved.
- Keep markup semantic and minimal.
- Avoid style-driven wrapper structure unless required for behavior.

## Change Log
- Date: 2026-02-06
- What changed: removed custom theme, class-based presentation hooks, and stale style wiring.
- Why: reset to stock Nuxt rendering for a full UI/UX rebuild from scratch.
