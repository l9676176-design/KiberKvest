import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const requiredPaths = [
  '../.github/workflows/tests.yml',
  '../.env.example',
  '../AGENTS.md',
  '../CHANGELOG.md',
  '../PROJECT_STATUS.md',
  '../README.md',
  '../ROADMAP.md',
  '../config/README.md',
  '../docs/ARCHITECTURE.md',
  '../docs/DEPLOYMENT.md',
  '../docs/PROJECT_STRUCTURE.md',
  '../docs/SECURITY.md',
  '../docs/SETUP.md',
  '../docs/TESTING.md',
  '../docs/brief.md',
  '../docs/research.md',
  '../src/index.html',
];

test('репозиторий соответствует утверждённой структуре проектов', async () => {
  for (const relativePath of requiredPaths) {
    await access(new URL(relativePath, import.meta.url));
  }
});

test('сервер и сборка используют src как источник приложения', async () => {
  const server = await readFile(new URL('../scripts/server.mjs', import.meta.url), 'utf8');
  const build = await readFile(new URL('../scripts/build-offline.ps1', import.meta.url), 'utf8');

  assert.match(server, /\.\.\/src/);
  assert.doesNotMatch(server, /\.\.\/app/);
  assert.match(build, /'src\\\*'/);
  assert.doesNotMatch(build, /'app\\\*'/);
});
