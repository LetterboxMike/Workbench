import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import puppeteer from 'puppeteer';

const PORT = Number(process.env.WORKBENCH_TEST_PORT || 4300 + Math.floor(Math.random() * 900));
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SERVER_START_TIMEOUT_MS = 90000;

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const buildUrl = (path) => `${BASE_URL}${path}`;

const readJsonSafe = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const createClient = () => {
  const cookies = new Map();

  const upsertCookies = (response) => {
    if (typeof response.headers.getSetCookie === 'function') {
      const setCookieHeaders = response.headers.getSetCookie();

      for (const cookieLine of setCookieHeaders) {
        const pair = cookieLine.split(';')[0];
        const separatorIndex = pair.indexOf('=');

        if (separatorIndex < 0) {
          continue;
        }

        const key = pair.slice(0, separatorIndex).trim();
        const value = pair.slice(separatorIndex + 1).trim();

        if (value) {
          cookies.set(key, value);
        } else {
          cookies.delete(key);
        }
      }
    }
  };

  const cookieHeader = () =>
    Array.from(cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');

  const request = async (path, { method = 'GET', body, expectedStatus = 200 } = {}) => {
    const headers = {
      Accept: 'application/json'
    };

    const existingCookieHeader = cookieHeader();

    if (existingCookieHeader) {
      headers.Cookie = existingCookieHeader;
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual'
    });

    upsertCookies(response);
    const payload = await readJsonSafe(response);

    if (response.status !== expectedStatus) {
      const location = response.headers.get('location');
      throw new Error(
        `${method} ${path} expected ${expectedStatus}, got ${response.status}${location ? ` (location: ${location})` : ''}\n${JSON.stringify(payload, null, 2)}`
      );
    }

    return payload;
  };

  return {
    get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
    patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
    cookieObjects: () =>
      Array.from(cookies.entries()).map(([name, value]) => ({
        name,
        value,
        url: BASE_URL
      }))
  };
};

const clickButtonByText = async (page, text) => {
  const clicked = await page.evaluate((targetText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const candidate = buttons.find((button) => (button.textContent || '').trim().toLowerCase() === targetText.toLowerCase());
    if (!candidate) {
      return false;
    }
    candidate.click();
    return true;
  }, text);

  return clicked;
};

const waitForServer = async () => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SERVER_START_TIMEOUT_MS) {
    try {
      const response = await fetch(buildUrl('/api/auth/session'));

      if (response.status === 401 || response.status === 200) {
        return;
      }
    } catch {
      // Server not ready yet.
    }

    await sleep(750);
  }

  throw new Error(`Timed out waiting for server on ${BASE_URL}`);
};

const runScenario = async () => {
  const userA = createClient();
  const userB = createClient();

  const runId = Date.now().toString(36);
  const ownerEmail = `owner-a-${runId}@workbench-integration.test`;
  const memberEmail = `member-b-${runId}@workbench-integration.test`;
  const password = 'Password123!';

  const signupA = await userA.post('/api/auth/signup', {
    name: 'Owner A',
    email: ownerEmail,
    password
  });

  const ownerId = signupA?.data?.user?.id;
  assert.ok(ownerId, 'owner signup should return user id');

  const sessionA = await userA.get('/api/auth/session');
  assert.equal(sessionA?.data?.auth_mode, 'local', 'auth mode should be local in integration environment');
  assert.ok(sessionA?.data?.active_org_id, 'owner should have active organization');
  assert.ok(Array.isArray(sessionA?.data?.organizations), 'owner organizations should be returned');
  assert.equal(sessionA.data.organizations[0]?.system_role, 'super_admin', 'owner should be super_admin');

  const orgAId = sessionA.data.active_org_id;

  const projectA = await userA.post('/api/projects', {
    name: 'Org A Project'
  });
  const projectAId = projectA?.data?.id;
  assert.ok(projectAId, 'project A should be created');

  await userA.get(`/api/projects/${projectAId}/members`);

  await userA.post(`/api/projects/${projectAId}/members`, {
    email: memberEmail,
    role: 'editor'
  });

  const signupB = await userB.post('/api/auth/signup', {
    name: 'Member B',
    email: memberEmail,
    password
  });
  const memberId = signupB?.data?.user?.id;
  assert.ok(memberId, 'member signup should return user id');

  const sessionB = await userB.get('/api/auth/session');
  assert.ok(sessionB?.data?.organizations?.some((org) => org.id === orgAId), 'member should be added to invited org');
  assert.equal(sessionB?.data?.organizations?.find((org) => org.id === orgAId)?.system_role, 'member');

  const memberProjects = await userB.get('/api/projects');
  assert.ok(memberProjects?.data?.some((project) => project.id === projectAId), 'member should see invited project');

  await userB.get('/api/activity', { expectedStatus: 403 });

  const orgB = await userB.post('/api/orgs', { name: 'Org B Tenant' });
  const orgBId = orgB?.data?.id;
  assert.ok(orgBId, 'member should be able to create own org');

  await userB.post('/api/auth/switch-org', { org_id: orgBId });

  const projectsInOrgB = await userB.get('/api/projects');
  assert.equal(projectsInOrgB.data.length, 0, 'new org should start with zero projects');

  const projectB = await userB.post('/api/projects', { name: 'Org B Project' });
  const projectBId = projectB?.data?.id;
  assert.ok(projectBId, 'member should create project in org B');

  await userA.get(`/api/projects/${projectBId}`, { expectedStatus: 403 });

  await userB.post('/api/auth/switch-org', { org_id: orgAId });
  await userB.get(`/api/projects/${projectAId}`, { expectedStatus: 200 });

  await userB.patch(`/api/orgs/${orgAId}/members/${ownerId}`, { system_role: 'member' }, { expectedStatus: 403 });

  const activityForOwner = await userA.get('/api/activity');
  assert.ok(Array.isArray(activityForOwner?.data), 'owner activity should return array');
};

const runCommentConvertScenario = async () => {
  const client = createClient();
  const runId = Date.now().toString(36);
  const email = `comment-e2e-${runId}@workbench-integration.test`;
  const password = 'Password123!';

  await client.post('/api/auth/signup', {
    name: 'Comment E2E User',
    email,
    password
  });

  const projectResponse = await client.post('/api/projects', {
    name: `Comment Convert ${runId}`
  });
  const projectId = projectResponse?.data?.id;
  assert.ok(projectId, 'comment convert scenario should create a project');

  const documentResponse = await client.post(`/api/projects/${projectId}/documents`, {
    title: `Comment Convert Doc ${runId}`
  });
  const documentId = documentResponse?.data?.id;
  assert.ok(documentId, 'comment convert scenario should create a document');

  const commentBody = `Comment convert seed ${runId}`;
  const commentResponse = await client.post('/api/comments', {
    target_type: 'document',
    target_id: documentId,
    parent_comment_id: null,
    body: commentBody
  });
  const commentId = commentResponse?.data?.id;
  assert.ok(commentId, 'comment convert scenario should create a comment');

  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setCookie(...client.cookieObjects());
    await page.goto(buildUrl(`/projects/${projectId}/documents/${documentId}`), {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    await page.waitForSelector('.toolbar', { timeout: 10000 });
    const openedComments = await page.evaluate(() => {
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
    assert.ok(openedComments, 'should open comments sidebar from toolbar');
    await page.waitForSelector('.comment-sidebar', { timeout: 10000 });

    await page.waitForFunction(
      () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some((button) => (button.textContent || '').toLowerCase().includes('convert to task'));
      },
      { timeout: 10000 }
    );

    const openedConvertModal = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const convertButton = buttons.find((button) =>
        (button.textContent || '').trim().toLowerCase().includes('convert to task')
      );

      if (!convertButton) {
        return false;
      }

      convertButton.click();
      return true;
    });
    assert.ok(openedConvertModal, 'should open convert-to-task modal');

    await page.waitForSelector('#task-title', { timeout: 10000 });
    await page.$eval('#task-title', (input) => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const createDisabledWhenEmpty = await page.$eval('.modal-footer .btn.btn-primary', (button) =>
      button.hasAttribute('disabled')
    );
    assert.equal(createDisabledWhenEmpty, true, 'Create task button must be disabled when title is empty');

    const specialTitle = `Comment Convert ${runId} ${'X'.repeat(120)} <> & ' \" /`;
    await page.type('#task-title', specialTitle);

    const convertResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes(`/api/comments/${commentId}/convert-to-task`),
      { timeout: 15000 }
    );

    const clickedCreate = await clickButtonByText(page, 'Create Task');
    assert.ok(clickedCreate, 'should submit convert-to-task modal');

    const convertResponse = await convertResponsePromise;
    assert.ok(convertResponse.status() < 400, `convert-to-task should succeed, got ${convertResponse.status()}`);
  } finally {
    await browser.close();
  }

  const taskList = await client.get(`/api/projects/${projectId}/tasks`);
  const createdTask = taskList?.data?.find((task) => task.title.includes(`Comment Convert ${runId}`));
  assert.ok(createdTask, 'converted task should exist in project task list');
  assert.equal(createdTask.source_document_id, documentId, 'converted task should preserve source document link');
  assert.ok(
    String(createdTask.description || '').includes(`#comment-${commentId}`),
    'converted task description should include backlink to source comment'
  );

  const commentsResponse = await client.get(`/api/comments?target_type=document&target_id=${documentId}`);
  const convertedComment = commentsResponse?.data?.find((comment) => comment.id === commentId);
  assert.equal(
    convertedComment?.metadata?.converted_to_task_id,
    createdTask.id,
    'comment metadata should store converted task id'
  );
};

const startServer = () => {
  const child = spawn('node', ['.output/server/index.mjs'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(PORT),
      NITRO_PORT: String(PORT),
      HOST: '127.0.0.1',
      NITRO_HOST: '127.0.0.1'
    }
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[nuxt] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[nuxt] ${chunk}`);
  });

  return child;
};

const stopServer = async (child) => {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGINT');
  await sleep(500);

  if (!child.killed) {
    child.kill('SIGTERM');
  }
};

const main = async () => {
  await new Promise((resolve, reject) => {
    const build = spawn(`${npmBin} run build`, {
      stdio: 'inherit',
      shell: true
    });

    build.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`Build failed with exit code ${code}`));
    });

    build.on('error', reject);
  });

  const server = startServer();

  try {
    await waitForServer();
    await runScenario();
    await runCommentConvertScenario();
    console.log('\nIntegration auth/tenant scenario passed.');
  } finally {
    await stopServer(server);
  }
};

main().catch((error) => {
  console.error('\nIntegration auth/tenant scenario failed.');
  console.error(error);
  process.exit(1);
});
