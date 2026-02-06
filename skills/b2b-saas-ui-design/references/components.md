# B2B Component Patterns

Use these patterns as defaults for enterprise product surfaces.

## App Shell

- Keep global navigation stable and persistent.
- Keep page title, scope context, and primary action visible.
- Reserve secondary rails for filters, details, or activity.
- Keep command surfaces discoverable (search, create, quick actions).

## Data Tables

- Support sort, filter, and search near the table header.
- Keep column headers sticky for long datasets when practical.
- Prefer progressive disclosure over horizontal overflow explosion.
- Provide row-level and bulk actions with clear priority.
- Design row states: selected, highlighted, warning, and error.
- Always include empty, loading, and no-results states.

## Filters and Query Builders

- Separate quick filters from advanced filters.
- Show active filter count and easy reset actions.
- Keep filter chips removable in one action.
- Preserve user filter state during pagination and navigation when possible.

## Forms

- Group fields by intent, not by raw schema order.
- Put helper text before errors are needed; keep errors explicit and local.
- Validate incrementally for high-risk inputs; avoid blocking feedback until submit.
- Mark required fields clearly and consistently.
- Keep submit actions persistent when forms are long.
- Show save states: idle, saving, saved, failed.

## Metrics and Charts

- Pair each chart with direct numeric summary and trend context.
- Provide explicit time range and comparison baseline.
- Never rely on color alone to encode meaning.
- Handle sparse or delayed data clearly.
- Provide drill-down action from summary to detail.

## Status and Feedback

- Use consistent semantic mapping for info, success, warning, and error.
- Keep toast messages short and actionable.
- Route critical failures to inline context with recovery path.
- Show partial-failure detail for batch operations.

## Permissions and Audit Cues

- Distinguish unavailable vs unauthorized actions with explicit messaging.
- Provide rationale for disabled controls when permission-related.
- Show who changed what and when in high-trust workflows.
- Preserve audit context near destructive or policy-sensitive actions.

## Responsiveness

- Keep desktop-first density for enterprise workflows unless mobile-first is required.
- Collapse secondary rails before primary workflow areas.
- Preserve key actions and statuses in narrow widths.
- Avoid hiding core actions behind multiple taps on mobile.
