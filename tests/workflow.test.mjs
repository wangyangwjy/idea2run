import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, transition as update, status, nextStep, renderPrompt, renderPlan, validateRoutes, validatePlan, validateSession, isApproved, PROMPT_LIMIT } from '../plugins/idea2run/skills/idea2run/scripts/core.mjs';
import { routes, plan, passed } from './fixtures.mjs';

function planned() {
  let session = createSession('用户的测试想法', '用户手填的测试环境');
  session = update(session, 'routes', routes);
  session = update(session, 'select', { id: 'simple' }, true);
  return update(session, 'plan', plan);
}
function handoff() {
  return update(update(planned(), 'approve', {}, true), 'agent', { choice: 'yes' }, true);
}
function completeInspect(session) {
  return update(session, 'result', { id: 'inspect', result: passed('input') });
}

test('选择、计划批准、Agent 选择和阶段授权分别处理', () => {
  let session = createSession('测试目标');
  assert.equal(status(session), 'choosing');
  session = update(session, 'routes', routes);
  assert.throws(() => update(session, 'select', { id: 'simple' }), /明确确认/);
  session = update(session, 'select', { id: 'simple' }, true);
  assert.equal(status(session), 'planning');
  session = update(session, 'plan', plan);
  assert.equal(status(session), 'review');
  assert.throws(() => renderPrompt(session), /确认计划/);
  assert.match(renderPrompt(session, null, true), /审阅草稿/);
  assert.throws(() => update(session, 'approve'), /明确确认/);
  session = update(session, 'approve', {}, true);
  assert.equal(status(session), 'ready');
  assert.throws(() => renderPrompt(session), /选择获取/);
  session = update(session, 'agent', { choice: 'no' }, true);
  assert.equal(status(session), 'ready');
  assert.throws(() => renderPrompt(session), /选择获取/);
  session = update(session, 'agent', { choice: 'yes' }, true);
  assert.equal(status(session), 'handoff');
  assert.match(renderPrompt(session), /检查测试输入/);
  session = completeInspect(session);
  assert.throws(() => renderPrompt(session), /尚未授权/);
  assert.throws(() => update(session, 'authorize', { id: 'configure' }), /明确确认/);
  session = update(session, 'authorize', { id: 'configure' }, true);
  assert.match(renderPrompt(session), /用户已确认/);
  session = update(session, 'result', { id: 'configure', result: passed('output') });
  assert.equal(status(session), 'reported_complete');
  assert.equal(nextStep(session), null);
  assert.match(renderPlan(session), /不能视为独立复现/);
});

test('失败不推进，修复提示词携带失败摘要，历史反馈保留', () => {
  let session = handoff();
  session = update(session, 'result', { id: 'inspect', result: { status: 'failed', summary: '测试输入不可读', checks: [{ id: 'input', status: 'not_run', detail: '没有运行检查' }] } });
  assert.equal(nextStep(session).id, 'inspect');
  assert.match(renderPrompt(session), /测试输入不可读/);
  assert.throws(() => update(session, 'result', { id: 'configure', result: passed('output') }), /先完成当前/);
  assert.throws(() => renderPrompt(session, 'configure'), /只交接当前/);
  assert.match(renderPrompt(session, 'configure', true), /审阅草稿/);
  session = completeInspect(session);
  assert.equal(session.events.filter((event) => event.action === 'reported_result').length, 2);
  assert.equal(nextStep(session).id, 'configure');
});

test('不能用缺失、未知或失败检查项声明阶段通过', () => {
  for (const checks of [[], [{ id: 'input', status: 'failed', detail: '失败' }], [{ id: 'input', status: 'not_run', detail: '未运行' }]]) {
    assert.throws(() => update(handoff(), 'result', { id: 'inspect', result: { status: 'passed', summary: '声称完成', checks } }), /未全部通过/);
  }
  assert.throws(() => update(handoff(), 'result', { id: 'inspect', result: passed('unknown') }), /未知检查项/);
  const duplicate = passed('input'); duplicate.checks.push(duplicate.checks[0]);
  assert.throws(() => update(handoff(), 'result', { id: 'inspect', result: duplicate }), /不能重复/);
});

test('计划、路线、目标或环境改变使旧批准、阶段权限与进度失效', () => {
  let session = completeInspect(handoff());
  session = update(session, 'authorize', { id: 'configure' }, true);
  const modified = structuredClone(plan); modified.steps[1].permissions = ['新的影响'];
  const changed = update(session, 'plan', modified);
  assert.equal(status(changed), 'review'); assert.deepEqual(changed.grants, {}); assert.deepEqual(changed.results, {});
  assert.ok(changed.events.some((event) => event.action === 'reported_result'));
  assert.equal(status(update(session, 'routes', routes)), 'choosing');
  assert.equal(status(update(session, 'select', { id: 'simple' }, true)), 'planning');
  assert.equal(status(update(session, 'revise', { idea: '新目标', environment: null })), 'choosing');
  for (const alter of [(copy) => { copy.environment = '已变化环境'; }, (copy) => { copy.plan.workspace = 'E:\\另一个目录'; }, (copy) => { copy.routes[0].repositories[0].revision = 'v2'; }]) {
    const copy = structuredClone(session); alter(copy);
    assert.equal(isApproved(copy), false); validateSession(copy);
    assert.deepEqual(copy.results, {}); assert.deepEqual(copy.grants, {}); assert.equal(copy.agent, null);
  }
});

test('缺来源、伪仓库链接、重复编号、坏日期和相对目录被拒绝', () => {
  const cases = [
    (copy) => { copy[0].repositories[0].sources = []; },
    (copy) => { copy[0].repositories[0].url = 'https://github.com.evil.invalid/a/b'; },
    (copy) => { copy[0].repositories[0].sources[0].checkedAt = '2026-10-08'; },
    (copy) => { copy[0].repositories[0].sources[0].url = 'https://token:secret@example.com'; },
    (copy) => { copy.push(structuredClone(copy[0])); },
  ];
  for (const alter of cases) { const copy = structuredClone(routes); alter(copy); assert.throws(() => validateRoutes(copy)); }
  assert.throws(() => validatePlan({ ...plan, workspace: './project' }), /绝对路径/);
  assert.throws(() => validatePlan({ ...plan, steps: [] }), /至少/);
  const copy = structuredClone(plan); copy.steps[0].checks.push(copy.steps[0].checks[0]);
  assert.throws(() => validatePlan(copy), /不能重复/);
});

test('未知或未核对版本可审阅和检查，但不能交接实施阶段', () => {
  for (const reviewed of [true, false]) {
    const input = structuredClone(routes);
    if (reviewed) input[0].repositories[0].revision = null;
    else { input[0].repositories[0].status = 'discovered'; input[0].repositories[0].sources = []; }
    let session = update(createSession('测试'), 'routes', input);
    session = update(session, 'select', { id: 'simple' }, true);
    session = update(session, 'plan', plan);
    session = update(update(session, 'approve', {}, true), 'agent', { choice: 'yes' }, true);
    assert.match(renderPrompt(session), /检查测试输入/);
    session = update(completeInspect(session), 'authorize', { id: 'configure' }, true);
    assert.throws(() => renderPrompt(session), /核对项目来源并固定版本/);
    assert.throws(() => update(session, 'result', { id: 'configure', result: passed('output') }), /核对项目来源并固定版本/);
  }
});

test('提示词足够短，只含选定路线与当前阶段，不附整份计划', () => {
  const prompt = renderPrompt(handoff());
  assert.ok([...prompt].length < PROMPT_LIMIT);
  assert.match(prompt, /E:\\测试工作目录\\with spaces/);
  assert.doesNotMatch(prompt, /写入测试产物/);
  assert.match(renderPlan(planned()), /not run/);
  const long = structuredClone(plan); long.steps[0].instructions = Array(4).fill('很'.repeat(1100));
  assert.throws(() => update(planned(), 'plan', long), /超过 2400/);
});
