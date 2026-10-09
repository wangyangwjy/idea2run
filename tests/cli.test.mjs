import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { routes, plan, passed } from './fixtures.mjs';

const tool = resolve('plugins/idea2run/skills/idea2run/scripts/idea2run.mjs');
test('命令行完成中文空格路径的交接、反馈与导出，并拒绝覆盖', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'idea2run-测试 with spaces-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const session = join(directory, '进度.json');
  const json = async (name, value) => { const path = join(directory, name); await writeFile(path, `\uFEFF${JSON.stringify(value)}`); return path; };
  const run = (...args) => spawnSync(process.execPath, [tool, ...args], { encoding: 'utf8', cwd: directory });
  const ok = (...args) => { const result = run(...args); assert.equal(result.status, 0, result.stderr); return result.stdout; };
  assert.match(ok('--help'), /不执行/);
  ok('init', session, '--idea', '测试想法，文本含 $() 与空格');
  assert.notEqual(run('init', session, '--idea', '不要覆盖').status, 0);
  assert.equal(JSON.parse(await readFile(session)).idea, '测试想法，文本含 $() 与空格');
  ok('routes', session, await json('候选.json', routes));
  assert.notEqual(run('select', session, 'simple').status, 0);
  ok('select', session, 'simple', '--confirmed');
  ok('plan', session, await json('计划.json', plan));
  assert.notEqual(run('prompt', session).status, 0);
  assert.match(ok('prompt', session, '--preview'), /审阅草稿/);
  const reviewExport = join(directory, '审阅导出');
  ok('export', session, reviewExport);
  assert.deepEqual((await readdir(reviewExport)).sort(), ['plan.md', 'session.json']);
  ok('approve', session, '--confirmed');
  ok('agent', session, 'yes', '--confirmed');
  assert.match(ok('prompt', session), /检查测试输入/);
  ok('result', session, 'inspect', await json('结果.json', passed('input')));
  assert.notEqual(run('prompt', session).status, 0);
  ok('authorize', session, 'configure', '--confirmed');
  const exportDirectory = join(directory, '执行导出');
  ok('export', session, exportDirectory);
  const original = await readFile(join(exportDirectory, 'plan.md'), 'utf8');
  assert.match(await readFile(join(exportDirectory, 'current-prompt.md'), 'utf8'), /写入测试产物/);
  assert.notEqual(run('export', session, exportDirectory).status, 0);
  assert.equal(await readFile(join(exportDirectory, 'plan.md'), 'utf8'), original);
  assert.notEqual(run('prompt', session, '--unknown').status, 0);
  assert.notEqual(run('show', session, '--confirmed').status, 0);
  ok('result', session, 'configure', await json('结果2.json', passed('output')));
  assert.match(ok('show', session), /reported_complete/);
});

test('技能安装只写入指定项目，重复安装不覆盖', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'idea2run-install-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const installer = resolve('scripts/install-skill.mjs');
  const run = () => spawnSync(process.execPath, [installer, directory], { encoding: 'utf8' });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const pkg = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
  assert.ok(result.stdout.includes(`Idea2Run v${pkg.version}`));
  assert.match(result.stdout, /安装范围：项目内/);
  assert.ok(result.stdout.includes(join(directory, '.agents', 'skills', 'idea2run')));
  assert.match(result.stdout, /开始使用：\$idea2run/);
  const skill = join(directory, '.agents', 'skills', 'idea2run', 'SKILL.md');
  const original = await readFile(skill, 'utf8');
  assert.match(original, /name: idea2run/);
  assert.equal(run().status, 1);
  assert.equal(await readFile(skill, 'utf8'), original);
});

test('全局选择仅写入隔离用户目录，更新保留旧副本，冲突范围无副作用', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'idea2run-global-中文 with spaces-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const user = join(directory, 'user'), project = join(directory, 'project');
  await mkdir(user); await mkdir(project);
  const env = { ...process.env, [process.platform === 'win32' ? 'USERPROFILE' : 'HOME']: user };
  const installer = resolve('scripts/install-skill.mjs');
  const run = (...args) => spawnSync(process.execPath, [installer, ...args], { encoding: 'utf8', cwd: project, env });
  for (const args of [['--global', project], ['--global', '--global'], ['--global', '--unknown']]) {
    assert.equal(run(...args).status, 1);
  }
  assert.deepEqual(await readdir(user), []);
  assert.deepEqual(await readdir(project), []);
  const result = run('--global');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /当前用户全局，可跨项目/);
  const target = join(user, '.agents', 'skills', 'idea2run');
  const installed = await readFile(join(target, 'SKILL.md'), 'utf8');
  assert.equal(installed, await readFile(resolve('plugins/idea2run/skills/idea2run/SKILL.md'), 'utf8'));
  await writeFile(join(target, 'local.txt'), 'global local edits');
  assert.equal(run('--global').status, 1);
  const updated = run('--update', '--global');
  assert.equal(updated.status, 0, updated.stderr);
  assert.match(updated.stdout, /完整旧副本/);
  const updates = join(user, '.idea2run', 'skill-updates');
  const entries = await readdir(updates);
  const backups = [];
  for (const entry of entries) {
    try { backups.push(await readFile(join(updates, entry, 'previous', 'local.txt'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  assert.deepEqual(backups, ['global local edits']);
  assert.deepEqual(await readdir(project), []);
});

test('显式更新兼容旧技能，完整保留本地修改、额外文件和用户进度', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'idea2run-upgrade-中文 with spaces-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const target = join(directory, '.agents', 'skills', 'idea2run');
  await mkdir(target, { recursive: true });
  const legacy = '---\nname: idea2run\ndescription: 旧版已安装技能\n---\n用户自己修改的旧内容';
  await writeFile(join(target, 'SKILL.md'), legacy);
  await writeFile(join(target, '用户文件.txt'), '必须保留');
  await mkdir(join(directory, '.idea2run'));
  await writeFile(join(directory, '.idea2run', 'session.json'), '{"private":"保留进度"}');
  const installer = resolve('scripts/install-skill.mjs');
  const run = (...args) => spawnSync(process.execPath, [installer, directory, ...args], { encoding: 'utf8' });
  assert.equal(run().status, 1);
  assert.equal(await readFile(join(target, 'SKILL.md'), 'utf8'), legacy);
  const result = run('--update');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /完整旧副本/);
  const updates = join(directory, '.idea2run', 'skill-updates');
  const entries = await readdir(updates);
  const previous = join(updates, entries[0], 'previous');
  assert.equal(await readFile(join(previous, 'SKILL.md'), 'utf8'), legacy);
  assert.equal(await readFile(join(previous, '用户文件.txt'), 'utf8'), '必须保留');
  assert.equal(await readFile(join(target, 'SKILL.md'), 'utf8'), await readFile(resolve('plugins/idea2run/skills/idea2run/SKILL.md'), 'utf8'));
  assert.equal(await readFile(join(directory, '.idea2run', 'session.json'), 'utf8'), '{"private":"保留进度"}');
  assert.deepEqual((await readdir(join(directory, '.agents', 'skills'))), ['idea2run']);
});

test('更新拒绝无关技能和指向项目外的目录链接', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'idea2run-upgrade-boundary-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const installer = resolve('scripts/install-skill.mjs');
  const foreign = join(directory, 'foreign');
  const target = join(foreign, '.agents', 'skills', 'idea2run');
  await mkdir(target, { recursive: true });
  await writeFile(join(target, 'SKILL.md'), '---\nname: another-skill\n---\n不能覆盖');
  const rejected = spawnSync(process.execPath, [installer, foreign, '--update'], { encoding: 'utf8' });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /不是可识别/);
  assert.match(await readFile(join(target, 'SKILL.md'), 'utf8'), /不能覆盖/);
  const linked = join(directory, 'linked'), outside = join(directory, 'outside');
  await mkdir(linked); await mkdir(outside);
  await writeFile(join(outside, 'sentinel.txt'), '不可修改');
  await symlink(outside, join(linked, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
  const result = spawnSync(process.execPath, [installer, linked, '--update'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /符号链接/);
  assert.deepEqual(await readdir(outside), ['sentinel.txt']);
});

test('准备失败或存在安装锁时不移动旧技能，失败后不留下自己的锁', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'idea2run-upgrade-failure-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const installer = resolve('scripts/install-skill.mjs');
  const target = join(directory, '.agents', 'skills', 'idea2run');
  await mkdir(target, { recursive: true });
  const original = '---\nname: idea2run\ndescription: 旧技能\n---\n保持不变';
  await writeFile(join(target, 'SKILL.md'), original);
  await writeFile(join(directory, '.idea2run'), '这是已有用户文件，不是目录');
  const result = spawnSync(process.execPath, [installer, directory, '--update'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(await readFile(join(target, 'SKILL.md'), 'utf8'), original);
  assert.deepEqual(await readdir(join(directory, '.agents', 'skills')), ['idea2run']);
  const lock = join(directory, '.agents', 'skills', '.idea2run-install-lock');
  await mkdir(lock);
  const locked = spawnSync(process.execPath, [installer, directory, '--update'], { encoding: 'utf8' });
  assert.equal(locked.status, 1);
  assert.match(locked.stderr, /已有安装\/更新锁/);
  assert.equal(await readFile(join(target, 'SKILL.md'), 'utf8'), original);
  assert.ok((await readdir(join(directory, '.agents', 'skills'))).includes('.idea2run-install-lock'));
});

test('安装帮助与未知参数不写文件，update 可完成首次安装', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'idea2run-install-options-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const installer = resolve('scripts/install-skill.mjs');
  assert.equal(spawnSync(process.execPath, [installer, '--help'], { encoding: 'utf8' }).status, 0);
  for (const option of ['--unknown', '-x', '--help']) {
    assert.equal(spawnSync(process.execPath, [installer, directory, option], { encoding: 'utf8' }).status, 1);
  }
  assert.deepEqual(await readdir(directory), []);
  const result = spawnSync(process.execPath, [installer, directory, '--update'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /已安装/);
});
