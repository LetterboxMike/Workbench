import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4311';
const outDir = process.env.AUDIT_OUT_DIR || path.resolve('docs/audit-artifacts/frontend-audit-2026-02-06');
const screenshotDir = path.join(outDir, 'screenshots');

const viewports = [
  { name: '320', width: 320, height: 900 },
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 }
];

const getJson = async (url) => {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
};

const sanitize = (route) =>
  route
    .replace(/^\/+/, '')
    .replace(/[/:?&=]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'root';

const run = async () => {
  await fs.mkdir(screenshotDir, { recursive: true });

  const projectsResponse = await getJson(`${baseUrl}/api/projects`);
  const projectId = projectsResponse?.data?.[0]?.id;
  if (!projectId) {
    throw new Error('No project found via /api/projects');
  }

  const docsResponse = await getJson(`${baseUrl}/api/projects/${projectId}/documents`);
  const docId = docsResponse?.data?.flat?.[0]?.id;
  if (!docId) {
    throw new Error(`No document found for project ${projectId}`);
  }

  const routes = [
    '/projects',
    '/notifications',
    '/users',
    '/settings',
    '/admin',
    '/admin/members',
    '/admin/activity',
    '/admin/settings',
    `/projects/${projectId}`,
    `/projects/${projectId}/tasks`,
    `/projects/${projectId}/tasks/list`,
    `/projects/${projectId}/tasks/kanban`,
    `/projects/${projectId}/tasks/calendar`,
    `/projects/${projectId}/documents`,
    `/projects/${projectId}/documents/${docId}`
  ];

  const browser = await puppeteer.launch({ headless: true });
  const sweep = [];

  for (const viewport of viewports) {
    for (const route of routes) {
      const page = await browser.newPage();
      await page.setViewport({ width: viewport.width, height: viewport.height });

      const consoleErrors = [];
      const pageErrors = [];
      const apiErrors = [];
      const requestFailures = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('/api/') && response.status() >= 400) {
          apiErrors.push({
            status: response.status(),
            method: response.request().method(),
            url
          });
        }
      });
      page.on('requestfailed', (request) => {
        requestFailures.push({
          method: request.method(),
          url: request.url(),
          reason: request.failure()?.errorText || 'unknown'
        });
      });

      let status = null;
      let navigationError = null;
      try {
        const response = await page.goto(`${baseUrl}${route}`, {
          waitUntil: 'networkidle2',
          timeout: 45000
        });
        status = response?.status() ?? null;
      } catch (error) {
        navigationError = String(error?.message || error);
      }

      await page.waitForTimeout(500);

      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const main = document.querySelector('.main-content');
        const mainRect = main?.getBoundingClientRect() || null;
        const mainStyle = main ? getComputedStyle(main) : null;

        const interactive = Array.from(
          document.querySelectorAll('a,button,input,select,textarea,[role="button"],[tabindex]')
        );
        const touchViolations = interactive
          .map((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
            if (!visible) return null;
            if (rect.width >= 44 && rect.height >= 44) return null;
            return {
              tag: element.tagName.toLowerCase(),
              text: (element.textContent || '').trim().slice(0, 60),
              width: Number(rect.width.toFixed(1)),
              height: Number(rect.height.toFixed(1))
            };
          })
          .filter(Boolean);

        return {
          viewportWidth: window.innerWidth,
          documentWidth: root.scrollWidth,
          hasHorizontalOverflow: root.scrollWidth > window.innerWidth + 1,
          mainContentWidth: mainRect ? Number(mainRect.width.toFixed(1)) : null,
          mainContentPadding: mainStyle ? `${mainStyle.paddingTop} ${mainStyle.paddingRight} ${mainStyle.paddingBottom} ${mainStyle.paddingLeft}` : null,
          touchViolationCount: touchViolations.length,
          touchViolations: touchViolations.slice(0, 30),
          focusableCount: interactive.length
        };
      });

      const critical =
        Boolean(navigationError) ||
        pageErrors.length > 0 ||
        apiErrors.length > 0 ||
        (layout.hasHorizontalOverflow && viewport.width <= 768) ||
        (viewport.width <= 375 && layout.mainContentWidth !== null && layout.mainContentWidth < 220);

      let screenshot = null;
      if (critical) {
        screenshot = `${viewport.name}-${sanitize(route)}.png`;
        await page.screenshot({
          path: path.join(screenshotDir, screenshot),
          fullPage: true
        });
      }

      sweep.push({
        viewport: viewport.name,
        width: viewport.width,
        route,
        status,
        navigationError,
        consoleErrors,
        pageErrors,
        apiErrors,
        requestFailures,
        layout,
        screenshot
      });

      await page.close();
    }
  }

  await browser.close();

  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl,
    viewports,
    routes,
    counts: {
      totalChecks: sweep.length,
      checksWithApiErrors: sweep.filter((x) => x.apiErrors.length > 0).length,
      checksWithConsoleErrors: sweep.filter((x) => x.consoleErrors.length > 0).length,
      checksWithPageErrors: sweep.filter((x) => x.pageErrors.length > 0).length,
      checksWithHorizontalOverflow: sweep.filter((x) => x.layout.hasHorizontalOverflow).length,
      checksWithTouchViolations: sweep.filter((x) => x.layout.touchViolationCount > 0).length
    },
    projectId,
    docId,
    sweep
  };

  await fs.writeFile(path.join(outDir, 'runtime-sweep.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify(summary.counts, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
