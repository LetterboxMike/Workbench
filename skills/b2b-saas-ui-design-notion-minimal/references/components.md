# Minimal Component Patterns

Use these defaults for restrained B2B product interfaces.

## Global Rules

- Keep component geometry simple.
- Prefer `1px` borders and gentle contrast shifts.
- Use small to medium radii only.
- Use subtle hover changes, not dramatic color jumps.
- Keep all colors on gray ramps unless semantic state requires accent.
- Never use pure black or pure white in any component state.

## App Shell

- Keep navigation persistent and quiet.
- Keep header lightweight with clear page context.
- Use separation via border, not heavy shadow.
- Keep global search visible but visually calm.

## Buttons

- Keep button hierarchy clear with minimal visual treatment.
- Primary button: muted accent fill with strong text contrast.
- Secondary button: surface fill + border.
- Tertiary button: text-first with subtle hover background.
- Keep disabled state low contrast but still legible.

## Inputs and Forms

- Use clear labels above inputs for scanability.
- Keep input borders visible in both modes.
- Use restrained focus ring that stays within gray family unless brand requires color.
- Keep validation messaging compact and local.
- Preserve consistent heights across text inputs, selects, and date controls.

## Tables

- Optimize for high information density without clutter.
- Use row hover tint only slightly different from base surface.
- Keep selected row treatment clear but understated.
- Use sticky headers when datasets are long.
- Ensure sort/filter controls remain lightweight and aligned.

## Cards and Panels

- Use panels to group workflows, not decorate space.
- Prefer border + mild surface shift over drop shadows.
- Keep panel padding consistent across screen types.
- Avoid nested card stacks without clear hierarchy.

## Status and Feedback

- Inline status first, toast second.
- Keep semantic colors muted and consistent across modes.
- Distinguish warning and error clearly with text and icon, not color alone.
- Keep loading indicators minimal and non-blocking where possible.

## Dark Mode Parity

- Match structure and spacing exactly between light and dark modes.
- Adjust only token values, not component geometry.
- Validate readable contrast for small text and table content.
