'use strict';

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var sourceProject = path.resolve(__dirname, '..');
var projectRelativePath = path.relative(findGitRoot(sourceProject), sourceProject);

function findGitRoot(cwd) {
  return childProcess.execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: cwd,
    encoding: 'utf8'
  }).trim();
}

function parseArgs(argv) {
  var args = { maxRetries: 2 };
  for (var index = 0; index < argv.length; index += 1) {
    var argument = argv[index];
    if (argument === '--requirement') args.requirement = argv[++index];
    else if (argument === '--resume') args.resume = argv[++index];
    else if (argument === '--config') args.config = argv[++index];
    else if (argument === '--max-retries') args.maxRetries = Number(argv[++index]);
    else if (argument === '--dry-run') args.dryRun = true;
    else if (argument === '--status') args.status = argv[++index];
    else if (argument === '--help') args.help = true;
    else throw new Error('Argumento no reconocido: ' + argument);
  }
  return args;
}

function usage() {
  return [
    'Uso:',
    '  npm run harness -- --requirement "requerimiento claro" --config harness/config.json',
    '  npm run harness -- --resume <ejecución>',
    '  npm run harness -- --status <ejecución>',
    '  npm run harness -- --requirement "..." --dry-run',
    '',
    'El modo completo requiere comandos separados para Judge y Author.'
  ].join('\n');
}

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'change';
}

function executionId(requirement) {
  var stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  var entropy = crypto.randomBytes(4).toString('hex');
  return stamp + '-' + slugify(requirement) + '-' + entropy;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function now() {
  return new Date().toISOString();
}

function isConfigured(step) {
  return step && typeof step.command === 'string' && step.command.trim() !== '';
}

function commandInvocation(command, args) {
  if (process.platform === 'win32' && command === 'npm') {
    var npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    if (!fs.existsSync(npmCli)) throw new Error('No se encontró npm-cli.js para ejecutar la verificación.');
    return { command: process.execPath, args: [npmCli].concat(args || []) };
  }
  return { command: command, args: args || [] };
}

function expandEnvironmentArguments(args) {
  return (args || []).map(function (argument) {
    if (typeof argument !== 'string') return argument;
    return argument.replace(/\$\{([A-Z][A-Z0-9_]*)\}/g, function (match, variable) {
      if (!process.env[variable]) throw new Error('Falta la variable de entorno requerida: ' + variable);
      return process.env[variable];
    });
  });
}

function runCommand(label, step, cwd, state, maxRetries) {
  if (!isConfigured(step)) {
    state.status = 'awaiting-configuration';
    state.waitingFor = label;
    state.history.push({ at: now(), phase: label, status: 'awaiting-configuration' });
    return false;
  }

  for (var attempt = 1; attempt <= maxRetries; attempt += 1) {
    var startedAt = now();
    var output;
    try {
      var invocation = commandInvocation(step.command, expandEnvironmentArguments(step.args));
      output = childProcess.execFileSync(invocation.command, invocation.args, {
        cwd: cwd,
        encoding: 'utf8',
        env: Object.assign({}, process.env, {
          HARNESS_RUN_ID: state.id,
          HARNESS_REQUIREMENT: state.requirement,
          HARNESS_WORKTREE: state.worktree,
          HARNESS_ROLE: label
        }),
        timeout: 300000,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      state.history.push({ at: startedAt, phase: label, status: 'passed', attempt: attempt, output: output.slice(-4000) });
      return true;
    } catch (error) {
      var details = ((error.stdout || '') + '\n' + (error.stderr || '')).slice(-4000);
      state.history.push({ at: startedAt, phase: label, status: 'failed', attempt: attempt, output: details });
      if (attempt === maxRetries) {
        state.status = 'failed';
        state.waitingFor = label;
        return false;
      }
    }
  }
  return false;
}

function testFiles(project) {
  var results = [];
  ['test', 'tests'].forEach(function (folder) {
    var absolute = path.join(project, folder);
    if (!fs.existsSync(absolute)) return;
    walk(absolute, function (file) {
      if (/\.(?:test|spec)\.js$/.test(file) || /[\\/]test\.js$/.test(file)) results.push(file);
    });
  });
  return results.sort();
}

function walk(folder, callback) {
  fs.readdirSync(folder, { withFileTypes: true }).forEach(function (entry) {
    var current = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(current, callback);
    else if (entry.isFile()) callback(current);
  });
}

function lockTests(project, lockFile) {
  var files = testFiles(project);
  if (!files.length) throw new Error('El Judge no produjo pruebas bloqueables.');
  var lock = {
    createdAt: now(),
    files: files.map(function (file) {
      return {
        path: path.relative(project, file).replace(/\\/g, '/'),
        sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
      };
    })
  };
  writeJson(lockFile, lock);
  return lock;
}

function assertTestsUnchanged(project, lockFile) {
  var lock = readJson(lockFile);
  lock.files.forEach(function (entry) {
    var file = path.join(project, entry.path);
    if (!fs.existsSync(file)) throw new Error('Una prueba bloqueada fue eliminada: ' + entry.path);
    var hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (hash !== entry.sha256) throw new Error('Una prueba bloqueada cambió: ' + entry.path);
  });
}

function writeDraftArtifacts(project, changeId, requirement) {
  var change = path.join(project, 'openspec', 'changes', changeId);
  var specification = path.join(change, 'specs', 'autonomous-harness');
  fs.mkdirSync(specification, { recursive: true });
  fs.writeFileSync(path.join(change, 'proposal.md'), [
    '## Why',
    '',
    requirement,
    '',
    '## What Changes',
    '',
    '- Se crea un contrato OpenSpec y un recorrido Judge -> Author -> Referee.',
    '- El Judge redacta pruebas antes de que el Author implemente.',
    '',
    '## Impact',
    '',
    '- Afecta el worktree aislado de esta ejecución y sus artefactos de evidencia.'
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(change, 'design.md'), [
    '## Context',
    '',
    'Cada ejecución usa un worktree y una rama propios para evitar interferencias.',
    '',
    '## Decisions',
    '',
    '- OpenSpec conserva el contrato de requerimientos y tareas.',
    '- FoFo bloquea las pruebas escritas por el Judge antes de autorizar al Author.',
    '- Los errores se enrutan a Judge (pruebas) o Author (código) según el gate.',
    '',
    '## Risks / Trade-offs',
    '',
    '- La separación solo es fuerte cuando Judge y Author son procesos realmente independientes.'
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(change, 'tasks.md'), [
    '## 1. Especificación',
    '- [x] 1.1 Crear propuesta, diseño y criterios de aceptación.',
    '- [ ] 1.2 Judge deriva y bloquea las pruebas.',
    '## 2. Implementación',
    '- [ ] 2.1 Author implementa sin editar pruebas bloqueadas.',
    '## 3. Verificación',
    '- [ ] 3.1 Ejecutar gates FoFo, suites y preparar evidencia/PR.'
  ].join('\n') + '\n');
  fs.writeFileSync(path.join(specification, 'spec.md'), [
    '## ADDED Requirements',
    '',
    '### Requirement: Ejecución aislada y verificable',
    'El sistema SHALL convertir un requerimiento en una ejecución aislada con contrato, pruebas independientes, implementación y verificación.',
    '',
    '#### Scenario: Se inicia un requerimiento',
    '- **WHEN** un operador inicia el harness con un requerimiento claro',
    '- **THEN** el sistema SHALL crear una ejecución con ID, worktree, rama y artefactos OpenSpec propios.',
    '',
    '#### Scenario: El Author intenta alterar pruebas',
    '- **WHEN** las pruebas del Judge están bloqueadas y el Author termina',
    '- **THEN** el sistema SHALL fallar antes de verificación si cambia una huella de prueba bloqueada.'
  ].join('\n') + '\n');
}

function createExecution(root, requirement, configPath, dryRun) {
  var id = executionId(requirement);
  var runDirectory = path.join(root, '.harness', 'runs', id);
  var worktree = path.join(root, '.harness', 'worktrees', id);
  var state = {
    id: id,
    requirement: requirement,
    createdAt: now(),
    updatedAt: now(),
    status: 'created',
    config: configPath,
    worktree: worktree,
    branch: 'harness/' + id,
    changeId: 'harness-' + id,
    history: []
  };
  if (dryRun) return state;

  fs.mkdirSync(path.dirname(runDirectory), { recursive: true });
  childProcess.execFileSync('git', ['worktree', 'add', '-b', state.branch, worktree, 'HEAD'], {
    cwd: root,
    stdio: 'pipe'
  });
  writeJson(path.join(runDirectory, 'state.json'), state);
  return state;
}

function statePath(root, id) {
  return path.join(root, '.harness', 'runs', id, 'state.json');
}

function persist(root, state) {
  state.updatedAt = now();
  writeJson(statePath(root, state.id), state);
}

function ensureOpenSpec(project, state) {
  var cli = path.join(sourceProject, 'node_modules', '@fission-ai', 'openspec', 'bin', 'openspec.js');
  var args = [cli, 'new', 'change', state.changeId, '--goal', state.requirement, '--json'];
  childProcess.execFileSync(process.execPath, args, { cwd: project, encoding: 'utf8', stdio: 'pipe' });
  writeDraftArtifacts(project, state.changeId, state.requirement);
}

function main() {
  var args = parseArgs(process.argv.slice(2));
  if (args.help) return console.log(usage());
  var root = findGitRoot(sourceProject);

  if (args.status) {
    console.log(JSON.stringify(readJson(statePath(root, args.status)), null, 2));
    return;
  }
  if (!args.requirement && !args.resume) throw new Error('Indique --requirement o --resume.\n\n' + usage());
  if (args.requirement && args.resume) throw new Error('Use --requirement o --resume, no ambos.');
  if (!Number.isInteger(args.maxRetries) || args.maxRetries < 1 || args.maxRetries > 5) {
    throw new Error('--max-retries debe estar entre 1 y 5.');
  }

  var requestedConfigPath = path.resolve(sourceProject, args.config || 'harness/config.json');
  var state = args.resume ? readJson(statePath(root, args.resume)) : createExecution(root, args.requirement, requestedConfigPath, args.dryRun);
  if (args.dryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      execution: state.id,
      branch: state.branch,
      phases: ['OpenSpec', 'Judge', 'test-lock', 'Author', 'FoFo gates', 'suites', 'PR']
    }, null, 2));
    return;
  }

  var config = readJson(args.resume ? state.config : requestedConfigPath);
  var project = path.join(state.worktree, projectRelativePath);
  var runDirectory = path.dirname(statePath(root, state.id));
  var lockFile = path.join(runDirectory, 'TEST-LOCK.json');

  if (state.status === 'created') {
    ensureOpenSpec(project, state);
    state.status = 'awaiting-judge';
    state.history.push({ at: now(), phase: 'OpenSpec', status: 'passed' });
    persist(root, state);
  }
  if (state.status === 'awaiting-judge' || state.waitingFor === 'Judge') {
    if (!runCommand('Judge', config.judge, project, state, args.maxRetries)) return persist(root, state);
    if (!runCommand('FoFo-test-lock', config.testLock, project, state, args.maxRetries)) return persist(root, state);
    lockTests(project, lockFile);
    state.status = 'awaiting-author';
    state.waitingFor = undefined;
    state.history.push({ at: now(), phase: 'test-lock', status: 'passed' });
    persist(root, state);
  }
  if (state.status === 'awaiting-author' || state.waitingFor === 'Author') {
    if (!runCommand('Author', config.author, project, state, args.maxRetries)) return persist(root, state);
    assertTestsUnchanged(project, lockFile);
    state.status = 'awaiting-verification';
    state.waitingFor = undefined;
    persist(root, state);
  }
  if (state.status === 'awaiting-verification' || state.waitingFor === 'FoFo') {
    if (!runCommand('FoFo', config.fofo, project, state, args.maxRetries)) return persist(root, state);
    for (var index = 0; index < (config.verification || []).length; index += 1) {
      if (!runCommand('verification-' + index, config.verification[index], project, state, args.maxRetries)) return persist(root, state);
    }
    state.status = 'awaiting-pr';
    state.waitingFor = undefined;
    persist(root, state);
  }
  if (state.status === 'awaiting-pr' || state.waitingFor === 'PR') {
    if (!runCommand('PR', config.pullRequest, project, state, args.maxRetries)) return persist(root, state);
    state.status = 'complete';
    state.waitingFor = undefined;
    state.history.push({ at: now(), phase: 'complete', status: 'passed' });
    persist(root, state);
  }

  console.log(JSON.stringify(state, null, 2));
}

try {
  main();
} catch (error) {
  console.error('Harness error: ' + error.message);
  process.exitCode = 1;
}
