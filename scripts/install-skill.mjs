import { cp, mkdir, readFile, lstat, mkdtemp, rename, rmdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'plugins', 'idea2run', 'skills', 'idea2run');
export const AGENTS = Object.freeze({
  codex: { name: 'Codex', project: ['.agents', 'skills'], user: [], command: '$idea2run' },
  'claude-code': { name: 'Claude Code', project: ['.claude', 'skills'], user: ['.claude'], env: 'CLAUDE_CONFIG_DIR', command: '/idea2run' },
  hermes: { name: 'Hermes Agent', project: ['.hermes', 'skills'], user: ['.hermes'], env: 'HERMES_HOME', command: '/idea2run' },
  openclaw: { name: 'OpenClaw', project: ['skills'], user: ['.openclaw'], env: 'OPENCLAW_STATE_DIR', command: '/idea2run' },
  pi: { name: 'Pi coding agent', project: ['.pi', 'skills'], user: ['.pi', 'agent'], env: 'PI_CODING_AGENT_DIR', command: '/skill:idea2run' },
});
const HELP = `Idea2Run 技能安装与更新（默认 Codex 项目内；不联网、不改宿主配置）
  node scripts/install-skill.mjs [目标项目或工作区目录] [--agent codex|claude-code|hermes|openclaw|pi] [--update]
  node scripts/install-skill.mjs --agent <Agent> --global [--update]
项目内：按 Agent 放入原生技能目录；省略目标时使用本源码目录。OpenClaw 目标必须是它实际使用的工作区。
全局：显式 --global 放入当前用户的宿主技能目录，不能同时指定项目目录。
使用 WSL、容器或远程宿主时，在宿主实际运行的环境中安装。全局遵循对应宿主的目录环境变量。
普通安装拒绝覆盖。--update 仅替换同名 Idea2Run 技能，先准备新版再保存完整旧副本。
旧副本保留在所选范围的 .idea2run/skill-updates/ 下，打印实际备份路径。
旧版无需额外标记即可更新；如果尚未安装，则 --update 完成首次安装。
更新失败会尝试恢复旧副本；不会自动删除备份或用户进度。更新前先取得新版来源。
`;

function getAgent(id) {
  if (!Object.hasOwn(AGENTS, id)) throw new Error(`未知 Agent：${id}。可选：${Object.keys(AGENTS).join(', ')}`);
  return AGENTS[id];
}

export function globalRoot(id, env = process.env, home = homedir()) {
  const agent = getAgent(id);
  const override = agent.env && env[agent.env];
  if (!override) return join(home, ...agent.user);
  const expanded = override === '~' ? home : /^~[\\/]/.test(override) ? join(home, override.slice(2)) : override;
  if (!isAbsolute(expanded)) throw new Error(`${agent.env} 必须是宿主环境中的绝对路径，未安装。`);
  return resolve(expanded);
}

async function exists(path) {
  try { return await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function inside(project, path) {
  const offset = relative(project, path);
  if (!offset || offset === '..' || offset.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(offset)) {
    throw new Error('安装路径必须位于指定安装范围内。');
  }
}
async function directory(path) {
  const info = await exists(path);
  if (info && (!info.isDirectory() || info.isSymbolicLink())) throw new Error(`拒绝操作非普通目录或符号链接：${path}`);
  if (!info) await mkdir(path);
}

async function scopeDirectory(path) {
  // A profile may be nested below a linked directory, even when its own lstat is ordinary.
  for (let parent = path; ; parent = dirname(parent)) {
    const info = await exists(parent);
    if (info && (!info.isDirectory() || info.isSymbolicLink())) throw new Error(`拒绝操作非普通目录或符号链接：${parent}`);
    if (dirname(parent) === parent) break;
  }
  await mkdir(path, { recursive: true });
  await directory(path);
}

export async function installSkill(projectPath, update = false, { agent: id = 'codex', global = false } = {}) {
  const agent = getAgent(id);
  const project = resolve(projectPath);
  await scopeDirectory(project);
  const parts = global && id !== 'codex' ? ['skills'] : agent.project;
  let skills = project;
  for (const part of parts) { skills = join(skills, part); await directory(skills); }
  const target = join(skills, 'idea2run');
  inside(project, target);
  const lock = join(skills, '.idea2run-install-lock');
  try { await mkdir(lock); }
  catch (error) { if (error.code === 'EEXIST') throw new Error(`已有安装/更新锁，未操作技能：${lock}`); throw error; }
  let transaction, backup = null, moved = false;
  try {
    const current = await exists(target);
    if (current && !update) throw new Error(`目标已存在，未覆盖：${target}。更新请加 --update。`);
    if (current) {
      if (!current.isDirectory() || current.isSymbolicLink()) throw new Error(`拒绝更新非普通技能目录：${target}`);
      const entry = await lstat(join(target, 'SKILL.md'));
      if (!entry.isFile() || entry.isSymbolicLink()) throw new Error('旧技能入口必须为普通文件。');
      const skill = (await readFile(join(target, 'SKILL.md'), 'utf8')).replace(/^\uFEFF/, '');
      if (!/^---\r?\nname: idea2run\r?\n/.test(skill)) throw new Error('目标不是可识别的 Idea2Run 技能，未覆盖。');
    }
    const privateRoot = join(project, '.idea2run');
    const updates = join(privateRoot, 'skill-updates');
    inside(project, updates);
    await directory(privateRoot); await directory(updates);
    transaction = await mkdtemp(join(updates, 'update-'));
    const staged = join(transaction, 'new');
    inside(project, staged);
    await cp(source, staged, { recursive: true, force: false, errorOnExist: true, verbatimSymlinks: true });
    if (current) {
      backup = join(transaction, 'previous');
      inside(project, backup);
      await rename(target, backup); moved = true;
    }
    try { await rename(staged, target); }
    catch (error) {
      if (moved) {
        try { await rename(backup, target); moved = false; }
        catch (restoreError) { throw new Error(`替换及自动恢复失败；旧副本保留在 ${backup}。原因：${error.message}；${restoreError.message}`); }
      }
      throw error;
    }
    return { target, backup, transaction };
  } finally {
    await rmdir(lock);
  }
}

export async function main(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { console.log(HELP); return; }
  const flags = [], positional = [];
  let id = 'codex';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--agent') {
      if (flags.includes(arg) || !args[i + 1] || args[i + 1].startsWith('-')) throw new Error(HELP);
      flags.push(arg); id = args[++i]; getAgent(id);
    } else if (['--update', '--global'].includes(arg)) {
      if (flags.includes(arg)) throw new Error(HELP);
      flags.push(arg);
    } else if (arg.startsWith('-')) throw new Error(HELP);
    else positional.push(arg);
  }
  if (positional.length > 1) throw new Error(HELP);
  const global = flags.includes('--global');
  if (global && positional.length) throw new Error('--global 不能同时指定项目目录。请只选择一种安装范围。');
  const agent = getAgent(id);
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const { target, backup } = await installSkill(global ? globalRoot(id) : positional[0] ?? root, flags.includes('--update'), { agent: id, global });
  console.log(`Idea2Run v${version}`);
  console.log(`宿主：${agent.name}。`);
  console.log(`安装范围：${global ? '当前用户全局，可跨项目使用；自定义目录时仅对应宿主配置/档案' : id === 'openclaw' ? '当前 OpenClaw 工作区，仅加载该工作区的 Agent 会话可用' : '项目内，仅在该项目及其子目录使用；发现范围以宿主规则为准'}。`);
  console.log(`${backup ? '已更新' : '已安装'}技能：${target}`);
  console.log(`技能入口：${join(target, 'SKILL.md')}`);
  if (backup) console.log(`完整旧副本：${backup}。旧版本地修改仍在备份中，请按需迁移。`);
  console.log(`在所选范围中新开 ${agent.name} 会话后使用 ${agent.command}。进度目录不会清空。`);
  if (id === 'hermes' && !global) console.log('Hermes 项目自动发现需要支持项目技能的版本、Git 项目和用户信任；请在宿主内核对 hermes skills trust，不自动修改信任配置。');
  if (id === 'openclaw') console.log('请核对实际工作区、技能启用状态与 Agent 白名单；安装不更改 Gateway 配置。');
  if (id === 'pi') console.log('Pi 项目原生目录按启动目录发现；项目子目录的发现行为请核对宿主。已有会话可 /reload。');
  console.log(`开始使用：${agent.command} 我想做一个本地照片整理工具`);
  console.log('如果入口未被发现，让 Agent 读取上面打印的 SKILL.md。文件安装成功不等于宿主内完整流程已验证。');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
