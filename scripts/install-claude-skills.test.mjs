import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repository = fileURLToPath(new URL('../', import.meta.url));
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-threejs-installer-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'source checkout');
  const project = path.join(root, 'app with spaces');
  fs.mkdirSync(path.join(source, 'scripts'), { recursive: true }); fs.mkdirSync(project);
  for (const file of ['package.json', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'scripts/install-claude-skills.mjs']) fs.copyFileSync(path.join(repository, file), path.join(source, file));
  fs.cpSync(path.join(repository, 'skills'), path.join(source, 'skills'), { recursive: true });
  const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json')));
  return { root, source, project, pkg, destination: path.join(project, '.claude/skills'), state: path.join(project, '.claude/threejs-skills-install.json'), backups: path.join(project, '.claude/threejs-skill-backups') };
}
function cli(f, ...args) {
  return spawnSync(process.execPath, [path.join(f.source, 'scripts/install-claude-skills.mjs'), '--project', f.project, ...args], { encoding: 'utf8', cwd: f.root });
}
function success(result) { assert.equal(result.status, 0, result.stdout + result.stderr); }
const contents = file => fs.readFileSync(file, 'utf8');
function snapshot(dir) {
  const result = {};
  const visit = (current, prefix = '') => {
    for (const file of fs.readdirSync(current).sort()) {
      const full = path.join(current, file), key = prefix + file, stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) result[key] = `link:${fs.readlinkSync(full)}`;
      else if (stat.isDirectory()) visit(full, key + '/');
      else result[key] = fs.readFileSync(full).toString('base64');
    }
  };
  visit(dir); return result;
}

test('fresh install copies all 24 skills, references, nested assets and notices; check is read-only', t => {
  const f = fixture(t), entry = f.pkg.agents.skills[0];
  fs.mkdirSync(path.join(f.source, entry.path, 'assets/nested'), { recursive: true });
  fs.writeFileSync(path.join(f.source, entry.path, 'assets/nested/example.txt'), 'asset');
  success(cli(f));
  assert.equal(fs.readdirSync(f.destination).length, 24);
  for (const entry of f.pkg.agents.skills) {
    for (const file of ['SKILL.md', 'references/methods.md', 'references/examples.md', 'references/anti-patterns.md']) assert.equal(contents(path.join(f.destination, entry.name, file)), contents(path.join(f.source, entry.path, file)));
    assert.equal(contents(path.join(f.destination, entry.name, 'LICENSE')), contents(path.join(f.source, 'LICENSE')));
  }
  assert.equal(contents(path.join(f.destination, entry.name, 'assets/nested/example.txt')), 'asset');
  const before = snapshot(f.project); success(cli(f, '--check')); assert.deepEqual(snapshot(f.project), before);
});

test('repeating installation does not rewrite or back up an unchanged installation', t => {
  const f = fixture(t); success(cli(f));
  const before = snapshot(f.project), result = cli(f); success(result);
  assert.match(result.stdout, /Already up to date/); assert.deepEqual(snapshot(f.project), before);
  assert.equal(fs.existsSync(f.backups), false);
});

test('updates add new files and remove obsolete files, retaining a complete backup', t => {
  const f = fixture(t), entry = f.pkg.agents.skills[0], directory = path.join(f.source, entry.path);
  fs.writeFileSync(path.join(directory, 'old-reference.md'), 'old data'); success(cli(f));
  fs.rmSync(path.join(directory, 'old-reference.md')); fs.writeFileSync(path.join(directory, 'new-reference.md'), 'new data');
  fs.appendFileSync(path.join(directory, 'SKILL.md'), '\nUpdated example.\n'); success(cli(f));
  assert.equal(fs.existsSync(path.join(f.destination, entry.name, 'old-reference.md')), false);
  assert.equal(contents(path.join(f.destination, entry.name, 'new-reference.md')), 'new data');
  const backup = path.join(f.backups, fs.readdirSync(f.backups)[0]);
  assert.equal(contents(path.join(backup, 'skills', entry.name, 'old-reference.md')), 'old data');
  assert(fs.existsSync(path.join(backup, 'threejs-skills-install.json'))); success(cli(f, '--check'));
});

test('local edits block the entire update before any other skill is replaced', t => {
  const f = fixture(t), [a, b] = f.pkg.agents.skills; success(cli(f));
  fs.appendFileSync(path.join(f.destination, a.name, 'SKILL.md'), '\nMy local notes.');
  fs.appendFileSync(path.join(f.source, b.path, 'SKILL.md'), '\nNew upstream recipe.');
  const before = snapshot(f.project), result = cli(f);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Local changes/); assert.deepEqual(snapshot(f.project), before);
});

test('--force preserves edited and added local files outside the discovered skills', t => {
  const f = fixture(t), entry = f.pkg.agents.skills[0]; success(cli(f));
  const target = path.join(f.destination, entry.name);
  fs.appendFileSync(path.join(target, 'SKILL.md'), '\nMy changes.');
  fs.writeFileSync(path.join(target, 'my-custom-file.md'), 'personal addition');
  const edited = contents(path.join(target, 'SKILL.md')); success(cli(f, '--force'));
  const backup = path.join(f.backups, fs.readdirSync(f.backups)[0]);
  assert.equal(contents(path.join(backup, 'skills', entry.name, 'SKILL.md')), edited);
  assert.equal(contents(path.join(backup, 'skills', entry.name, 'my-custom-file.md')), 'personal addition');
  assert.equal(fs.existsSync(path.join(target, 'my-custom-file.md')), false);
  assert.equal(path.relative(f.destination, backup).startsWith('..'), true); success(cli(f, '--check'));
});

test('unrelated skills and the app CLAUDE.md remain unchanged', t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.destination, 'threejs-personal'), { recursive: true });
  fs.writeFileSync(path.join(f.destination, 'threejs-personal/SKILL.md'), 'Personal skill');
  fs.writeFileSync(path.join(f.project, 'CLAUDE.md'), 'Application instructions'); success(cli(f));
  assert.equal(contents(path.join(f.project, 'CLAUDE.md')), 'Application instructions');
  assert.equal(contents(path.join(f.destination, 'threejs-personal/SKILL.md')), 'Personal skill');
});

test('matching manual copies can be adopted without a prior installation record', t => {
  const f = fixture(t);
  for (const entry of f.pkg.agents.skills) {
    fs.cpSync(path.join(f.source, entry.path), path.join(f.destination, entry.name), { recursive: true });
  }
  success(cli(f)); success(cli(f, '--check'));
});

test('different pre-existing skills need explicit --force and are backed up', t => {
  const f = fixture(t), name = f.pkg.agents.skills[0].name;
  fs.mkdirSync(path.join(f.destination, name), { recursive: true });
  fs.writeFileSync(path.join(f.destination, name, 'SKILL.md'), 'Old manually installed version');
  const before = snapshot(f.project); assert.notEqual(cli(f).status, 0); assert.deepEqual(snapshot(f.project), before);
  success(cli(f, '--force')); success(cli(f, '--check'));
});

test('--check detects missing and extra files without modifying the installation', t => {
  const f = fixture(t), name = f.pkg.agents.skills[0].name; success(cli(f));
  fs.rmSync(path.join(f.destination, name, 'references/examples.md'));
  fs.writeFileSync(path.join(f.destination, name, 'extra.md'), 'custom');
  const before = snapshot(f.project); assert.notEqual(cli(f, '--check').status, 0); assert.deepEqual(snapshot(f.project), before);
});

test('a malformed installation record blocks writes', t => {
  const f = fixture(t); success(cli(f)); fs.writeFileSync(f.state, '{broken JSON');
  const before = snapshot(f.project); assert.notEqual(cli(f, '--force').status, 0); assert.deepEqual(snapshot(f.project), before);
});

test('missing required source references block installation before creating .claude', t => {
  const f = fixture(t); fs.rmSync(path.join(f.source, f.pkg.agents.skills[0].path, 'references/examples.md'));
  assert.notEqual(cli(f).status, 0); assert.equal(fs.existsSync(path.join(f.project, '.claude')), false);
});

test('unregistered source skills and duplicate package entries are rejected', t => {
  const f = fixture(t), pkgPath = path.join(f.source, 'package.json');
  f.pkg.agents.skills.pop(); fs.writeFileSync(pkgPath, JSON.stringify(f.pkg)); assert.notEqual(cli(f).status, 0);
  f.pkg.agents.skills.push(f.pkg.agents.skills[0]); fs.writeFileSync(pkgPath, JSON.stringify(f.pkg)); assert.notEqual(cli(f).status, 0);
  assert.equal(fs.existsSync(path.join(f.project, '.claude')), false);
});

test('retired managed skills are removed with backup; unrelated skills survive', t => {
  const f = fixture(t); success(cli(f)); const removed = f.pkg.agents.skills.pop();
  fs.rmSync(path.join(f.source, removed.path), { recursive: true });
  fs.writeFileSync(path.join(f.source, 'package.json'), JSON.stringify(f.pkg));
  fs.mkdirSync(path.join(f.destination, 'my-skill')); fs.writeFileSync(path.join(f.destination, 'my-skill/SKILL.md'), 'Keep');
  success(cli(f)); assert.equal(fs.existsSync(path.join(f.destination, removed.name)), false);
  assert.equal(contents(path.join(f.destination, 'my-skill/SKILL.md')), 'Keep'); success(cli(f, '--check'));
});

test('linked installation paths are refused rather than modifying another directory', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t), outside = path.join(f.root, 'outside'); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(f.project, '.claude'), 'dir');
  assert.notEqual(cli(f, '--force').status, 0); assert.deepEqual(fs.readdirSync(outside), []);
});

test('linked files inside installed skills cannot be followed or overwritten', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t); success(cli(f)); const outside = path.join(f.root, 'outside.txt'); fs.writeFileSync(outside, 'Keep me');
  fs.symlinkSync(outside, path.join(f.destination, f.pkg.agents.skills[0].name, 'linked.txt'));
  const before = snapshot(f.project); assert.notEqual(cli(f, '--force').status, 0); assert.deepEqual(snapshot(f.project), before); assert.equal(contents(outside), 'Keep me');
});

test('help works without dependencies and invalid flags fail', t => {
  const f = fixture(t); success(cli(f, '--help')); assert.notEqual(cli(f, '--check', '--force').status, 0);
  const noProject = spawnSync(process.execPath, [path.join(f.source, 'scripts/install-claude-skills.mjs')], { encoding: 'utf8' });
  assert.notEqual(noProject.status, 0); assert.equal(fs.existsSync(path.join(f.project, '.claude')), false);
});

test('I/O failures during replacement or state writing restore all previous skill files and metadata', t => {
  for (const failAt of [3, 6]) {
    const f = fixture(t); success(cli(f));
    for (const entry of f.pkg.agents.skills.slice(0, 2)) fs.appendFileSync(path.join(f.source, entry.path, 'SKILL.md'), '\nUpstream update.');
    const before = snapshot(f.project);
    // Inject a one-off filesystem failure into the child process, not the installer API.
    const injection = `import fs from 'node:fs'; const original=fs.renameSync; let calls=0; fs.renameSync=(...args)=>{if(++calls===${failAt})throw new Error('Simulated I/O failure');return original(...args);};`;
    const result = spawnSync(process.execPath, ['--import', 'data:text/javascript,' + encodeURIComponent(injection), path.join(f.source, 'scripts/install-claude-skills.mjs'), '--project', f.project], { encoding: 'utf8' });
    assert.notEqual(result.status, 0); assert.match(result.stderr, /Simulated I\/O failure/);
    assert.deepEqual(snapshot(f.project), before);
    // The old installation was restored; a normal retry must update it without --force.
    success(cli(f)); success(cli(f, '--check'));
  }
});

test('unsafe paths in installation metadata and source registrations are rejected', t => {
  const f = fixture(t); success(cli(f));
  const state = JSON.parse(contents(f.state));
  state.skills[f.pkg.agents.skills[0].name]['../outside.txt'] = 'a'.repeat(64);
  fs.writeFileSync(f.state, JSON.stringify(state));
  const before = snapshot(f.project); assert.notEqual(cli(f, '--force').status, 0); assert.deepEqual(snapshot(f.project), before);
  f.pkg.agents.skills[0].path = 'skills'; fs.writeFileSync(path.join(f.source, 'package.json'), JSON.stringify(f.pkg));
  const result = cli(f); assert.notEqual(result.status, 0); assert.match(result.stderr, /escapes skills\/source/);
});
