# Frontend Audit Report - 2026-02-06

## Scope + Environment
- Audit date: 2026-02-06 (UTC artifacts timestamps around `2026-02-06T09:38Z`)
- Runtime mode: `WORKBENCH_AUTH_DISABLED=1`
- Browser engine: Puppeteer + Chromium (headless)
- Repo state: no git metadata available in this workspace (branch/commit unavailable)
- Primary audited data context:
  - Project: `0f0ec94f-b5a5-4e6f-b6b5-449230a89afc`
  - Document: `c42fa11e-b38c-47fc-bf01-a4e6ec4cf723`
- Artifacts:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/runtime-sweep-320-375-768-1024.json`
  - `docs/audit-artifacts/frontend-audit-2026-02-06/flow-checks.json`
  - `docs/audit-artifacts/frontend-audit-2026-02-06/static-wiring.json`
  - `docs/audit-artifacts/frontend-audit-2026-02-06/a11y-label-scan.json`
  - `docs/audit-artifacts/frontend-audit-2026-02-06/typecheck.log`
  - `docs/audit-artifacts/frontend-audit-2026-02-06/screenshots/`

## Route/Viewport Coverage Matrix
All routes were exercised at `320`, `375`, `768`, `1024` widths in runtime sweep (`60/60` route-viewport checks completed).

| Route | 320 | 375 | 768 | 1024 |
|---|---|---|---|---|
| `/projects` | Yes | Yes | Yes | Yes |
| `/notifications` | Yes | Yes | Yes | Yes |
| `/users` | Yes | Yes | Yes | Yes |
| `/settings` | Yes | Yes | Yes | Yes |
| `/admin` | Yes | Yes | Yes | Yes |
| `/admin/members` | Yes | Yes | Yes | Yes |
| `/admin/activity` | Yes | Yes | Yes | Yes |
| `/admin/settings` | Yes | Yes | Yes | Yes |
| `/projects/:id` | Yes | Yes | Yes | Yes |
| `/projects/:id/tasks` | Yes | Yes | Yes | Yes |
| `/projects/:id/tasks/list` | Yes | Yes | Yes | Yes |
| `/projects/:id/tasks/kanban` | Yes | Yes | Yes | Yes |
| `/projects/:id/tasks/calendar` | Yes | Yes | Yes | Yes |
| `/projects/:id/documents` | Yes | Yes | Yes | Yes |
| `/projects/:id/documents/:docId` | Yes | Yes | Yes | Yes |

## 1. Critical Issues (blocking/broken functionality)

### AUD-001
- Severity: `Critical`
- Area: `Functional`
- Repro:
  1. Open `/settings` (or any document page with comments sidebar).
  2. Observe network calls.
- Expected vs actual:
  - Expected: authenticated user info resolves for settings/comments context.
  - Actual: `GET /api/auth/me` returns `404`.
- Affected breakpoints: `320`, `375`, `768`, `1024`
- File/API refs:
  - `pages/settings.vue:15`
  - `components/CommentSidebar.vue:35`
  - No matching backend route under `server/api/auth/*` (see `docs/audit-artifacts/frontend-audit-2026-02-06/static-wiring.json`)
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/runtime-sweep-320-375-768-1024.json`
  - `docs/audit-artifacts/frontend-audit-2026-02-06/screenshots/flow-settings-missing-auth-me.png`
- Recommended fix (impact: `High`):
  - Replace callers with `/api/auth/session` shape, or implement `/api/auth/me` route and standardize user payload contract.

### AUD-002
- Severity: `Critical`
- Area: `Functional`
- Repro:
  1. Open `/users`.
  2. Click `Remove` on a member.
  3. Confirm `Remove Member`.
- Expected vs actual:
  - Expected: `DELETE /api/orgs/:id/members/:uid` fires and member is removed.
  - Actual: no delete API request is emitted.
- Affected breakpoints: functionally global (verified desktop flow)
- File/API refs:
  - `components/DeleteMemberModal.vue:31` (`api.delete(...)`)
  - `composables/useWorkbenchApi.ts:45` (only `del` is exposed)
  - Typecheck confirms mismatch: `docs/audit-artifacts/frontend-audit-2026-02-06/typecheck.log`
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/flow-checks.json` (`AUD-002`)
  - `docs/audit-artifacts/frontend-audit-2026-02-06/screenshots/flow-users-delete-member.png`
- Recommended fix (impact: `High`):
  - Replace `api.delete` with `api.del`, add explicit error surface in modal, and add regression test for member removal.

### AUD-009
- Severity: `Critical`
- Area: `Mobile`
- Repro:
  1. Open `/projects` at width `320`.
  2. Inspect `.main-content` and page layout metrics.
- Expected vs actual:
  - Expected: usable content width on narrow phone viewport.
  - Actual: main content collapsed to ~`100px` width, project content effectively unusable.
- Affected breakpoints: `320` (severe), `375` (still constrained)
- File/API refs:
  - `assets/css/design-tokens.css:55` (`--sidebar-width: 220px`)
  - `layouts/default.vue:267` (`padding: var(--space-10) var(--space-12)`)
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/flow-checks.json` (`AUD-009`)
  - `docs/audit-artifacts/frontend-audit-2026-02-06/screenshots/flow-mobile-320-layout.png`
- Recommended fix (impact: `High`):
  - Add responsive shell breakpoint: collapse sidebar to drawer/off-canvas under tablet width; reduce fixed content paddings on mobile.

### AUD-011
- Severity: `Critical`
- Area: `Functional`
- Repro:
  1. Open `/users` as super admin.
  2. Attempt invitation flow.
- Expected vs actual:
  - Expected: visible `Invite User` action and invite modal.
  - Actual: invite action is not rendered in the page shell flow.
- Affected breakpoints: all
- File/API refs:
  - `pages/users.vue:134` uses `<PrimaryButton>`
  - `components/InviteUserModal.vue:111` uses `<InputField>`
  - `components/InviteUserModal.vue:127` uses `<PrimaryButton>`
  - `.nuxt/components.d.ts:48` and `.nuxt/components.d.ts:50` register `UiInputField`/`UiPrimaryButton` (not unprefixed)
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/flow-checks.json` (`AUD-011`)
  - `docs/audit-artifacts/frontend-audit-2026-02-06/screenshots/flow-invite-magic-link.png`
  - Backend + invite route itself works directly: `docs/audit-artifacts/frontend-audit-2026-02-06/invite-backend-route.json`
- Recommended fix (impact: `High`):
  - Rename component usage to `UiPrimaryButton`/`UiInputField` or add aliases; add invite-flow E2E test in `/users`.

## 2. Mobile-Specific Problems

### AUD-010
- Severity: `Medium`
- Area: `Mobile`
- Repro:
  1. Open `/projects` at `375`.
  2. Inspect project pin controls in sidebar.
- Expected vs actual:
  - Expected: touch-discoverable pin/unpin action.
  - Actual: control defaults to hidden (`opacity: 0`) and is primarily hover-revealed.
- Affected breakpoints: `320`, `375` (touch UIs)
- File refs:
  - `components/AppSidebar.vue:417`
  - `components/AppSidebar.vue:472`
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/flow-checks.json` (`AUD-010`)
  - `docs/audit-artifacts/frontend-audit-2026-02-06/screenshots/flow-mobile-touch-hover-control.png`
- Recommended fix (impact: `Medium`):
  - Always expose pin action on touch breakpoints and increase target size to >=44px.

### AUD-013
- Severity: `High`
- Area: `Mobile`
- Repro:
  1. Run touch target audit on route/viewport matrix.
  2. Inspect violation list.
- Expected vs actual:
  - Expected: minimum `44x44` touch targets for interactive elements.
  - Actual: violations in `60/60` checks; smallest controls include `16x16` task checkboxes and sub-44 icon/button controls.
- Affected breakpoints: all tested (`320`, `375`, `768`, `1024`), most severe on phone widths.
- File refs:
  - `components/ui/TaskCheckbox.vue:28` (`width: 16px; height: 16px`)
  - `components/AppTopBar.vue` icon controls (`.icon-button`, 32x32)
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/runtime-sweep-320-375-768-1024.json`
- Recommended fix (impact: `High`):
  - Standardize interactive minimum sizing token to `44px`; increase checkbox hit area via wrapper while preserving visual glyph size.

## 3. UX Friction Points

### AUD-008
- Severity: `High`
- Area: `Accessibility`
- Repro:
  1. Focus topbar `actions` button via keyboard.
  2. Press `Enter`.
- Expected vs actual:
  - Expected: actions menu opens via keyboard activation.
  - Actual: menu does not open (hover-only behavior).
- Affected breakpoints: all
- File refs:
  - `components/AppTopBar.vue:77`
  - `components/AppTopBar.vue:78`
  - `components/AppTopBar.vue:89`
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/flow-checks.json` (`AUD-008`)
  - `docs/audit-artifacts/frontend-audit-2026-02-06/screenshots/flow-keyboard-actions-menu.png`
- Recommended fix (impact: `High`):
  - Add click + keyboard toggling, `aria-expanded`, `aria-controls`, focus trap/escape handling.

### AUD-015
- Severity: `Medium`
- Area: `Accessibility`
- Repro:
  1. Run label scan for forms and icon-only controls.
  2. Inspect failing routes.
- Expected vs actual:
  - Expected: explicit labels/associations for form controls and non-text buttons.
  - Actual: unlabeled controls found on `/settings`, `/admin/members`, `/tasks/list`, `/tasks/kanban`, document page.
- Affected breakpoints: `375`, `1024`
- File refs:
  - `pages/settings.vue` preference controls (no associated `<label for>` wiring)
  - `pages/admin/members.vue` search input (placeholder-only)
  - `pages/projects/[id]/tasks/list.vue` icon/checkbox controls
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/a11y-label-scan.json`
- Recommended fix (impact: `Medium`):
  - Add explicit labels or `aria-label`s and semantic association for all form/command controls.

## 4. Missing Features/Incomplete Implementations

### AUD-003
- Severity: `High`
- Area: `Missing Feature`
- Repro:
  1. Open `/projects/:id/tasks/list`.
  2. Toggle row checkbox.
  3. Observe bulk action bar visibility.
- Expected vs actual:
  - Expected: row selection drives `selected[]` and shows bulk action controls.
  - Actual: checkbox triggers status toggle API; `selected` never populated; bulk UI unreachable.
- Affected breakpoints: all
- File refs:
  - `pages/projects/[id]/tasks/list.vue:19`
  - `pages/projects/[id]/tasks/list.vue:22`
  - `components/views/TaskTableRow.vue:8`
  - `components/views/TaskTableRow.vue:24`
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/flow-checks.json` (`AUD-003`)
  - `docs/audit-artifacts/frontend-audit-2026-02-06/screenshots/flow-tasks-bulk-selection.png`
- Recommended fix (impact: `High`):
  - Introduce explicit selection state/emits (separate from status toggle) and wire to bulk action payload.

### AUD-007
- Severity: `Medium`
- Area: `Missing Feature`
- Repro:
  1. Open `/admin/activity`.
  2. Click `Export CSV`.
- Expected vs actual:
  - Expected: CSV generation/download or queued export flow.
  - Actual: placeholder alert (`coming soon`).
- Affected breakpoints: all
- File refs:
  - `pages/admin/activity.vue:143`
  - `pages/admin/activity.vue:145`
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/flow-checks.json` (`AUD-007`)
- Recommended fix (impact: `Medium`):
  - Implement real export endpoint + download UX, or hide CTA until available.

### AUD-016
- Severity: `Low`
- Area: `Missing Feature`
- Repro:
  1. Open `/admin/settings`.
  2. Check danger zone section.
- Expected vs actual:
  - Expected: either active delete flow or no visible destructive CTA.
  - Actual: disabled destructive CTA with explicit not-implemented text.
- Affected breakpoints: all
- File refs:
  - `pages/admin/settings.vue:251`
  - `pages/admin/settings.vue:261`
  - `pages/admin/settings.vue:267`
- Evidence:
  - Source inspection (`pages/admin/settings.vue`)
- Recommended fix (impact: `Low`):
  - Hide non-functional destructive actions from production UI until implemented.

## 5. Potential Edge Case Failures

### AUD-005
- Severity: `Medium`
- Area: `Edge Case`
- Repro:
  1. Open a document.
  2. Type rapidly.
  3. Immediately navigate away.
- Expected vs actual:
  - Expected: pending autosave is flushed before route transition.
  - Actual: no observed `PUT /api/documents/:id/content` during rapid change in this test.
- Affected breakpoints: desktop flow tested (risk applies generally)
- File refs:
  - `components/DocumentEditor.vue:98`
  - `components/DocumentEditor.vue:106`
  - `components/DocumentEditor.vue:114`
- Evidence:
  - `docs/audit-artifacts/frontend-audit-2026-02-06/flow-checks.json` (`AUD-005`)
  - `docs/audit-artifacts/frontend-audit-2026-02-06/screenshots/flow-editor-autosave-route-change.png`
- Recommended fix (impact: `Medium`):
  - Flush queued save on route leave/unmount and/or use `navigator.sendBeacon`/blocking save guard for dirty state.

### Edge Cases Validated (no failure observed)
- `Comment -> Convert to Task` with long/special-character input submitted successfully (`AUD-006`).
- Rapid repeated project create clicks produced a single POST (`AUD-012`).
- Whitespace-only project title remained blocked (`docs/audit-artifacts/frontend-audit-2026-02-06/edge-project-form.json`).
- Task cross-view sync (list -> kanban -> calendar unscheduled) remained consistent (`AUD-004`).

## 6. Recommendations Prioritized By Impact
1. Fix contract/wiring blockers first: replace `/api/auth/me` usage or implement route, and correct `api.delete` -> `api.del`.
2. Restore admin user management entry points by fixing unregistered component tags (`PrimaryButton`/`InputField` -> `Ui*` names).
3. Implement mobile shell breakpoint behavior (collapsible sidebar + reduced main padding) to resolve 320/375 usability collapse.
4. Enforce interaction accessibility baseline: keyboard-openable action menus, labeled controls, and `44x44` minimum touch targets.
5. Complete or hide partial features: task bulk selection wiring, admin CSV export, org deletion flow.
6. Harden autosave on navigation to prevent silent data-loss edge cases.

## Known Limitations
- Audit used Chromium emulation; no physical iOS/Android keyboard/gesture hardware test.
- Auth mode was intentionally disabled (`WORKBENCH_AUTH_DISABLED=1`), so login/session security paths were not audited in production-auth mode.
- Error-state induction used real observed failures and targeted interaction checks; full API failure injection per route was not exhaustively simulated.
