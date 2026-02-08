import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4311';
const outDir = process.env.AUDIT_OUT_DIR || path.resolve('docs/audit-artifacts/frontend-audit-2026-02-06');
const screenshotDir = path.join(outDir, 'screenshots');
const progressFile = path.join(outDir, 'runtime-progress.log');

const viewports = [
  { name: '320', width: 320, height: 900 },
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 }
];
const viewportFilter = (process.env.AUDIT_VIEWPORT || '').trim();
const routeFilter = (process.env.AUDIT_ROUTE_FILTER || '').trim();

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  await fs.mkdir(screenshotDir, { recursive: true });
  await fs.writeFile(progressFile, `start ${new Date().toISOString()}\n`, 'utf8');
  const mark = async (message) => {
    await fs.appendFile(progressFile, `${new Date().toISOString()} ${message}\n`, 'utf8');
  };
  await mark('init');

  const projectsResponse = await getJson(`${baseUrl}/api/projects`);
  await mark('fetched projects');
  const projectList = projectsResponse?.data || [];
  let projectId = null;
  let docId = null;

  for (const project of projectList) {
    const docsResponse = await getJson(`${baseUrl}/api/projects/${project.id}/documents`);
    const firstDoc = docsResponse?.data?.flat?.[0]?.id;
    if (firstDoc) {
      projectId = project.id;
      docId = firstDoc;
      break;
    }
  }

  if (!projectId) {
    projectId = projectList[0]?.id || null;
  }
  await mark('fetched docs');

  if (!projectId) {
    throw new Error('No project found via /api/projects');
  }
  if (!docId) {
    throw new Error(`No document found for any project`);
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

  const selectedViewports = viewportFilter
    ? viewports.filter((v) => v.name === viewportFilter)
    : viewports;

  if (selectedViewports.length === 0) {
    throw new Error(`Unknown AUDIT_VIEWPORT value: ${viewportFilter}`);
  }

  const selectedRoutes = routeFilter ? routes.filter((r) => r.includes(routeFilter)) : routes;
  if (selectedRoutes.length === 0) {
    throw new Error(`No routes matched AUDIT_ROUTE_FILTER=${routeFilter}`);
  }

  const browser = await puppeteer.launch({ headless: true });
  await mark('browser launched');
  const sweep = [];

  try {
    for (const viewport of selectedViewports) {
      for (const route of selectedRoutes) {
        await mark(`begin ${viewport.name} ${route}`);
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
          await mark(`goto start ${viewport.name} ${route}`);
          const response = await page.goto(`${baseUrl}${route}`, {
            waitUntil: 'domcontentloaded',
            timeout: 8000
          });
          status = response?.status() ?? null;
          await mark(`goto ok ${viewport.name} ${route} ${status}`);
        } catch (error) {
          navigationError = String(error?.message || error);
          await mark(`goto fail ${viewport.name} ${route} ${navigationError}`);
        }

        await sleep(150);
        await mark(`postwait ${viewport.name} ${route}`);

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
        await mark(`evaluated ${viewport.name} ${route}`);

        const critical =
          Boolean(navigationError) ||
          pageErrors.length > 0 ||
          apiErrors.length > 0 ||
          (layout.hasHorizontalOverflow && viewport.width <= 768) ||
          (viewport.width <= 375 && layout.mainContentWidth !== null && layout.mainContentWidth < 220);

        let screenshot = null;
        if (critical) {
          screenshot = `${viewport.name}-${sanitize(route)}.png`;
          await mark(`screenshot start ${viewport.name} ${route}`);
          await page.screenshot({
            path: path.join(screenshotDir, screenshot),
            fullPage: false
          });
          await mark(`screenshot ok ${viewport.name} ${route}`);
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

        await fs.writeFile(
          path.join(outDir, `runtime-sweep-checkpoint-${viewport.name}.json`),
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              viewport: viewport.name,
              completedChecks: sweep.length,
              sweep
            },
            null,
            2
          ),
          'utf8'
        );

        await page.close();
        await mark(`closed ${viewport.name} ${route}`);
      }
    }
  } finally {
    await browser.close();
    await mark('browser closed');
  }

  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl,
    viewports: selectedViewports,
    routes: selectedRoutes,
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

  const suffix = selectedViewports.map((v) => v.name).join('-');
  await fs.writeFile(path.join(outDir, `runtime-sweep-${suffix}.json`), JSON.stringify(summary, null, 2), 'utf8');
  await mark('summary written');
  console.log(JSON.stringify(summary.counts, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
