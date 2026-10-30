import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleLifecycle } from '../.rsc/session-memory-adapter.mjs';

const fixtureRoot = mkdtempSync(join(tmpdir(), 'una-chat-harness-'));
const gitRoot = join(fixtureRoot, 'git-root');
const projectRoot = join(gitRoot, 'antes');
const previousProjectCwd = process.env.RSC_PROJECT_CWD;

try {
  mkdirSync(join(projectRoot, '.rsc'), { recursive: true });
  writeFileSync(join(projectRoot, '.rsc.json'), '{"memory":{}}\n');
  process.env.RSC_PROJECT_CWD = projectRoot;

  const result = handleLifecycle({
    target: 'codex',
    event: 'request',
    native: { cwd: gitRoot, session_id: 'nested-root-fixture' }
  });

  assert.equal(result.degraded, false);
  assert.equal(existsSync(join(projectRoot, '.rsc', 'memory')), true);
  assert.equal(existsSync(join(gitRoot, '.rsc', 'memory')), false);
  process.stdout.write('nested harness root: PASS\n');
} finally {
  if (previousProjectCwd === undefined) delete process.env.RSC_PROJECT_CWD;
  else process.env.RSC_PROJECT_CWD = previousProjectCwd;
  rmSync(fixtureRoot, { recursive: true, force: true });
}
