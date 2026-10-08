import { readFile, readdir, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const plugin = join(root, 'plugins', 'yog');
const portable = JSON.parse(await readFile(join(plugin, 'plugin.json')));
const manifest = JSON.parse(await readFile(join(plugin, '.codex-plugin', 'plugin.json')));
const pkg = JSON.parse(await readFile(join(root, 'package.json')));
assert.equal(portable.name, 'yog'); assert.equal(manifest.name, portable.name);
assert.equal(manifest.version, pkg.version); assert.equal(portable.version, pkg.version);
assert.equal(manifest.skills, './skills/');
assert.ok(!manifest.mcpServers && !manifest.apps, '不要声明不存在的服务');
const skillRoot = join(plugin, 'skills', 'yog');
const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
assert.match(skill, /^---\r?\nname: yog\r?\ndescription: .+/);
assert.ok(skill.split('\n').length <= 120, '核心工作流应保持简短');
for (const match of skill.matchAll(/\]\((references\/[^)]+)\)/g)) await access(join(skillRoot, match[1]));
assert.match(await readFile(join(skillRoot, 'agents', 'openai.yaml'), 'utf8'), /\$yog/);
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await inspect(path); continue; }
    const contents = new TextDecoder('utf-8', { fatal: true }).decode(await readFile(path));
    assert.ok(!/\[TODO:|\bTODO\b/.test(contents), `${path} 尚有脚手架占位内容`);
    if (path.endsWith('.mjs')) {
      const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    }
  }
}
await inspect(plugin);
for (const entry of ['scripts', 'tests']) {
  // These directories include the validator's own literal TODO check, so only check syntax.
  for (const name of await readdir(join(root, entry))) if (name.endsWith('.mjs')) {
    const result = spawnSync(process.execPath, ['--check', join(root, entry, name)], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
}
console.log('通过：插件清单、版本、技能引用、简短工作流与脚本语法。');
