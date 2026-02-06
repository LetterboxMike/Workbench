# System Memory Template (Minimal + Dual Mode)

Use this as `.b2b-saas-ui-minimal/system.md` in the target project.

```markdown
# B2B SaaS UI System (Notion Minimal)

## Product Context
- Primary users:
- Primary workflows:
- Risk profile:
- Platform constraints:

## Direction
- Direction name: Notion-level minimal
- Reason for direction:
- Density mode:
- Motion intensity:

## Non-Negotiable Color Safety
- Never use true black or true white.
- Banned values: #000, #000000, rgb(0,0,0), hsl(0 0% 0%), #fff, #ffffff, rgb(255,255,255), hsl(0 0% 100%).

## Tokens
### Spacing
- Base:
- Scale:

### Typography
- Display:
- Body:
- Mono (optional):
- Scale:

### Radius
- xs:
- sm:
- md:
- lg:

### Light Mode Tokens
- background:
- surface:
- surface-elevated:
- text-primary:
- text-secondary:
- text-muted:
- border:
- focus-ring:
- accent:
- success:
- warning:
- danger:
- info:

### Dark Mode Tokens
- background:
- surface:
- surface-elevated:
- text-primary:
- text-secondary:
- text-muted:
- border:
- focus-ring:
- accent:
- success:
- warning:
- danger:
- info:

## Component Decisions
### Button
- Heights:
- Priority variants:
- Disabled treatment:

### Input
- Height and padding:
- Label pattern:
- Validation pattern:

### Table
- Header behavior:
- Row density:
- Selection pattern:
- Bulk action pattern:

### Card and Panel
- Padding:
- Radius:
- Border strategy:
- Shadow strategy:

## State Rules
- Loading pattern:
- Empty state pattern:
- Error recovery pattern:
- Permission denied pattern:

## Accessibility Baseline
- Focus visibility:
- Contrast targets:
- Keyboard expectations:
- Screen reader expectations:

## QA Checklist
- Light mode complete for core screens:
- Dark mode complete for core screens:
- Banned pure black/white values absent:
- Token parity maintained across modes:

## Change Log
- Date:
- What changed:
- Why:
```

## Usage Notes

- Keep this file decision-oriented and short.
- Update after stable design decisions, not per minor tweak.
- Preserve token parity between light and dark modes.
