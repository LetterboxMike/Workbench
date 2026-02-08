import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4311';
const outDir = process.env.AUDIT_OUT_DIR || path.resolve('docs/audit-artifacts/frontend-audit-2026-02-06');
const screenshotDir = path.join(outDir, 'screenshots');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getJson = async (url) => {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
};

const sanitize = (id) => id.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const clickByText = async (page, tag, text) => {
  const ok = await page.evaluate(
    ({ tag, text }) => {
      const nodes = Array.from(document.querySelectorAll(tag));
      const target = nodes.find((n) => (n.textContent || '').trim().toLowerCase().includes(text.toLowerCase()));
      if (!target) return false;
      target.click();
      return true;
    },
    { tag, text }
  );
  return ok;
};

const withPage = async (browser, viewport, fn) => {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  const apiResponses = [];
  const consoleErrors = [];
  const pageErrors = [];
  const dialogs = [];

  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      apiResponses.push({
        url,
        status: response.status(),
        method: response.request().method()
      });
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  try {
    return await fn(page, { apiResponses, consoleErrors, pageErrors, dialogs });
  } finally {
    await page.close();
  }
};

const run = async () => {
  await fs.mkdir(screenshotDir, { recursive: true });

  const projects = await getJson(`${baseUrl}/api/projects`);
  const projectList = projects?.data || [];
  let projectId = null;
  let docId = null;

  for (const project of projectList) {
    const docs = await getJson(`${baseUrl}/api/projects/${project.id}/documents`);
    const firstDoc = docs?.data?.flat?.[0]?.id;
    if (firstDoc) {
      projectId = project.id;
      docId = firstDoc;
      break;
    }
  }

  if (!projectId) {
    projectId = projectList[0]?.id || null;
  }

  if (!projectId) throw new Error('No project ID found');
  if (!docId) throw new Error('No document ID found');

  const browser = await puppeteer.launch({ headless: true });
  const results = [];

  const push = (id, area, severity, observed, details) => {
    results.push({ id, area, severity, observed, ...details });
  };

  try {
    await withPage(browser, { width: 1024, height: 768 }, async (page, log) => {
      await page.goto(`${baseUrl}/settings`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(300);
      const missingAuthMe = log.apiResponses.some((r) => r.url.includes('/api/auth/me') && r.status === 404);
      await page.screenshot({ path: path.join(screenshotDir, 'flow-settings-missing-auth-me.png') });
      push('AUD-001', 'Functional', 'Critical', missingAuthMe, {
        route: '/settings',
        evidence: 'screenshots/flow-settings-missing-auth-me.png',
        apiErrors: log.apiResponses.filter((r) => r.status >= 400)
      });
    });

    await withPage(browser, { width: 1024, height: 768 }, async (page, log) => {
      await page.goto(`${baseUrl}/users`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(500);
      const removeClicked = await clickByText(page, 'button', 'remove');
      await sleep(150);
      const submitClicked = await clickByText(page, 'button', 'remove member');
      await sleep(300);

      const modalError = await page.evaluate(() => {
        const node = Array.from(document.querySelectorAll('*')).find((n) =>
          (n.textContent || '').toLowerCase().includes('api.delete is not a function')
        );
        return node ? (node.textContent || '').trim() : null;
      });

      const deleteApiCalled = log.apiResponses.some(
        (r) => r.method === 'DELETE' && r.url.includes('/api/orgs/') && r.url.includes('/members/')
      );

      await page.screenshot({ path: path.join(screenshotDir, 'flow-users-delete-member.png') });
      push('AUD-002', 'Functional', 'Critical', Boolean(removeClicked && submitClicked && (modalError || !deleteApiCalled)), {
        route: '/users',
        evidence: 'screenshots/flow-users-delete-member.png',
        modalError,
        deleteApiCalled
      });
    });

    await withPage(browser, { width: 1024, height: 768 }, async (page, log) => {
      await page.goto(`${baseUrl}/projects/${projectId}/tasks/list`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(500);
      const rowCheckbox = await page.$('.task-row .cell-checkbox');
      if (rowCheckbox) {
        await rowCheckbox.click();
      }
      await sleep(400);

      const bulkVisible = await page.$('.bulk-actions') !== null;
      const patched = log.apiResponses.some((r) => r.method === 'PATCH' && r.url.includes('/api/tasks/'));
      await page.screenshot({ path: path.join(screenshotDir, 'flow-tasks-bulk-selection.png') });
      push('AUD-003', 'Missing Feature', 'High', Boolean(patched && !bulkVisible), {
        route: `/projects/${projectId}/tasks/list`,
        evidence: 'screenshots/flow-tasks-bulk-selection.png',
        taskPatchedOnToggle: patched,
        bulkActionsVisible: bulkVisible
      });
    });

    await withPage(browser, { width: 1024, height: 768 }, async (page, log) => {
      const title = `AUDIT_SYNC_${Date.now()}`;
      await page.goto(`${baseUrl}/projects/${projectId}/tasks/list`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(400);
      await page.type('input.add-input', title);
      await page.keyboard.press('Enter');
      await sleep(500);
      const createCalled = log.apiResponses.some((r) => r.method === 'POST' && r.url.includes(`/api/projects/${projectId}/tasks`));

      await page.goto(`${baseUrl}/projects/${projectId}/tasks/kanban`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(300);
      const inKanban = await page.evaluate((title) => (document.body.textContent || '').includes(title), title);

      await page.goto(`${baseUrl}/projects/${projectId}/tasks/calendar`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(300);
      const inCalendarUnscheduled = await page.evaluate((title) => (document.body.textContent || '').includes(title), title);

      await page.screenshot({ path: path.join(screenshotDir, 'flow-task-cross-view-sync.png') });
      push('AUD-004', 'Functional', 'High', Boolean(createCalled && inKanban && inCalendarUnscheduled), {
        route: `/projects/${projectId}/tasks/*`,
        evidence: 'screenshots/flow-task-cross-view-sync.png',
        createCalled,
        inKanban,
        inCalendarUnscheduled,
        createdTitle: title
      });
    });

    await withPage(browser, { width: 1024, height: 768 }, async (page, log) => {
      await page.goto(`${baseUrl}/projects/${projectId}/documents/${docId}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await sleep(700);
      const marker = `rapid autosave ${Date.now()}`;
      await page.$eval('.tiptap.ProseMirror', (el) => {
        el.scrollIntoView({ block: 'center' });
        el.focus();
      });
      await page.keyboard.type(` ${marker} `);
      await page.goto(`${baseUrl}/projects/${projectId}/tasks/list`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(800);
      const autosaveCall = log.apiResponses.some((r) => r.method === 'PUT' && r.url.includes(`/api/documents/${docId}/content`));
      const persistedContent = await getJson(`${baseUrl}/api/documents/${docId}/content`);
      const persisted = JSON.stringify(persistedContent?.data?.last_snapshot || persistedContent).includes(marker);
      await page.screenshot({ path: path.join(screenshotDir, 'flow-editor-autosave-route-change.png') });
      push('AUD-005', 'Edge Case', 'Medium', Boolean(autosaveCall || persisted), {
        route: `/projects/${projectId}/documents/${docId}`,
        evidence: 'screenshots/flow-editor-autosave-route-change.png',
        autosaveCall,
        persisted
      });
    });

    await fetch(`${baseUrl}/api/comments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        target_type: 'document',
        target_id: docId,
        body: `AUDIT convert seed ${Date.now()}`,
        parent_comment_id: null
      })
    });

    await withPage(browser, { width: 1024, height: 768 }, async (page, log) => {
      await page.goto(`${baseUrl}/projects/${projectId}/documents/${docId}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await sleep(900);
      const commentsOpened = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const commentsButton = buttons.find((button) => {
          const text = (button.textContent || '').trim().toLowerCase();
          return text.endsWith('comments');
        });
        if (!commentsButton) {
          return false;
        }
        commentsButton.click();
        return true;
      });

      if (commentsOpened) {
        await page.waitForSelector('.comment-sidebar', { timeout: 5000 }).catch(() => null);
      }

      const convertClicked = await clickByText(page, 'button', 'convert to task');
      await sleep(400);

      const titleSelector = '#task-title';
      const createButtonSelector = '.modal-content .btn.btn-primary';
      let emptyDisabled = false;
      if (convertClicked) {
        await page.$eval(titleSelector, (el) => {
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await sleep(120);
        emptyDisabled = await page.$eval(createButtonSelector, (btn) => btn.hasAttribute('disabled'));

        const longSpecialTitle = `${'X'.repeat(210)} <> & ' \" \\\\ /`;
        await page.type(titleSelector, longSpecialTitle);
        await page.$eval('#task-description', (el) => {
          el.value = `Special description <>& ' " \\ /\nSecond line`;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await clickByText(page, 'button', 'create task');
        await sleep(700);
      }

      const converted = log.apiResponses.some((r) => r.url.includes('/convert-to-task') && r.status < 400);
      await page.screenshot({ path: path.join(screenshotDir, 'flow-comment-convert-edge.png') });
      push('AUD-006', 'Edge Case', 'High', Boolean(commentsOpened && convertClicked && emptyDisabled && converted), {
        route: `/projects/${projectId}/documents/${docId}`,
        evidence: 'screenshots/flow-comment-convert-edge.png',
        commentsOpened,
        convertClicked,
        emptyDisabled,
        converted
      });
    });

    await withPage(browser, { width: 1024, height: 768 }, async (page, log) => {
      await page.goto(`${baseUrl}/admin/activity`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(300);
      await clickByText(page, 'button', 'export csv');
      await sleep(200);
      const hasComingSoon = log.dialogs.some((d) => d.toLowerCase().includes('coming soon'));
      await page.screenshot({ path: path.join(screenshotDir, 'flow-admin-activity-export.png') });
      push('AUD-007', 'Missing Feature', 'Medium', hasComingSoon, {
        route: '/admin/activity',
        evidence: 'screenshots/flow-admin-activity-export.png',
        dialogs: log.dialogs
      });
    });

    await withPage(browser, { width: 1024, height: 768 }, async (page, log) => {
      await page.goto(`${baseUrl}/users`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(400);
      const inviteOpened = await clickByText(page, 'button', 'invite user');
      await sleep(200);

      let invalidError = null;
      let inviteUrl = null;
      let redeemCalled = false;
      let redeemErrorStatus = null;

      if (inviteOpened) {
        await page.type('input[type="email"]', 'bad-email');
        await clickByText(page, 'button', 'generate invite link');
        await sleep(300);
        invalidError = await page.evaluate(() => {
          const node = Array.from(document.querySelectorAll('*')).find((n) =>
            (n.textContent || '').toLowerCase().includes('invalid email')
          );
          return node ? (node.textContent || '').trim() : null;
        });

        await page.$eval('input[type="email"]', (el) => {
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.type('input[type="email"]', `audit.${Date.now()}@example.com`);
        await clickByText(page, 'button', 'generate invite link');
        await sleep(500);
        inviteUrl = await page.evaluate(() => document.querySelector('.invite-link')?.textContent?.trim() || null);

        if (inviteUrl) {
          const parsed = new URL(inviteUrl);
          parsed.protocol = 'http:';
          parsed.hostname = '127.0.0.1';
          parsed.port = '4311';
          await page.goto(parsed.toString(), { waitUntil: 'domcontentloaded', timeout: 10000 });
          await sleep(250);
          await clickByText(page, 'button', 'accept invitation');
          await sleep(600);
          const redeemCall = log.apiResponses.find((r) => r.url.includes('/api/auth/redeem-magic-link'));
          redeemCalled = Boolean(redeemCall);
          redeemErrorStatus = redeemCall && redeemCall.status >= 400 ? redeemCall.status : null;
        }
      }

      await page.screenshot({ path: path.join(screenshotDir, 'flow-invite-magic-link.png') });
      push('AUD-011', 'Functional', 'High', Boolean(!inviteOpened || !inviteUrl), {
        route: '/users + /invite/:token',
        evidence: 'screenshots/flow-invite-magic-link.png',
        inviteOpened,
        invalidEmailErrorShown: Boolean(invalidError),
        inviteUrlGenerated: Boolean(inviteUrl),
        redeemCalled,
        redeemErrorStatus
      });
    });

    await withPage(browser, { width: 1024, height: 768 }, async (page, log) => {
      await page.goto(`${baseUrl}/projects`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(300);
      await clickByText(page, 'button', 'new project');
      await sleep(150);
      await page.type('input.field-input[type=\"text\"]', `AUDIT-RAPID-${Date.now()}`);
      for (let i = 0; i < 3; i += 1) {
        await clickByText(page, 'button', 'create project');
      }
      await sleep(700);
      const createCalls = log.apiResponses.filter((r) => r.method === 'POST' && r.url.endsWith('/api/projects')).length;
      await page.screenshot({ path: path.join(screenshotDir, 'flow-rapid-project-create.png') });
      push('AUD-012', 'Edge Case', 'Medium', createCalls > 1, {
        route: '/projects',
        evidence: 'screenshots/flow-rapid-project-create.png',
        createCalls
      });
    });

    await withPage(browser, { width: 1024, height: 768 }, async (page) => {
      await page.goto(`${baseUrl}/projects`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(300);
      await page.focus('.actions-button');
      await page.keyboard.press('Enter');
      await sleep(200);
      const menuVisible = (await page.$('.actions-menu')) !== null;
      await page.screenshot({ path: path.join(screenshotDir, 'flow-keyboard-actions-menu.png') });
      push('AUD-008', 'Accessibility', 'High', !menuVisible, {
        route: '/projects',
        evidence: 'screenshots/flow-keyboard-actions-menu.png',
        menuVisible
      });
    });

    await withPage(browser, { width: 320, height: 900 }, async (page) => {
      await page.goto(`${baseUrl}/projects`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(300);
      const metrics = await page.evaluate(() => {
        const main = document.querySelector('.main-content');
        const projectPage = document.querySelector('.projects-page');
        const mRect = main?.getBoundingClientRect() || null;
        const pRect = projectPage?.getBoundingClientRect() || null;
        return {
          viewport: window.innerWidth,
          mainWidth: mRect ? Number(mRect.width.toFixed(1)) : null,
          pageWidth: pRect ? Number(pRect.width.toFixed(1)) : null,
          mainPadding: main ? getComputedStyle(main).padding : null
        };
      });
      await page.screenshot({ path: path.join(screenshotDir, 'flow-mobile-320-layout.png') });
      push('AUD-009', 'Mobile', 'Critical', Boolean(metrics.mainWidth !== null && metrics.mainWidth < 220), {
        route: '/projects',
        evidence: 'screenshots/flow-mobile-320-layout.png',
        metrics
      });
    });

    await withPage(browser, { width: 375, height: 812, isMobile: true, hasTouch: true }, async (page) => {
      await page.goto(`${baseUrl}/projects`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(300);
      const pinState = await page.evaluate(() => {
        const pin = document.querySelector('.pin-button');
        if (!pin) return null;
        const style = getComputedStyle(pin);
        const rect = pin.getBoundingClientRect();
        return {
          opacity: style.opacity,
          pointerEvents: style.pointerEvents,
          width: Number(rect.width.toFixed(1)),
          height: Number(rect.height.toFixed(1))
        };
      });
      await page.screenshot({ path: path.join(screenshotDir, 'flow-mobile-touch-hover-control.png') });
      push('AUD-010', 'Mobile', 'Medium', Boolean(pinState && Number(pinState.opacity) === 0), {
        route: '/projects',
        evidence: 'screenshots/flow-mobile-touch-hover-control.png',
        pinState
      });
    });
  } finally {
    await browser.close();
  }

  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl,
    projectId,
    docId,
    results
  };

  await fs.writeFile(path.join(outDir, 'flow-checks.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify({ scenarios: results.length }, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

