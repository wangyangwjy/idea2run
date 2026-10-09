import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const installer = resolve('scripts/install-skill.mjs');
const source = resolve('plugins/idea2run/skills/idea2run');
const locations = [
  ['codex', ['.agents', 'skills'], ['.agents', 'skills'], '$idea2run'],
  ['claude-code', ['.claude', 'skills'], ['.claude', 'skills'], '/idea2run'],
  ['hermes', ['.hermes', 'skills'], ['.hermes', 'skills'], '/idea2run'],
  ['openclaw', ['skills'], ['.openclaw', 'skills'], '/idea2run'],
  ['pi', ['.pi', 'skills'], ['.pi', 'agent', 'skills'], '/skill:idea2run'],
];
const overrides = { 'claude-code': 'CLAUDE_CONFIG_DIR', hermes: 'HERMES_HOME', openclaw: 'OPENCLAW_STATE_DIR', pi: 'PI_CODING_AGENT_DIR' };

function isolatedEnv(user) {
  const env = { ...process.env, HOME: user, USERPROFILE: user };
  for (const key of Object.values(overrides)) delete env[key];
  return env;
}
async function equalTree(actual, expected) {
  const files = await readdir(expected, { withFileTypes: true });
  assert.deepEqual((await readdir(actual)).sort(), files.map(file => file.name).sort());
  for (const file of files) {
    if (file.isDirectory()) await equalTree(join(actual, file.name), join(expected, file.name));
    else assert.deepEqual(await readFile(join(actual, file.name)), await readFile(join(expected, file.name)));
  }
}
async function sandbox(context) {
  const directory = await mkdtemp(join(tmpdir(), 'idea2run-hosts-中文 with spaces-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const user = join(directory, 'user'), project = join(directory, 'project');
  await mkdir(user); await mkdir(project);
  return { directory, user, project };
}

for (const [id, projectParts, userParts, command] of locations) {
  test(`${id} 项目和全局安装可调用进度工具，更新保留完整副本且范围独立`, async context => {
    const { user, project } = await sandbox(context);
    const run = (...args) => spawnSync(process.execPath, [installer, '--agent', id, ...args], { env: isolatedEnv(user), cwd: project, encoding: 'utf8' });
    const local = join(project, ...projectParts, 'idea2run');
    const global = join(user, ...userParts, 'idea2run');
    for (const [args, target] of [[[project], local], [['--global'], global]]) {
      const installed = run(...args);
      assert.equal(installed.status, 0, installed.stderr);
      assert.ok(installed.stdout.includes(`开始使用：${command}`));
      assert.ok(installed.stdout.includes(join(target, 'SKILL.md')));
      await equalTree(target, source);
      const help = spawnSync(process.execPath, [join(target, 'scripts', 'idea2run.mjs'), '--help'], { cwd: project, encoding: 'utf8' });
      assert.equal(help.status, 0, help.stderr);
      assert.match(help.stdout, /不执行/);
      await writeFile(join(target, 'local.txt'), `${id} preserved`);
      assert.equal(run(...args).status, 1);
      const updated = run(...args, '--update');
      assert.equal(updated.status, 0, updated.stderr);
      const backup = updated.stdout.match(/完整旧副本：(.+?)。旧版本地修改/)?.[1];
      assert.ok(backup);
      assert.equal(await readFile(join(backup, 'local.txt'), 'utf8'), `${id} preserved`);
      await equalTree(target, source);
    }
    // A project update cannot overwrite this user's independently edited global copy.
    await writeFile(join(global, 'keep.txt'), 'global untouched');
    assert.equal(run(project, '--update').status, 0);
    assert.equal(await readFile(join(global, 'keep.txt'), 'utf8'), 'global untouched');
  });
}

test('未知宿主、缺值和重复选项在写入前拒绝', async context => {
  const { user, project } = await sandbox(context);
  const run = (...args) => spawnSync(process.execPath, [installer, ...args], { env: isolatedEnv(user), cwd: project, encoding: 'utf8' });
  for (const args of [
    [project, '--agent', 'unknown'], [project, '--agent'], [project, '--agent', '--global'],
    [project, '--agent', 'hermes', '--agent', 'pi'], [project, '--agent', 'pi', '--global'],
    [project, '--agent=pi'], [project, '--agent', '__proto__'],
  ]) assert.equal(run(...args).status, 1);
  assert.deepEqual(await readdir(project), []);
  assert.deepEqual(await readdir(user), []);
});

test('宿主全局目录环境变量仅作用于所选宿主，支持波浪号，拒绝相对路径', async context => {
  const { directory, user, project } = await sandbox(context);
  for (const [id, variable] of Object.entries(overrides)) {
    const profile = join(directory, `profile-${id}`);
    const env = { ...isolatedEnv(user), [variable]: profile };
    const result = spawnSync(process.execPath, [installer, '--agent', id, '--global'], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    await equalTree(join(profile, 'skills', 'idea2run'), source);
    const bad = spawnSync(process.execPath, [installer, '--agent', id, '--global'], { env: { ...env, [variable]: 'relative-profile' }, cwd: project, encoding: 'utf8' });
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /绝对路径/);
  }
  const expanded = spawnSync(process.execPath, [installer, '--agent', 'hermes', '--global'], { env: { ...isolatedEnv(user), HERMES_HOME: '~/custom-hermes' }, encoding: 'utf8' });
  assert.equal(expanded.status, 0, expanded.stderr);
  await equalTree(join(user, 'custom-hermes', 'skills', 'idea2run'), source);
  assert.deepEqual(await readdir(project), []);
});

test('各宿主拒绝无关技能、技能目录链接和父技能目录链接', async context => {
  const { directory, project } = await sandbox(context);
  for (const [id, parts] of locations) {
    const target = join(project, ...parts, 'idea2run');
    await mkdir(target, { recursive: true });
    const unrelated = '---\nname: other\ndescription: unrelated\n---\nkeep';
    await writeFile(join(target, 'SKILL.md'), unrelated);
    const run = () => spawnSync(process.execPath, [installer, project, '--agent', id, '--update'], { encoding: 'utf8' });
    assert.equal(run().status, 1);
    assert.equal(await readFile(join(target, 'SKILL.md'), 'utf8'), unrelated);
    await rm(target, { recursive: true });
    const outside = join(directory, `outside-${id}`);
    await mkdir(outside);
    await writeFile(join(outside, 'sentinel.txt'), 'keep');
    await symlink(outside, target, process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal(run().status, 1);
    await rm(target, { recursive: true });
    const skills = join(project, ...parts);
    await rm(skills, { recursive: true });
    await symlink(outside, skills, process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal(run().status, 1);
    assert.deepEqual(await readdir(outside), ['sentinel.txt']);
    await rm(skills, { recursive: true });
  }
});

test('全局档案位于目录链接下时拒绝且不写到范围外', async context => {
  const { directory, user, project } = await sandbox(context);
  const outside = join(directory, 'outside-profile');
  await mkdir(outside);
  await writeFile(join(outside, 'sentinel.txt'), 'keep');
  const link = join(user, '.pi');
  await symlink(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
  const result = spawnSync(process.execPath, [installer, '--agent', 'pi', '--global'], { env: isolatedEnv(user), cwd: project, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /符号链接/);
  assert.deepEqual(await readdir(outside), ['sentinel.txt']);
  assert.deepEqual(await readdir(project), []);
});
