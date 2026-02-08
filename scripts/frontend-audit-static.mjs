import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outDir = process.env.AUDIT_OUT_DIR || path.resolve('docs/audit-artifacts/frontend-audit-2026-02-06');

const TARGET_DIRS = ['pages', 'components', 'composables'];

const toPosix = (p) => p.split(path.sep).join('/');

const walk = async (dir) => {
  const full = path.join(root, dir);
  const out = [];

  const visit = async (current) => {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(next);
      } else if (/\.(vue|ts|js|mjs)$/.test(entry.name)) {
        out.push(next);
      }
    }
  };

  await visit(full);
  return out;
};

const normalizeFrontendPath = (raw) => {
  let p = raw.split('?')[0];
  p = p.replace(/\$\{[^}]+\}/g, ':param');
  return p;
};

const serverRouteFromFile = (file) => {
  const rel = toPosix(path.relative(path.join(root, 'server', 'api'), file));
  const noExt = rel.replace(/\.(ts|js|mjs)$/, '');
  const parts = noExt.split('/');
  const last = parts.at(-1) || '';
  const methodMatch = last.match(/\.(get|post|put|patch|delete)$/);
  if (!methodMatch) return null;

  const method = methodMatch[1].toUpperCase();
  parts[parts.length - 1] = last.replace(/\.(get|post|put|patch|delete)$/, '');

  const routeParts = parts
    .filter((p) => p !== 'index')
    .map((p) => {
      if (p.startsWith('[') && p.endsWith(']')) return `:${p.slice(1, -1)}`;
      return p;
    });

  return {
    method,
    path: `/${routeParts.join('/')}`.replace(/\/+/g, '/'),
    file: toPosix(path.relative(root, file))
  };
};

const matchRoute = (frontendPath, method, serverRoute) => {
  if (method !== serverRoute.method) return false;
  const fParts = frontendPath.split('/').filter(Boolean);
  const sParts = serverRoute.path.split('/').filter(Boolean);
  if (fParts.length !== sParts.length) return false;
  for (let i = 0; i < fParts.length; i += 1) {
    if (sParts[i].startsWith(':')) continue;
    if (fParts[i] !== sParts[i]) return false;
  }
  return true;
};

const run = async () => {
  await fs.mkdir(outDir, { recursive: true });

  const frontendFiles = (await Promise.all(TARGET_DIRS.map((d) => walk(d)))).flat();
  const callRegex = /api\.(get|post|patch|put|del|delete)\(\s*([`'"])(\/api\/[^`'"]*)\2/g;

  const frontendCalls = [];

  for (const file of frontendFiles) {
    const content = await fs.readFile(file, 'utf8');
    for (const match of content.matchAll(callRegex)) {
      const apiMethod = match[1];
      const rawPath = match[3];
      const method = apiMethod === 'del' || apiMethod === 'delete' ? 'DELETE' : apiMethod.toUpperCase();
      frontendCalls.push({
        method,
        rawMethod: apiMethod,
        rawPath,
        normalizedPath: normalizeFrontendPath(rawPath),
        file: toPosix(path.relative(root, file))
      });
    }
  }

  const serverFiles = await walk(path.join('server', 'api'));
  const serverRoutes = serverFiles.map(serverRouteFromFile).filter(Boolean);

  const unresolvedCalls = frontendCalls.filter(
    (call) => !serverRoutes.some((route) => matchRoute(call.normalizedPath.replace('/api', ''), call.method, route))
  );

  const deleteWrapperMisuse = frontendCalls.filter((call) => call.rawMethod === 'delete');

  const componentDtsPath = path.join(root, '.nuxt', 'components.d.ts');
  let componentDts = '';
  try {
    componentDts = await fs.readFile(componentDtsPath, 'utf8');
  } catch {
    componentDts = '';
  }
  const hasPrimaryButton = /export const PrimaryButton:/.test(componentDts);
  const hasInputField = /export const InputField:/.test(componentDts);

  const report = {
    timestamp: new Date().toISOString(),
    frontendCallCount: frontendCalls.length,
    backendRouteCount: serverRoutes.length,
    frontendCalls,
    serverRoutes,
    unresolvedCalls,
    deleteWrapperMisuse,
    componentRegistrationChecks: {
      hasPrimaryButton,
      hasInputField,
      checkedFile: toPosix(path.relative(root, componentDtsPath))
    }
  };

  await fs.writeFile(path.join(outDir, 'static-wiring.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        frontendCallCount: frontendCalls.length,
        backendRouteCount: serverRoutes.length,
        unresolvedCalls: unresolvedCalls.length,
        deleteWrapperMisuse: deleteWrapperMisuse.length
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
