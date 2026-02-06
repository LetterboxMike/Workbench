# Workbench Design System

**Version:** 1.0
**Last Updated:** February 2026
**Design Philosophy:** Functional minimalism — full power, zero friction.

---

## 1. Design Principles

**1. Whitespace is structure.** Separation comes from spacing, not borders or boxes. Use dividers only where structural clarity demands it. Never use drop shadows. Never stack containers inside containers.

**2. Typography is hierarchy.** Size and weight do the heavy lifting. If you need a box to make something readable, the typography is wrong.

**3. Gray is a spectrum, not a color.** The entire UI is built on pure neutral grays with zero tint — no warm, no cool, no blue, no beige. Light and dark modes are inversions of the same grayscale ramp.

**4. Mono is the voice of the system.** JetBrains Mono is used for anything that represents system information: labels, metadata, timestamps, statuses, counts, inputs, breadcrumbs, navigation chrome. Inter is used for authored content: headings, body text, task titles, document prose.

**5. Progressive disclosure.** Default state is clean and minimal. Advanced features reveal contextually. No settings mazes. No feature dumps.

**6. Speed is a feature.** Optimistic UI updates everywhere. No loading spinners for basic operations. Transitions are 150–200ms max. If it feels slow, it is slow.

---

## 2. Color System

### 2.1 Core Palette

All colors are pure neutral grays. No tint whatsoever — every value has equal R, G, B channels (or close enough to be perceptually neutral). The palette is defined as CSS custom properties on `:root` and toggled via a `.dark` class on `<html>` or `<body>`.

```
LIGHT MODE RAMP (lightest → darkest):
  gray-50:  #F4F4F4    ← app background
  gray-100: #EAEAEA    ← surface / sidebar / subtle fills
  gray-150: #E0E0E0    ← borders / dividers
  gray-200: #DEDEDE    ← active states / pressed
  gray-250: #D6D6D6    ← sidebar active
  gray-300: #C8C8C8    ← strong borders (AI button)
  gray-400: #B8B8B8    ← priority-low / disabled
  gray-500: #9A9A9A    ← tertiary text / ghost labels
  gray-600: #8A8A8A    ← priority-medium
  gray-700: #6E6E6E    ← secondary text
  gray-800: #4A4A4A    ← priority-high
  gray-900: #1C1C1C    ← primary text / priority-urgent

DARK MODE RAMP (darkest → lightest):
  gray-50:  #161616    ← app background
  gray-100: #1A1A1A    ← sidebar
  gray-125: #1E1E1E    ← surface / inputs
  gray-150: #2A2A2A    ← borders / dividers
  gray-200: #2E2E2E    ← sidebar active
  gray-250: #333333    ← active / pressed
  gray-300: #3A3A3A    ← strong borders (AI button)
  gray-350: #262626    ← elevated / kanban cards
  gray-400: #4A4A4A    ← priority-low
  gray-500: #5C5C5C    ← tertiary text / ghost labels
  gray-600: #7A7A7A    ← priority-medium
  gray-700: #8A8A8A    ← secondary text
  gray-800: #B0B0B0    ← priority-high
  gray-900: #E2E2E2    ← primary text / priority-urgent
```

### 2.2 Semantic Tokens

These are the tokens referenced throughout the app. They map to the ramp values above and flip between light/dark modes.

#### Backgrounds
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#F4F4F4` | `#161616` | App background, main content area |
| `--bg-surface` | `#EAEAEA` | `#1E1E1E` | Sidebar, top bar, calendar today cell, unscheduled task chips |
| `--bg-elevated` | `#F0F0F0` | `#262626` | Kanban cards, calendar event chips, AI message bubbles |
| `--bg-input` | `#F4F4F4` | `#1E1E1E` | Input fields, text areas |
| `--bg-hover` | `#E8E8E8` | `#2A2A2A` | Hover state on interactive rows and items |
| `--bg-active` | `#DEDEDE` | `#333333` | Active/pressed state, selected view tabs |
| `--bg-sidebar` | `#EAEAEA` | `#1A1A1A` | Sidebar and top bar background |
| `--bg-sidebar-hover` | `#E0E0E0` | `#242424` | Sidebar item hover |
| `--bg-sidebar-active` | `#D6D6D6` | `#2E2E2E` | Sidebar item active/selected |
| `--bg-ai` | `#F4F4F4` | `#1E1E1E` | AI assistant button background |
| `--bg-badge` | `--text-primary` | `--text-primary` | Notification count badge (inverts) |

#### Text
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--text-primary` | `#1C1C1C` | `#E2E2E2` | Headings, task titles, primary content, nav item active |
| `--text-secondary` | `#6E6E6E` | `#8A8A8A` | Body text, descriptions, assignee names, nav items default |
| `--text-tertiary` | `#9A9A9A` | `#5C5C5C` | Timestamps, section labels, placeholder text, metadata |
| `--text-ghost` | `#9A9A9A` at 40% opacity | `#5C5C5C` at 40% opacity | Sidebar section headers, autosave indicator, helper text |
| `--text-inverse` | `#F4F4F4` | `#161616` | Text on inverted backgrounds (badges, calendar today, buttons) |

#### Borders
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--border` | `#E0E0E0` | `#2A2A2A` | Default borders, dividers, table rules, input borders |
| `--border-strong` | `#C8C8C8` | `#3A3A3A` | AI button border, emphasized containers |

#### Priority (grayscale only — no semantic color)
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--priority-urgent` | `#1C1C1C` | `#E2E2E2` | Urgent priority dot (same as text-primary) |
| `--priority-high` | `#4A4A4A` | `#B0B0B0` | High priority dot |
| `--priority-medium` | `#8A8A8A` | `#7A7A7A` | Medium priority dot |
| `--priority-low` | `#B8B8B8` | `#4A4A4A` | Low priority dot |
| `--priority-none` | `transparent` | `transparent` | No priority assigned |

#### Calendar
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--calendar-today-bg` | `#1C1C1C` | `#E2E2E2` | Today date circle background |
| `--calendar-today-text` | `#F4F4F4` | `#161616` | Today date circle text |

#### AI
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--ai-glow` | `rgba(28,28,28,0.06)` | `rgba(226,226,226,0.04)` | Subtle box-shadow on AI button |
| `--ai-border` | `#C8C8C8` | `#3A3A3A` | AI button border (uses `--border-strong`) |
| `--ai-bg` | `#F4F4F4` | `#1E1E1E` | AI button fill |

### 2.3 CSS Custom Properties Implementation

```css
:root {
  /* Light mode (default) */
  --bg: #F4F4F4;
  --bg-surface: #EAEAEA;
  --bg-elevated: #F0F0F0;
  --bg-input: #F4F4F4;
  --bg-hover: #E8E8E8;
  --bg-active: #DEDEDE;
  --bg-sidebar: #EAEAEA;
  --bg-sidebar-hover: #E0E0E0;
  --bg-sidebar-active: #D6D6D6;
  --bg-ai: #F4F4F4;

  --text-primary: #1C1C1C;
  --text-secondary: #6E6E6E;
  --text-tertiary: #9A9A9A;
  --text-ghost: rgba(154, 154, 154, 0.4);
  --text-inverse: #F4F4F4;

  --border: #E0E0E0;
  --border-strong: #C8C8C8;

  --priority-urgent: #1C1C1C;
  --priority-high: #4A4A4A;
  --priority-medium: #8A8A8A;
  --priority-low: #B8B8B8;
  --priority-none: transparent;

  --calendar-today-bg: #1C1C1C;
  --calendar-today-text: #F4F4F4;

  --ai-glow: rgba(28, 28, 28, 0.06);
  --ai-border: #C8C8C8;
  --ai-bg: #F4F4F4;

  --transition-fast: 100ms ease;
  --transition-normal: 150ms ease;
  --transition-theme: 200ms ease;
}

.dark {
  --bg: #161616;
  --bg-surface: #1E1E1E;
  --bg-elevated: #262626;
  --bg-input: #1E1E1E;
  --bg-hover: #2A2A2A;
  --bg-active: #333333;
  --bg-sidebar: #1A1A1A;
  --bg-sidebar-hover: #242424;
  --bg-sidebar-active: #2E2E2E;
  --bg-ai: #1E1E1E;

  --text-primary: #E2E2E2;
  --text-secondary: #8A8A8A;
  --text-tertiary: #5C5C5C;
  --text-ghost: rgba(92, 92, 92, 0.4);
  --text-inverse: #161616;

  --border: #2A2A2A;
  --border-strong: #3A3A3A;

  --priority-urgent: #E2E2E2;
  --priority-high: #B0B0B0;
  --priority-medium: #7A7A7A;
  --priority-low: #4A4A4A;
  --priority-none: transparent;

  --calendar-today-bg: #E2E2E2;
  --calendar-today-text: #161616;

  --ai-glow: rgba(226, 226, 226, 0.04);
  --ai-border: #3A3A3A;
  --ai-bg: #1E1E1E;
}
```

---

## 3. Typography

### 3.1 Font Stack

| Role | Font | Fallback | Usage |
|---|---|---|---|
| **Body / Content** | Inter | `-apple-system, BlinkMacSystemFont, sans-serif` | Headings, body text, task titles, document prose, button labels (action buttons) |
| **System / Chrome** | JetBrains Mono | `'SF Mono', 'Fira Code', monospace` | Everything else: nav labels, section headers, metadata, timestamps, statuses, inputs, breadcrumbs, stats, view tabs, table headers, tags, AI panel, search bar, badges |

Load via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet">
```

### 3.2 Type Scale

All sizes in `px`. Use `rem` equivalents in implementation (base 16px).

| Token | Size | Weight | Font | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `--type-display` | 36px | 300 | JetBrains Mono | -0.03em | Dashboard stat numbers |
| `--type-h1` | 24px | 600 | Inter | -0.02em | Page titles |
| `--type-h2` | 20px | 600 | Inter | -0.01em | Document content H2 |
| `--type-h3` | 16px | 500 | Inter | 0 | Document content H3 |
| `--type-body` | 14px | 400 | Inter | 0 | Body text, descriptions, task titles in list |
| `--type-body-medium` | 14px | 500 | Inter | 0 | Task titles, nav items (active), emphasis |
| `--type-small` | 13px | 400 | Inter / JetBrains Mono | 0 | Sidebar nav items, kanban card titles, AI chat text |
| `--type-caption` | 12px | 400 | JetBrains Mono | 0 | Breadcrumbs, due dates, assignees in mono context |
| `--type-label` | 11px | 400 | JetBrains Mono | 0.04em | Status labels, tags, task metadata, timestamps |
| `--type-section` | 10px | 300 | JetBrains Mono | 0.14em | Sidebar section headers (ghost opacity) |
| `--type-table-header` | 10px | 300 | JetBrains Mono | 0.06em | Table column headers, kanban column headers |
| `--type-micro` | 10px | 500 | JetBrains Mono | 0 | Keyboard shortcuts, badge counts |

### 3.3 Line Heights

| Context | Line Height |
|---|---|
| Headings (h1, h2) | 1.2 |
| Body text | 1.5 |
| Document prose (editor) | 1.8 |
| Small / caption / labels | 1.4 |
| Stat numbers (display) | 1.0 |
| Kanban card title | 1.4 |

### 3.4 Text Casing

- **Sidebar section headers:** lowercase, always. `workspace`, `project`, `views`, `documents`
- **Section headings in content:** lowercase in JetBrains Mono. `recent documents`, `task snapshot`, `activity`, `linked tasks`, `unscheduled`
- **Status labels:** lowercase. `backlog`, `todo`, `in progress`, `review`, `done`
- **View tabs:** lowercase. `list`, `kanban`, `calendar`
- **Breadcrumbs:** lowercase. `workbench / bettersignshop`
- **Button text:** lowercase in mono. `add task`, `add`, `search`, `ask ai`
- **Page titles (h1):** Title case in Inter. `Workbench MVP`, `Tasks`, `Product Brief`
- **Task titles:** Sentence case in Inter. Natural language.
- **Document body content:** Normal prose casing.

---

## 4. Spacing

### 4.1 Base Unit

The spacing system uses a 4px base unit. All spacing values are multiples of 4.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Minimum gap, icon-to-text tight |
| `--space-2` | 8px | Tag gaps, tight element spacing, inline gaps |
| `--space-3` | 12px | Sidebar padding, nav item gap, column gaps |
| `--space-4` | 16px | Section bottom margins, card padding inline, input padding |
| `--space-5` | 20px | AI panel padding, right panel padding |
| `--space-6` | 24px | Top bar horizontal padding, main content side padding, breadcrumb bottom margin |
| `--space-8` | 32px | Page title bottom margin, view header bottom margin |
| `--space-10` | 40px | Main content top padding |
| `--space-12` | 48px | Main content horizontal padding, column gap between sections, stat row bottom margin, activity section top margin |

### 4.2 Layout Dimensions

| Element | Dimension |
|---|---|
| Top bar height | 48px |
| Sidebar width | 220px |
| AI panel width | 360px |
| Right panel (doc linked tasks) | 280px |
| Main content max-width (overview, list, calendar) | 960px |
| Main content max-width (list view) | 1100px |
| Document editor max-width | 720px |
| Kanban minimum column width | 180px |

### 4.3 Content Padding

The main content area uses `40px` top padding and `48px` horizontal padding. Content is centered with `margin: 0 auto` and constrained by `max-width`.

---

## 5. Borders & Dividers

### 5.1 Rules

- **No drop shadows.** Ever. On anything.
- **No rounded-corner card containers** used as visual grouping. Group with whitespace.
- **Borders are structural, not decorative.** Use only where content regions need explicit delineation.

### 5.2 Border Usage

| Context | Style |
|---|---|
| Sidebar right edge | `1px solid var(--border)` |
| Top bar bottom edge | `1px solid var(--border)` |
| AI panel left edge | `1px solid var(--border)` |
| Right panel (doc) left edge | `1px solid var(--border)` |
| Table row separators | `1px solid var(--border)` — bottom border on each row |
| Document list item separators | `1px solid var(--border)` — bottom border |
| Editor toolbar top + bottom | `1px solid var(--border)` |
| Calendar cell top edge | `1px solid var(--border)` |
| Input fields | `1px solid var(--border)` |
| Kanban cards | `1px solid var(--border)` |
| Kanban "add" button | `1px dashed var(--border)` |
| AI button | `1px solid var(--border-strong)` + `box-shadow: 0 0 0 1px var(--ai-glow), 0 2px 8px var(--ai-glow)` |
| Sidebar AI/nav divider | `1px solid var(--border)` — horizontal line with `margin: 0 12px 12px` |

### 5.3 Border Radius

| Element | Radius |
|---|---|
| Sidebar nav items | 6px |
| Input fields | 6px |
| Buttons (standard) | 6px |
| View tabs | 5px |
| Tags | 3px |
| Kanban cards | 8px |
| AI button | 10px |
| AI message bubbles | 10px |
| AI quick-action chips | 20px (pill) |
| Avatar circles | 50% |
| Priority dots | 50% |
| Calendar today circle | 50% |
| Badge (notification count) | 10px (pill) |
| Checkboxes (task) | 3px |

---

## 6. Icons

All icons are inline SVG, 24×24 viewBox, rendered at display sizes between 12px and 18px. Stroke-based, `strokeWidth: 1.5`, `fill: none`, `stroke: currentColor` (inherits from parent text color).

### 6.1 Icon Sizes

| Context | Size |
|---|---|
| Sidebar nav items | 15px |
| Top bar buttons | 16px |
| Search bar icon | 13px |
| Back arrow (breadcrumb) | 12px |
| "Add" buttons inline | 14px |
| Kanban add button icon | 12px |
| AI sparkle (nav button) | 18px |
| AI sparkle (panel header) | 16px |
| AI send button | 14px |

### 6.2 Icon Color

Icons inherit color from their parent element. Typically:
- Active nav item icons: `var(--text-primary)`
- Inactive nav item icons: `var(--text-tertiary)`
- Button icons: inherit button text color
- Decorative/metadata icons: `var(--text-tertiary)`

### 6.3 AI Sparkle Icon

The sparkle icon is the only icon that uses a fill treatment. It has a low-opacity filled shape (`opacity: 0.15`) with a stroke outline, plus a smaller secondary sparkle (`opacity: 0.3`). This gives it subtle visual weight compared to other stroke-only icons.

---

## 7. Components

### 7.1 Sidebar

- Background: `var(--bg-sidebar)`
- Width: 220px, fixed, non-collapsible in v1
- Padding: 12px vertical, 0 horizontal (items have 12px horizontal padding)
- Scroll: vertical overflow auto

**AI Button (top of nav):**
- Padding: 12px 14px
- Border: `1px solid var(--border-strong)`
- Border-radius: 10px
- Box-shadow: `0 0 0 1px var(--ai-glow), 0 2px 8px var(--ai-glow)`
- Font: JetBrains Mono, 13px, weight 500
- Contains: sparkle icon (18px), "ask ai" text, keyboard shortcut `⌘J` (10px, tertiary, opacity 0.5)
- Separated from nav by a 1px horizontal divider

**Section Headers:**
- Font: JetBrains Mono, 10px, weight 300
- Letter-spacing: 0.14em
- Text-transform: lowercase
- Color: `var(--text-tertiary)` at `opacity: 0.4`
- Padding: 12px top, 4px bottom, left-aligned at 26px
- These must be visually distinct from nav items — much lighter, much thinner, clearly non-interactive

**Nav Items:**
- Padding: 6px 12px (indent items: 6px 12px 6px 32px)
- Border-radius: 6px
- Font: inherit (Inter), 13px
- Default: `color: var(--text-secondary)`, weight 400
- Hover: `background: var(--bg-sidebar-hover)`
- Active: `background: var(--bg-sidebar-active)`, `color: var(--text-primary)`, weight 500
- Icon: 15px, color matches text state
- Transition: background 100ms ease

**Notification Badge:**
- Font: JetBrains Mono, 10px, weight 500
- Background: `var(--text-primary)`
- Color: `var(--bg)`
- Border-radius: 10px
- Padding: 1px 6px

### 7.2 Top Bar

- Height: 48px
- Background: `var(--bg-sidebar)`
- Border-bottom: `1px solid var(--border)`
- Horizontal padding: 24px

**Left side:** Logo/wordmark (`workbench` in JetBrains Mono 13px weight 500) + breadcrumb separator (`/` in mono, tertiary) + org name (mono 12px, secondary)

**Right side:** Search button, notification bell, theme toggle, avatar. All 32×32 touch targets.

**Search Button:**
- Border: `1px solid var(--border)`
- Border-radius: 6px
- Padding: 6px 12px
- Font: JetBrains Mono 12px
- Contains: search icon + "search" text + `⌘K` shortcut (10px, opacity 0.5)

**Avatar:**
- 28×28, border-radius 50%
- Background: `var(--bg-active)`
- Font: JetBrains Mono 11px, weight 500
- Shows first initial

### 7.3 View Tabs

Used on task views (list/kanban/calendar) to switch between views.

- Font: JetBrains Mono, 12px
- Padding: 5px 12px
- Border-radius: 5px
- Border: none
- Default: background transparent, `color: var(--text-tertiary)`, weight 400
- Active: `background: var(--bg-active)`, `color: var(--text-primary)`, weight 500
- Tabs are lowercase: `list`, `kanban`, `calendar`

### 7.4 Buttons

**Primary Button (e.g., "add task"):**
- Background: `var(--text-primary)`
- Color: `var(--bg)`
- Font: JetBrains Mono, 13px, weight 500
- Padding: 8px 16px
- Border-radius: 6px
- Border: none
- Text: lowercase
- Icon: 14px, color inherits

**Ghost Button (e.g., "view all →"):**
- Background: transparent
- Border: none
- Font: JetBrains Mono, 11px
- Color: `var(--text-tertiary)`, opacity 0.5
- Text: lowercase

**Dashed Button (e.g., kanban "add"):**
- Background: transparent
- Border: `1px dashed var(--border)`
- Border-radius: 8px
- Font: JetBrains Mono, 11px
- Color: `var(--text-tertiary)`
- Padding: 10px
- Contains: plus icon (12px) + text

**AI Send Button:**
- Width: 36px, height: 36px
- Background: `var(--text-primary)`
- Color: `var(--bg)`
- Border-radius: 8px
- Contains: send icon (14px)

### 7.5 Inputs

- Background: `var(--bg-input)`
- Border: `1px solid var(--border)`
- Border-radius: 6px (inputs) or 8px (AI chat input)
- Padding: 8px 12px (standard) or 10px 12px (AI)
- Font: JetBrains Mono, 13px
- Color: `var(--text-primary)`
- Placeholder color: `var(--text-tertiary)`
- Outline: none (focus state: border-color shifts to `var(--border-strong)`)
- Box-sizing: border-box always

### 7.6 Priority Dot

- Width: 8px, height: 8px
- Border-radius: 50%
- Inline-block, flex-shrink: 0
- Colors map to `--priority-{level}` tokens
- Used in: list view, kanban cards, task snapshots, calendar events, document linked tasks

### 7.7 Status Label

- Font: JetBrains Mono, 11px, weight 400
- Text: lowercase (`backlog`, `todo`, `in progress`, `review`, `done`)
- Color varies by status:
  - `in_progress`: `var(--text-primary)` — the only one with full weight
  - `todo`, `in_review`: `var(--text-secondary)`
  - `backlog`, `done`, `cancelled`: `var(--text-tertiary)`

### 7.8 Tags

- Font: JetBrains Mono, 11px
- Color: `var(--text-tertiary)`
- Background: `var(--bg-surface)`
- Padding: 2px 8px
- Border-radius: 3px
- No border

### 7.9 Checkboxes (Task Blocks)

- Width: 16px, height: 16px
- Border-radius: 3px
- Unchecked: `border: 1.5px solid var(--text-secondary)`, transparent fill
- Checked: `border: 1.5px solid var(--text-tertiary)`, fill `var(--text-tertiary)`, white checkmark icon (10px)
- Completed task text: `color: var(--text-tertiary)`, `text-decoration: line-through`

### 7.10 Kanban Cards

- Background: `var(--bg-elevated)`
- Border: `1px solid var(--border)`
- Border-radius: 8px
- Padding: 14px 16px
- Cursor: grab
- Title: 13px, weight 500, line-height 1.4
- Metadata row: priority dot + assignee (mono 11px, tertiary) on left, due date (mono 11px, tertiary) on right
- Gap between title and metadata: 10px

### 7.11 Calendar

**Day Headers:** JetBrains Mono, 10px, weight 300, letter-spacing 0.08em, `var(--text-tertiary)`, lowercase

**Date Numbers:** JetBrains Mono, 12px, weight 400, `var(--text-secondary)`

**Today Circle:** 24×24, border-radius 50%, background `var(--calendar-today-bg)`, color `var(--calendar-today-text)`, weight 600

**Today Cell:** background `var(--bg-surface)` to subtly highlight the column

**Event Chips:** background `var(--bg-elevated)`, padding 4px 8px, border-radius 4px, font 12px weight 500, cursor pointer

**Month Navigation:** JetBrains Mono, 14px weight 500 (month label), 12px weight 400 (prev/next buttons, tertiary)

**Unscheduled Section:**
- Section label: same as content section headers (mono 11px weight 300, tertiary, 0.08em)
- Task chips: background `var(--bg-surface)`, padding 10px 14px, border-radius 6px, cursor grab
- Contains: priority dot + task title (13px Inter)

### 7.12 AI Panel

- Width: 360px
- Background: `var(--bg-sidebar)`
- Border-left: `1px solid var(--border)`
- Slides in from right (transition: width 200ms)

**Header:** padding 16px 20px, border-bottom, contains sparkle icon (16px) + "ai assistant" (mono 13px weight 500) + close button (×)

**Message Bubble:**
- Background: `var(--bg-elevated)`
- Border-radius: 10px
- Padding: 12px 16px
- Max-width: 85%
- Role label: mono 10px, tertiary, letter-spacing 0.06em, margin-bottom 6px
- Body: 13px, `var(--text-secondary)`, line-height 1.6

**Input Area:**
- Padding: 12px 16px
- Border-top: `1px solid var(--border)`
- Input: mono, 13px, border-radius 8px
- Send button: 36×36, inverted colors

**Quick Action Chips:**
- Border: `1px solid var(--border)`
- Background: transparent
- Border-radius: 20px (pill)
- Font: JetBrains Mono, 11px
- Color: `var(--text-tertiary)`
- Padding: 4px 10px
- Margin-top: 8px from input

### 7.13 Page Headers

Each major view has a consistent page header pattern:

- Title: Inter, 24px, weight 600, letter-spacing -0.02em
- Subtitle/description: 14px (Inter) or 12px (JetBrains Mono), `var(--text-secondary)` or `var(--text-tertiary)`, margin-top 4px
- Bottom margin: 32px before content begins
- View tabs float right, vertically centered with the title

### 7.14 Content Section Headers

Used within pages to label groups (recent documents, task snapshot, activity, linked tasks, etc.):

- Font: JetBrains Mono, 11px, weight 300
- Letter-spacing: 0.08em
- Color: `var(--text-tertiary)`
- Text: lowercase
- Margin-bottom: 16px (12px for tighter sections)
- Optional right-aligned ghost link: mono 11px, tertiary, opacity 0.5

### 7.15 Table Rows (List View)

**Header Row:**
- Font: JetBrains Mono, 10px, weight 300
- Letter-spacing: 0.06em
- Color: `var(--text-tertiary)`
- Text: lowercase
- Padding: 8px 0
- Border-bottom: `1px solid var(--border)`

**Data Rows:**
- Grid layout (matches header columns)
- Padding: 12px 0
- Border-bottom: `1px solid var(--border)`
- Task title: Inter 13px weight 500, `var(--text-primary)`
- Metadata cells: JetBrains Mono 11–12px, `var(--text-secondary)` or `var(--text-tertiary)`
- Source doc: mono 11px, tertiary. "standalone" for tasks without a parent doc.

### 7.16 Overview Stats

- Value: JetBrains Mono, 36px, weight 300, letter-spacing -0.03em, line-height 1.0
- Label: JetBrains Mono, 11px, weight 400, `var(--text-tertiary)`, letter-spacing 0.04em, margin-top 8px
- Stat items spaced 48px apart horizontally
- No background, no card, no border. Raw numbers.

---

## 8. Motion & Transitions

### 8.1 Duration Scale

| Token | Duration | Usage |
|---|---|---|
| `--transition-fast` | 100ms | Hover states (sidebar, buttons) |
| `--transition-normal` | 150ms | Active states, view tab switches, focus rings |
| `--transition-theme` | 200ms | Background/color on theme toggle |
| `--transition-panel` | 200ms | AI panel slide-in/out |

### 8.2 Easing

All transitions use `ease` (CSS default cubic-bezier). No custom easing curves in v1.

### 8.3 Rules

- No loading spinners for CRUD operations. Use optimistic updates.
- No skeleton loaders in v1. Content should appear fast enough to not need them.
- No animated entrances on page navigation. Content appears immediately.
- Theme toggle transitions background and color properties at 200ms.
- Sidebar hover/active transitions background at 100ms.
- The AI panel appears by rendering in the DOM (flex layout shift), not a CSS slide animation in v1. Keep it simple.

---

## 9. Dark / Light Mode

### 9.1 Implementation

Toggle is a sun/moon icon in the top bar. State is stored in `localStorage` and applied as a `.dark` class on the `<html>` element. Default is dark mode.

In Nuxt, use a composable:

```ts
// composables/useTheme.ts
export const useTheme = () => {
  const isDark = useState('theme-dark', () => true)

  const toggle = () => {
    isDark.value = !isDark.value
    if (process.client) {
      document.documentElement.classList.toggle('dark', isDark.value)
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }
  }

  return { isDark, toggle }
}
```

### 9.2 Principle

Light and dark modes are strict inversions. The grayscale ramp flips — what was light becomes dark, what was dark becomes light. No color hue changes. No opacity tricks beyond what's defined in the token table. Both modes must feel equally intentional and polished.

---

## 10. Accessibility

### 10.1 Contrast Ratios

- Primary text on background: minimum 7:1 (WCAG AAA)
- Secondary text on background: minimum 4.5:1 (WCAG AA)
- Tertiary text: minimum 3:1 (used only for non-essential metadata, never for actionable elements)

### 10.2 Focus States

All interactive elements must have visible focus indicators:
- Focus ring: `outline: 2px solid var(--text-tertiary)`, `outline-offset: 2px`
- Never use `outline: none` without an alternative focus indicator

### 10.3 Touch Targets

- Minimum 32×32px for all interactive elements
- Sidebar nav items, top bar buttons, and view tabs all meet this requirement via padding

---

## 11. File Naming & Structure (Nuxt)

```
assets/
  css/
    design-system.css       ← All CSS custom properties, resets, base styles
    typography.css           ← Font imports, type scale classes
    components.css           ← Shared component styles (if using global CSS)

components/
  ui/
    SidebarSection.vue
    SidebarItem.vue
    ViewTabs.vue
    PriorityDot.vue
    StatusLabel.vue
    TaskCheckbox.vue
    KanbanCard.vue
    AiButton.vue
    AiPanel.vue
    SearchButton.vue
    PageHeader.vue
    SectionHeader.vue
    GhostButton.vue
    PrimaryButton.vue
    DashedButton.vue
    InputField.vue
    TagChip.vue
    NotificationBadge.vue
    Avatar.vue
    CalendarDayCell.vue
    CalendarEventChip.vue
```

Each component consumes design tokens via CSS custom properties. No hardcoded color values anywhere in component code. Every color reference must go through a token.
