import { cp, mkdir, readFile, lstat, mkdtemp, rename, rmdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'plugins', 'idea2run', 'skills', 'idea2run');
const HELP = `Idea2Run 技能安装与更新（默认项目内；不联网、不改 Codex 配置）
  node scripts/install-skill.mjs [目标项目目录]
  node scripts/install-skill.mjs [目标项目目录] --update
  node scripts/install-skill.mjs --global [--update]
项目内：指定项目/.agents/skills/idea2run，仅在该项目及其子目录使用；省略目录时使用本源码目录。
全局：显式 --global 安装到当前用户 ~/.agents/skills/idea2run，可跨项目使用，不能同时指定项目目录。
普通安装拒绝覆盖。--update 仅替换同名 Idea2Run 技能，先准备新版再保存完整旧副本。
旧副本保留在所选项目或用户目录的 .idea2run/skill-updates/ 下，打印实际备份路径。
旧版无需额外标记即可更新；如果尚未安装，则 --update 完成首次安装。
更新失败会尝试恢复旧副本；不会自动删除备份或用户进度。新开任务后使用 $idea2run。
`;

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

export async function installSkill(projectPath, update = false) {
  const project = resolve(projectPath);
  await mkdir(project, { recursive: true });
  await directory(project);
  const agents = join(project, '.agents');
  const skills = join(agents, 'skills');
  const target = join(skills, 'idea2run');
  inside(project, target);
  await directory(agents); await directory(skills);
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
  const flags = args.filter(arg => arg.startsWith('-'));
  const positional = args.filter(arg => !arg.startsWith('-'));
  if (positional.length > 1 || flags.some(flag => !['--update', '--global'].includes(flag)) || new Set(flags).size !== flags.length) throw new Error(HELP);
  const global = flags.includes('--global');
  if (global && positional.length) throw new Error('--global 不能同时指定项目目录。请只选择一种安装范围。');
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const { target, backup } = await installSkill(global ? homedir() : positional[0] ?? root, flags.includes('--update'));
  console.log(`Idea2Run v${version}`);
  console.log(`安装范围：${global ? '当前用户全局，可跨项目使用' : '项目内，仅在该项目及其子目录使用'}。`);
  console.log(`${backup ? '已更新' : '已安装'}技能：${target}`);
  if (backup) console.log(`完整旧副本：${backup}。旧版本地修改仍在备份中，请按需迁移。`);
  console.log(`新开${global ? '任意项目中的' : '目标项目中的'} Codex 任务后使用 $idea2run。进度目录不会清空。`);
  console.log('开始使用：$idea2run 我想做一个本地照片整理工具');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
