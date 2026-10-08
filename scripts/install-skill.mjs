import { cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length > 1) throw new Error('用法：node scripts/install-skill.mjs [目标项目目录]');
const target = join(resolve(args[0] ?? root), '.agents', 'skills', 'idea2run');
try {
  await mkdir(dirname(target), { recursive: true });
  await mkdir(target); // Never overwrite another skill, even on repeated setup.
  const source = join(root, 'plugins', 'idea2run', 'skills', 'idea2run');
  for (const entry of await readdir(source)) {
    await cp(join(source, entry), join(target, entry), { recursive: true, force: false, errorOnExist: true });
  }
  console.log(`已复制技能到 ${target}。新开 Codex 对话后使用 $idea2run。`);
} catch (error) {
  console.error(error.code === 'EEXIST' ? `目标已存在，未覆盖：${target}` : error.message);
  process.exitCode = 1;
}
