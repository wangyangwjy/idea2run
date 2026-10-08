#!/usr/bin/env node
import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createSession, validateSession, transition, status, nextStep, renderPrompt, renderPlan } from './core.mjs';

const HELP = `YOG 本地交接工具（不联网、不执行计划中的命令）
  init <session.json> --idea <想法> [--environment <环境摘要>]
  revise <session.json> <brief.json>
  routes <session.json> <routes.json>
  select <session.json> <方案编号> --confirmed
  plan <session.json> <plan.json>
  approve <session.json> --confirmed
  agent <session.json> yes|no --confirmed
  authorize <session.json> <阶段编号> --confirmed
  prompt <session.json> [--step <编号>] [--preview]
  result <session.json> <阶段编号> <result.json>
  show <session.json>
  export <session.json> <新的导出目录>
--confirmed 只用于已经取得的用户明确确认，不得由 Agent 自行决定。
`;

async function readJson(path) {
  return JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
}
async function save(path, data, exclusive = false) {
  await mkdir(dirname(path), { recursive: true });
  const contents = `${JSON.stringify(data, null, 2)}\n`;
  if (exclusive) return writeFile(path, contents, { flag: 'wx', mode: 0o600 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, contents, { flag: 'wx', mode: 0o600 });
    await rename(temporary, path);
  } finally { await unlink(temporary).catch(() => {}); }
}

function parse(args) {
  const positional = [], flags = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!arg.startsWith('--')) { positional.push(arg); continue; }
    if (['--confirmed', '--preview'].includes(arg)) flags[arg.slice(2)] = true;
    else if (['--idea', '--environment', '--step'].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${arg} 缺少值。`);
      flags[arg.slice(2)] = args[++index];
    } else throw new Error(`未知参数 ${arg}。`);
  }
  return { positional, flags };
}

export async function main(args) {
  if (!args.length || args[0] === '--help') { process.stdout.write(HELP); return; }
  const { positional, flags } = parse(args);
  const [command, filename, argument, extra] = positional;
  const arities = { init: 2, revise: 3, routes: 3, select: 3, plan: 3, approve: 2, agent: 3, authorize: 3, prompt: 2, result: 4, show: 2, export: 3 };
  if (!arities[command] || positional.length !== arities[command]) throw new Error('命令或参数数量不正确，使用 --help 查看。');
  const allowedFlags = { init: ['idea', 'environment'], select: ['confirmed'], approve: ['confirmed'], agent: ['confirmed'], authorize: ['confirmed'], prompt: ['step', 'preview'] };
  if (Object.keys(flags).some((flag) => !(allowedFlags[command] ?? []).includes(flag))) throw new Error('此命令不接受这些选项。');
  const path = resolve(filename);
  if (command === 'init') {
    await save(path, createSession(flags.idea, flags.environment), true);
    process.stdout.write('已建立本地会话；下一步寻找项目并比较方案。\n'); return;
  }
  const session = validateSession(await readJson(path));
  if (command === 'show') {
    process.stdout.write(`${JSON.stringify({ status: status(session), selected: session.selected, next: nextStep(session), results: session.results }, null, 2)}\n`); return;
  }
  if (command === 'prompt') { process.stdout.write(renderPrompt(session, flags.step, flags.preview)); return; }
  if (command === 'export') {
    const plan = renderPlan(session);
    let prompt = null;
    if (nextStep(session)) { try { prompt = renderPrompt(session); } catch { /* Export reviewable plan without an unapproved prompt. */ } }
    const output = resolve(argument);
    await mkdir(dirname(output), { recursive: true });
    await mkdir(output); // Refuse existing directories; never replace the user's exports.
    await writeFile(join(output, 'plan.md'), plan, { flag: 'wx', mode: 0o600 });
    await save(join(output, 'session.json'), session, true);
    if (prompt) await writeFile(join(output, 'current-prompt.md'), prompt, { flag: 'wx', mode: 0o600 });
    process.stdout.write(`已导出 ${output}${prompt ? '（含当前阶段提示词）' : '（计划与快照；尚无可交接提示词）'}\n`); return;
  }
  let payload;
  if (['routes', 'plan', 'revise'].includes(command)) payload = await readJson(resolve(argument));
  else if (command === 'result') payload = { id: argument, result: await readJson(resolve(extra)) };
  else if (command === 'agent') payload = { choice: argument };
  else payload = { id: argument };
  const updated = transition(session, command, payload, flags.confirmed);
  await save(path, updated);
  process.stdout.write(`已更新：${status(updated)}${nextStep(updated) ? `；当前阶段 ${nextStep(updated).id}` : ''}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).catch((error) => { process.stderr.write(`YOG：${error.message}\n`); process.exitCode = 1; });
}
