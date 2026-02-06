# Workbench Design System — Implementation Plan

**Objective:** Implement the design system defined in `workbench-design-system.md` across the entire Nuxt 3 application. This plan assumes the app is being built from scratch (Phase 1 of the product roadmap). If retrofitting an existing codebase, treat each step as an audit-then-refactor cycle.

**Reference files:**
- `workbench-design-system.md` — canonical design spec
- `workbench-mockup.jsx` — interactive React prototype (reference for visual fidelity)
- `basecamp-prd.md` — product requirements and architecture

---

## Phase 0: Foundation (Before Any Components)

### 0.1 — Font Loading

**File:** `nuxt.config.ts` or `app.vue`

Add Google Fonts link in the `<head>`:
```
Inter: weights 300, 400, 500, 600
JetBrains Mono: weights 300, 400, 500 + italic 400
```

Use `@nuxtjs/google-fonts` module or a manual `<link>` in `app.vue`. Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com` for performance.

**Verification:** Open the app, inspect any element. Confirm both Inter and JetBrains Mono are loading. Check the Network tab for font file downloads.

### 0.2 — CSS Custom Properties

**File:** `assets/css/design-tokens.css`

Create a single file containing:
1. `:root` block with all non-color tokens (fonts, layout dimensions, radii, transitions, spacing)
2. `[data-theme="light"]` block with all light-mode color tokens
3. `[data-theme="dark"]` block with all dark-mode color tokens

Copy the complete CSS from Section 11 of the design system doc. This file is the single source of truth for all design values.

**Import** this file globally in `nuxt.config.ts`:
```ts
css: ['~/assets/css/design-tokens.css']
```

**Verification:** Add `data-theme="dark"` to `<html>` manually, then toggle to `"light"`. All custom properties should resolve. Inspect any `--color-*` variable in DevTools.

### 0.3 — CSS Reset & Base Styles

**File:** `assets/css/base.css`

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-bg);
  transition: background var(--transition-normal), color var(--transition-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-height: 100vh;
}

button {
  font-family: inherit;
  cursor: pointer;
}

input {
  font-family: var(--font-mono);
}

a {
  color: inherit;
  text-decoration: none;
}

:focus-visible {
  outline: 2px solid var(--color-text-tertiary);
  outline-offset: 2px;
}
```

Import after design-tokens in nuxt.config.

### 0.4 — Theme Composable

**File:** `composables/useTheme.ts`

```ts
export const useTheme = () => {
  const isDark = useState('theme-dark', () => true)

  const init = () => {
    if (process.client) {
      const stored = localStorage.getItem('workbench-theme')
      isDark.value = stored ? stored === 'dark' : true
      document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    }
  }

  const toggle = () => {
    isDark.value = !isDark.value
    if (process.client) {
      document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
      localStorage.setItem('workbench-theme', isDark.value ? 'dark' : 'light')
    }
  }

  return { isDark, toggle, init }
}
```

Call `init()` in `app.vue` `onMounted`. Default to dark mode.

**Verification:** Toggle the theme. Background, text, borders, sidebar should all transition smoothly. No flash of wrong theme on page load.

---

## Phase 1: App Shell

### 1.1 — Layout Structure

**File:** `layouts/default.vue`

Build the three-panel layout:
```
<div class="app-shell">
  <TopBar />
  <div class="app-body">
    <Sidebar />
    <main class="main-content">
      <slot />
    </main>
    <AiPanel v-if="aiOpen" />
  </div>
</div>
```

CSS:
```css
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--color-bg);
}
```

**Verification:** The layout should render as a full-height flex container. Sidebar on left, content in middle, AI panel conditionally on right. Main content scrolls independently.

### 1.2 — TopBar Component

**File:** `components/layout/TopBar.vue`

Spec reference: Design System §8.2

Build:
- 48px height, sidebar background, bottom border
- Left: wordmark (mono 13px/500) + separator + org name (mono 12px/400)
- Right: SearchButton, NotificationBell, ThemeToggle, UserAvatar
- All right-side items: 32×32 touch target, 4px gap

**Subcomponents to extract:**
- `components/ui/SearchButton.vue` — mono font, border, search icon + ⌘K hint
- `components/ui/NotificationBell.vue` — bell icon with 5px unread dot
- `components/ui/ThemeToggle.vue` — sun/moon toggle, calls `useTheme().toggle()`
- `components/ui/UserAvatar.vue` — 28px circle, mono initial

**Verification:** Top bar spans full width. Wordmark and breadcrumb left-aligned. Buttons right-aligned. Theme toggle works. No layout shift when AI panel opens.

### 1.3 — Sidebar Component

**File:** `components/layout/Sidebar.vue`

Spec reference: Design System §8.3–8.6

Build order:
1. Container: 220px fixed, sidebar background, right border, overflow auto, padding 12px 0
2. AI button at top (extract to `components/ui/AiButton.vue`)
3. 1px divider line
4. Section groups using `SidebarSection` + `SidebarItem` components

**Extract subcomponents:**

`components/ui/SidebarSection.vue`
- Props: `label` (string)
- Renders: mono 10px, weight 300, 0.14em spacing, tertiary color, 0.4 opacity
- This is the thinnest, lightest element in the sidebar

`components/ui/SidebarItem.vue`
- Props: `icon`, `label`, `active`, `count`, `indent`
- Renders: Inter 13px, icon 15px, hover/active states per spec
- Badge renders when `count` is provided

`components/ui/AiButton.vue`
- Props: none (emits click event)
- Renders: sparkle icon, "ask ai", ⌘J hint
- Border, glow, strong border per spec

**Critical detail:** Section labels must be visually MUCH lighter than nav items. Weight 300 + opacity 0.4 vs weight 400-500 + full opacity. If they look similar, the section labels are too prominent.

**Verification:** Toggle between views — active states highlight correctly. Section labels are barely-there ghost text. AI button has subtle glow. Notification badge renders.

### 1.4 — AI Panel

**File:** `components/layout/AiPanel.vue`

Spec reference: Design System §8.24

Build:
- 360px fixed width, sidebar bg, left border
- Header with sparkle + "ai assistant" + close button
- Chat area (flex column, justify-end) for message bubbles
- Input area with text input + send button + suggested prompt chips

**Subcomponents:**
- `components/ai/AiMessage.vue` — bubble with sender label + body text
- `components/ai/AiPromptChip.vue` — pill-shaped suggestion

State: managed by a composable `composables/useAiPanel.ts` with `isOpen` ref.

**Verification:** Click AI button → panel slides in from right. Main content area shrinks. Close button dismisses. Prompt chips render as pills.

---

## Phase 2: Shared UI Components

Build these as standalone components in `components/ui/`. Each consumes only CSS custom properties — no hardcoded hex values.

### 2.1 — PriorityDot

**File:** `components/ui/PriorityDot.vue`
- Props: `priority` (urgent | high | medium | low | none)
- 8×8 circle, color from `--color-priority-{level}`

### 2.2 — StatusLabel

**File:** `components/ui/StatusLabel.vue`
- Props: `status` (backlog | todo | in_progress | in_review | done | cancelled)
- JetBrains Mono, 11px, lowercase
- Color varies by status per spec (in_progress = primary, todo/review = secondary, rest = tertiary)

### 2.3 — TaskCheckbox

**File:** `components/ui/TaskCheckbox.vue`
- Props: `checked` (boolean)
- 16×16, border-radius 3px
- Unchecked: hollow border. Checked: filled with check icon.

### 2.4 — TagChip

**File:** `components/ui/TagChip.vue`
- Props: `label` (string)
- Mono 11px, surface bg, 3px radius, 2px 8px padding

### 2.5 — SectionHeader

**File:** `components/ui/SectionHeader.vue`
- Props: `label`, `linkText?`, `linkAction?`
- Mono 11px, weight 300, 0.08em spacing, tertiary
- Optional right-aligned ghost link

### 2.6 — ViewTabs

**File:** `components/ui/ViewTabs.vue`
- Props: `tabs` (array of {key, label}), `active` (string)
- Emits: `change`
- Mono 12px, 5px border-radius per tab

### 2.7 — PageHeader

**File:** `components/ui/PageHeader.vue`
- Props: `title`, `subtitle?`, `subtitleFont?` (mono or body)
- Slots: `right` (for view tabs)
- Inter 24px/600 title, subtitle below

### 2.8 — PrimaryButton

**File:** `components/ui/PrimaryButton.vue`
- Props: `label`, `icon?`
- Inverted colors, mono font, icon + text layout

### 2.9 — InputField

**File:** `components/ui/InputField.vue`
- Props: `placeholder`, `modelValue`, `variant?` (standard | ai)
- Mono font, border, correct radius per variant

**Verification for all:** Create a test page at `/dev/components` that renders every shared component in both themes. Visual check against mockup.

---

## Phase 3: View Pages

### 3.1 — Overview Page

**File:** `pages/projects/[id]/index.vue`

Spec reference: Design System §8.21, §8.22, §8.26

Build order:
1. Page header (title + description)
2. Stats row — 4 stat blocks, raw numbers, no containers
3. Two-column grid (recent docs + task snapshot)
4. Activity feed

**Key implementation details:**
- Stats: mono 36px/300 numbers. No card wrapping. Just number + label stacked.
- Doc list items: file icon + title + timestamp, bottom-bordered rows
- Task snapshot: priority dot + title + status label, bottom-bordered rows
- Activity: actor (bold) + verb + target (bold) + timestamp (right-aligned)
- All section headers use the SectionHeader component

### 3.2 — Document Editor Page

**File:** `pages/projects/[id]/docs/[docId].vue`

Build order:
1. Back nav breadcrumb (mono 11px, arrow-left icon)
2. Document title (Inter 28px/600 editable)
3. Tag row
4. Editor toolbar (rich text formatting buttons)
5. Document body area (Tiptap editor, line-height 1.8)
6. Right panel — linked tasks

**Key implementation details:**
- Toolbar buttons: B and I use Inter (bold/italic respectively), all others use mono
- Toolbar divider: 1px vertical line between formatting groups
- Inline task blocks: checkbox + text + metadata
- Right panel: separate component, 280px, left border, own scroll context
- "autosave active" indicator: mono 11px, tertiary, opacity 0.4

### 3.3 — List View

**File:** `pages/projects/[id]/tasks/list.vue`

Build order:
1. Page header with view tabs
2. Filter input + add task button
3. Table header row (grid layout)
4. Task rows (same grid)

**Key implementation details:**
- Grid columns: `24px 1fr 100px 80px 100px 80px 120px`
- Headers: mono 10px/300, 0.06em tracking
- Rows: 12px vertical padding, bottom-bordered
- Empty values render as "—" in tertiary
- Source doc shows "standalone" when null

### 3.4 — Kanban View

**File:** `pages/projects/[id]/tasks/kanban.vue`

Build order:
1. Page header with view tabs
2. Column layout (flex row, gap 12px, overflow auto)
3. Column headers (mono 11px/300 + count)
4. Cards per column
5. Dashed add button per column

**Key implementation details:**
- Columns: flex 1, min-width 180px
- Cards: elevated bg, 1px border, 8px radius, grab cursor
- Column count: mono 11px, tertiary, opacity 0.4
- Drag-and-drop: implement with `@vueuse/core` `useDraggable` or a dedicated library. Must update task status on drop.

### 3.5 — Calendar View

**File:** `pages/projects/[id]/tasks/calendar.vue`

Build order:
1. Page header with view tabs
2. Month navigation (prev/next buttons + month label)
3. Day-of-week header row
4. 7-column grid of day cells
5. Unscheduled section below

**Key implementation details:**
- Grid: `grid-template-columns: repeat(7, 1fr)`
- Today cell gets surface background + inverted number badge
- Task chips inside cells: elevated bg, 4px radius
- Unscheduled section: surface-bg chips with grab cursor

---

## Phase 4: Polish & Cross-Cutting Concerns

### 4.1 — Icon System

**Option A (recommended):** Create an `Icon.vue` component that renders inline SVGs from a map. All icons are 24×24 viewBox, stroke-based, 1.5px stroke, no fill. Component accepts `name`, `size`, `color` (defaults to `currentColor`).

**Option B:** Use Lucide Vue or Heroicons. Confirm stroke width matches 1.5px and that the sparkle icon can be customized (it has special fill treatment).

Required icons: search, bell, sun, moon, folder, file, file-indent, check, list, kanban, calendar, home, plus, sparkle, arrow-left, send.

### 4.2 — Typography Audit

After all pages are built, audit every text element:

**Checklist:**
- [ ] Every nav label, section header, tab, status label, timestamp, input, and metadata element uses JetBrains Mono
- [ ] Only page titles, doc headings, task titles, body paragraphs, and activity names/targets use Inter
- [ ] All system chrome is lowercase
- [ ] All font weights match spec (300 for section labels, 400 for body, 500 for emphasis, 600 for h1/h2)
- [ ] Letter-spacing matches: 0.14em (sidebar sections), 0.08em (content sections), 0.06em (table headers), 0.04em (stat labels), -0.02em (h1), -0.03em (stat numbers)
- [ ] Line-heights: 1.0 (stat numbers), 1.2 (headings), 1.4 (small text), 1.5 (body), 1.8 (editor prose)

### 4.3 — Color Audit

**Checklist:**
- [ ] No raw hex values anywhere in component code — all references use `var(--color-*)`
- [ ] No `#000000` or `#FFFFFF` anywhere
- [ ] No colored accents, no blue links, no red errors (everything is grayscale)
- [ ] Priority dots use the correct 4-stop grayscale ramp
- [ ] Status labels use typography color differentiation only (no colored badges)
- [ ] Both themes render correctly — toggle between them on every page
- [ ] AI button is the only element with a box-shadow

### 4.4 — Spacing Audit

**Checklist:**
- [ ] Page padding: 40px top, 48px sides on all views
- [ ] Content max-width applied and centered
- [ ] Stat numbers have 48px horizontal gap
- [ ] Overview columns have 48px gap
- [ ] Section header to content: 16px consistently
- [ ] No element has padding or margin that isn't a multiple of 4px
- [ ] Sidebar nav items: 6px 12px padding, 32px left padding when indented

### 4.5 — Border Audit

**Checklist:**
- [ ] All borders are `1px solid var(--color-border)`
- [ ] Only the AI button uses `--color-border-strong`
- [ ] Only the kanban add button uses dashed borders
- [ ] No drop shadows anywhere except AI button's subtle glow
- [ ] No 2px borders anywhere
- [ ] No doubled borders at element intersections

### 4.6 — Accessibility Pass

**Checklist:**
- [ ] Tab through every interactive element — focus ring visible on all
- [ ] Focus ring: 2px solid, text-tertiary color, 2px offset
- [ ] All icon-only buttons have `aria-label`
- [ ] Theme toggle announces "Switch to light/dark mode"
- [ ] Sidebar section labels have `role="group"` or equivalent
- [ ] Keyboard can navigate kanban (arrow keys to move cards)
- [ ] Contrast ratios meet WCAG AA (test with browser DevTools or axe)

### 4.7 — Responsive Behavior

Lower priority for v1, but set up the breakpoints:

```css
@media (max-width: 1024px) {
  .sidebar { width: 40px; /* icon-only rail */ }
}
@media (max-width: 768px) {
  .ai-panel { position: fixed; inset: 0; z-index: 50; }
}
@media (max-width: 640px) {
  .kanban-columns { overflow-x: auto; flex-wrap: nowrap; }
}
```

---

## Phase 5: Design System Maintenance

### 5.1 — Token File as Source of Truth

`assets/css/design-tokens.css` is the canonical reference. If a designer or developer questions a color/spacing/font value, the token file wins. The design system markdown doc is documentation; the CSS file is implementation.

### 5.2 — Component Isolation

Every shared UI component must:
1. Accept props (never assume context)
2. Use only CSS custom properties for colors
3. Not import other component styles
4. Have a clear, single responsibility

### 5.3 — Anti-Patterns to Prevent

The following should be caught in code review:

| Anti-Pattern | Correct Approach |
|---|---|
| `color: #1C1C1C` | `color: var(--color-text)` |
| `box-shadow: 0 2px 4px rgba(0,0,0,0.1)` | No shadows. Remove it. |
| Wrapping content in a card with background + border + radius | Use spacing and typography for hierarchy |
| Using colored status pills (green/yellow/red) | Use grayscale StatusLabel component |
| `font-family: 'Inter'` on a timestamp | Timestamps use `var(--font-mono)` |
| `text-transform: uppercase` on nav items | Lowercase text in the source string |
| `border: 2px solid` anything | Only 1px borders exist |
| `#000` or `#FFF` anywhere | Use token equivalents |
| Nesting a card inside a card | Flatten the layout |

---

## File Checklist

When implementation is complete, the following files should exist:

```
assets/css/
  design-tokens.css          ✓ All CSS custom properties
  base.css                   ✓ Reset + base styles

composables/
  useTheme.ts                ✓ Dark/light toggle, localStorage persistence
  useAiPanel.ts              ✓ AI panel open/close state

layouts/
  default.vue                ✓ App shell (topbar + sidebar + main + ai panel)

components/layout/
  TopBar.vue                 ✓ 48px header bar
  Sidebar.vue                ✓ 220px nav rail
  AiPanel.vue                ✓ 360px assistant panel

components/ui/
  AiButton.vue               ✓ Sparkle button with glow
  AiMessage.vue              ✓ Chat bubble
  AiPromptChip.vue           ✓ Suggested prompt pill
  Icon.vue                   ✓ SVG icon renderer
  InputField.vue             ✓ Text input (standard + AI variant)
  NotificationBadge.vue      ✓ Count pill
  NotificationBell.vue       ✓ Bell icon with unread dot
  PageHeader.vue             ✓ Title + subtitle + right slot
  PrimaryButton.vue          ✓ Inverted CTA button
  PriorityDot.vue            ✓ 8px grayscale circle
  SearchButton.vue           ✓ Search bar with ⌘K
  SectionHeader.vue          ✓ Content section label + optional link
  SidebarItem.vue            ✓ Nav item with hover/active
  SidebarSection.vue         ✓ Ghost section label
  StatusLabel.vue            ✓ Mono status text
  TagChip.vue                ✓ Surface-bg tag
  TaskCheckbox.vue           ✓ 16px checkbox
  ThemeToggle.vue            ✓ Sun/moon switch
  UserAvatar.vue             ✓ 28px initial circle
  ViewTabs.vue               ✓ List/kanban/calendar switcher

components/views/
  OverviewStats.vue          ✓ Raw number + label blocks
  DocListItem.vue            ✓ File icon + title + timestamp row
  TaskSnapshotItem.vue       ✓ Priority dot + title + status row
  ActivityItem.vue           ✓ Actor + action + target + time
  KanbanCard.vue             ✓ Draggable task card
  KanbanColumn.vue           ✓ Column with header + cards + add button
  CalendarDayCell.vue        ✓ Day number + task chips
  CalendarTaskChip.vue       ✓ Small task indicator
  UnscheduledChip.vue        ✓ Draggable unscheduled task
  TaskTableRow.vue           ✓ Grid row for list view
  TaskTableHeader.vue        ✓ Grid header for list view
  LinkedTaskItem.vue         ✓ Right panel task in doc view
  EditorToolbar.vue          ✓ Formatting buttons bar

pages/projects/[id]/
  index.vue                  ✓ Overview page
  docs/[docId].vue           ✓ Document editor page
  tasks/list.vue             ✓ List view
  tasks/kanban.vue           ✓ Kanban view
  tasks/calendar.vue         ✓ Calendar view
```

---

## Implementation Order (Suggested)

This ordering minimizes rework and lets you see results fastest:

```
WEEK 1: Foundation
  ├── 0.1 Font loading
  ├── 0.2 Design tokens CSS
  ├── 0.3 Base styles + reset
  ├── 0.4 Theme composable
  ├── 1.1 App shell layout
  ├── 1.2 TopBar (+ SearchButton, ThemeToggle, Avatar, Bell)
  └── 1.3 Sidebar (+ SidebarSection, SidebarItem, AiButton)

WEEK 2: Shared Components + Overview
  ├── 2.1–2.9 All shared UI components
  ├── 1.4 AI Panel
  └── 3.1 Overview page

WEEK 3: Task Views
  ├── 3.3 List view
  ├── 3.4 Kanban view
  └── 3.5 Calendar view

WEEK 4: Document Editor + Polish
  ├── 3.2 Document editor page
  ├── 4.1 Icon system finalization
  ├── 4.2 Typography audit
  ├── 4.3 Color audit
  ├── 4.4 Spacing audit
  ├── 4.5 Border audit
  └── 4.6 Accessibility pass
```

4 weeks to a fully styled, design-system-compliant frontend. All views functional. Both themes polished. Every pixel matching the mockup.
