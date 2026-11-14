#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repository = fileURLToPath(new URL('../', import.meta.url));
const stateName = 'threejs-skills-install.json';
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const exists = file => { try { fs.lstatSync(file); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } };
const inside = (parent, child) => child !== parent && path.relative(parent, child) !== '..' && !path.relative(parent, child).startsWith('..' + path.sep) && !path.isAbsolute(path.relative(parent, child));
const validName = name => typeof name === 'string' && /^threejs-[a-z0-9-]+$/.test(name);
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

function requireDirectory(dir) {
  const stat = fs.lstatSync(dir);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw Error(`Expected a real directory, not a link or file: ${dir}`);
}

function readTree(dir) {
  requireDirectory(dir);
  const files = new Map();
  function visit(current, prefix = '') {
    for (const entry of fs.readdirSync(current).sort()) {
      const file = path.join(current, entry);
      const relative = prefix + entry;
      const stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) throw Error(`Symbolic links are not supported: ${file}`);
      if (stat.isDirectory()) visit(file, relative + '/');
      else if (stat.isFile()) files.set(relative, fs.readFileSync(file));
      else throw Error(`Unsupported file type: ${file}`);
    }
  }
  visit(dir);
  return files;
}
const hashes = files => Object.fromEntries([...files].map(([name, data]) => [name, digest(data)]));

function loadSource() {
  const pkg = JSON.parse(fs.readFileSync(path.join(repository, 'package.json'), 'utf8'));
  const entries = pkg.agents?.skills;
  if (!Array.isArray(entries) || entries.length === 0) throw Error('No skills registered in package.json');
  const sourceRoot = path.join(repository, 'skills', 'source');
  requireDirectory(path.join(repository, 'skills'));
  requireDirectory(sourceRoot);
  // Visit the entire source tree first, rejecting links and unregistered SKILL.md files.
  const all = readTree(sourceRoot);
  const registered = new Set();
  const desired = new Map();
  for (const entry of entries) {
    if (!validName(entry.name) || desired.has(entry.name) || typeof entry.path !== 'string') throw Error('Invalid or duplicate skill registration');
    const directory = path.resolve(repository, entry.path);
    if (!inside(sourceRoot, directory)) throw Error(`Skill path escapes skills/source: ${entry.name}`);
    const files = readTree(directory);
    for (const required of ['SKILL.md', 'references/methods.md', 'references/examples.md', 'references/anti-patterns.md']) {
      if (!files.get(required)?.length) throw Error(`Missing or empty ${required} in ${entry.name}`);
    }
    const frontmatter = files.get('SKILL.md').toString().match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter || !new RegExp(`^name:\\s*["']?${entry.name}["']?\\s*$`, 'm').test(frontmatter[1])) throw Error(`SKILL.md name does not match ${entry.name}`);
    // Keep copied skills redistributable and self-contained, including attribution.
    for (const notice of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
      if (!files.has(notice)) files.set(notice, fs.readFileSync(path.join(repository, notice)));
    }
    desired.set(entry.name, files);
    registered.add(path.relative(sourceRoot, path.join(directory, 'SKILL.md')).split(path.sep).join('/'));
  }
  for (const file of all.keys()) if (path.posix.basename(file) === 'SKILL.md' && !registered.has(file)) throw Error(`Unregistered skill: ${file}`);
  return { pkg, desired };
}

function loadState(file, packageName) {
  if (!exists(file)) return null;
  if (!fs.lstatSync(file).isFile()) throw Error(`Installation record must be a regular file: ${file}`);
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (state.schemaVersion !== 1 || state.packageName !== packageName || !state.skills || typeof state.skills !== 'object' || Array.isArray(state.skills)) throw Error('Invalid installation record; no files were changed');
  for (const [name, files] of Object.entries(state.skills)) {
    if (!validName(name) || !files || typeof files !== 'object' || Array.isArray(files)) throw Error('Invalid skill in installation record');
    for (const [file, hash] of Object.entries(files)) {
      if (!file || file.includes('\\') || path.posix.isAbsolute(file) || path.posix.normalize(file) !== file || file.split('/').some(part => part === '..' || part === '.' || !part) || !/^[a-f0-9]{64}$/.test(hash)) throw Error('Invalid file in installation record');
    }
  }
  return state;
}

function run({ project, check, force }) {
  const { pkg, desired } = loadSource();
  const projectRoot = fs.realpathSync(path.resolve(project));
  requireDirectory(projectRoot);
  const claude = path.join(projectRoot, '.claude');
  const skills = path.join(claude, 'skills');
  const backups = path.join(claude, 'threejs-skill-backups');
  for (const dir of [claude, skills, backups]) if (exists(dir)) requireDirectory(dir);
  const statePath = path.join(claude, stateName);
  const previous = loadState(statePath, pkg.name);
  const next = { schemaVersion: 1, packageName: pkg.name, packageVersion: pkg.version, threeVersion: pkg.devDependencies?.three ?? null, skills: {} };
  for (const [name, files] of desired) next.skills[name] = hashes(files);
  const names = [...new Set([...desired.keys(), ...Object.keys(previous?.skills ?? {})])].sort();
  const changes = [], conflicts = [], mismatches = [];
  for (const name of names) {
    const target = path.join(skills, name);
    const present = exists(target);
    const actual = present ? hashes(readTree(target)) : null;
    const wanted = next.skills[name];
    if (wanted && actual && same(actual, wanted)) continue;
    if (!wanted && !present) continue;
    mismatches.push(name);
    if (present) {
      const baseline = previous?.skills[name];
      // Adopt matching manual copies; missing new files (e.g. licenses) are safe to add.
      const manualMatch = !baseline && wanted && Object.entries(actual).every(([file, hash]) => wanted[file] === hash);
      if (!(baseline && same(actual, baseline)) && !manualMatch) conflicts.push(name);
    }
    changes.push({ name, target, present, files: desired.get(name) });
  }
  if (check) {
    if (!previous) throw Error('No installation record. Run the installer without --check first.');
    if (mismatches.length) throw Error(`Installation differs from this checkout: ${mismatches.join(', ')}`);
    console.log(`Verified ${desired.size} installed skills and all their files in ${skills}`);
    return;
  }
  if (conflicts.length && !force) throw Error(`Local changes or different existing skills: ${conflicts.join(', ')}. Nothing changed. Use --force to back up and replace these directories, or preserve your edits elsewhere first.`);
  if (!changes.length && previous && same(previous, next)) {
    console.log(`Already up to date: verified ${desired.size} skills in ${skills}`);
    return;
  }
  fs.mkdirSync(skills, { recursive: true });
  const staging = fs.mkdtempSync(path.join(claude, 'threejs-skills-staging-'));
  let backup = null;
  const installed = [], moved = [];
  let stateMoved = false, stateInstalled = false;
  try {
    for (const change of changes) if (change.files) {
      const directory = path.join(staging, change.name);
      for (const [file, data] of change.files) {
        const dest = path.join(directory, ...file.split('/'));
        fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, data);
      }
      if (!same(hashes(readTree(directory)), next.skills[change.name])) throw Error(`Staged verification failed for ${change.name}`);
    }
    fs.writeFileSync(path.join(staging, stateName), JSON.stringify(next, null, 2) + '\n');
    if (changes.some(change => change.present) || exists(statePath)) {
      fs.mkdirSync(backups, { recursive: true });
      backup = fs.mkdtempSync(path.join(backups, new Date().toISOString().replace(/[:.]/g, '-') + '-'));
      fs.mkdirSync(path.join(backup, 'skills'));
    }
    for (const change of changes) {
      if (change.present) {
        fs.renameSync(change.target, path.join(backup, 'skills', change.name)); moved.push(change);
      }
      if (change.files) {
        fs.renameSync(path.join(staging, change.name), change.target); installed.push(change);
      }
    }
    if (exists(statePath)) { fs.renameSync(statePath, path.join(backup, stateName)); stateMoved = true; }
    fs.renameSync(path.join(staging, stateName), statePath); stateInstalled = true;
    for (const [name, expected] of Object.entries(next.skills)) if (!same(hashes(readTree(path.join(skills, name))), expected)) throw Error(`Installed verification failed for ${name}`);
    console.log(`Verified ${desired.size} skills (${Object.values(next.skills).reduce((n, files) => n + Object.keys(files).length, 0)} files) in ${skills}`);
    console.log(`Installed: ${changes.filter(c => !c.present && c.files).length}; updated: ${changes.filter(c => c.present && c.files).length}; retired: ${changes.filter(c => !c.files).length}. Other skills were left untouched.`);
    if (backup) console.log(`Backup: ${backup}`);
  } catch (error) {
    // Restore the complete pre-update installation if a replacement or verification fails.
    try {
      if (stateInstalled) fs.rmSync(statePath);
      if (stateMoved) fs.renameSync(path.join(backup, stateName), statePath);
      for (const change of installed.reverse()) fs.rmSync(change.target, { recursive: true });
      for (const change of moved.reverse()) fs.renameSync(path.join(backup, 'skills', change.name), change.target);
    } catch (rollback) {
      throw Error(`${error.message}; rollback needs attention: ${rollback.message}. Preserved backup: ${backup}`);
    }
    throw error;
  } finally { fs.rmSync(staging, { recursive: true, force: true }); }
}

try {
  const { values } = parseArgs({ options: { project: { type: 'string' }, check: { type: 'boolean' }, force: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } } });
  if (values.help) console.log('Usage: node scripts/install-claude-skills.mjs --project <existing-project-directory> [--check | --force]\nInstall/update registered skills in <project>/.claude/skills. No npm install or network access required.\n--check verifies without writing; --force backs up and replaces locally modified skills.');
  else {
    if (!values.project?.trim() || (values.check && values.force)) throw Error('Specify --project <directory>; --check and --force cannot be combined. Use --help for usage.');
    run(values);
  }
} catch (error) { console.error(`Installation failed: ${error.message}`); process.exitCode = 1; }
