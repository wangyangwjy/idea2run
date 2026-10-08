// Synthetic test inputs only. These URLs and results are not production evidence.
export const routes = [{
  id: 'simple', title: '测试方案', summary: '合成测试用途', reason: '验证交接流程，不代表真实项目推荐',
  requirements: ['环境条件来自测试输入'], caveats: ['合成数据，禁止作为实测证据'],
  repositories: [{
    url: 'https://github.com/idea2run-test-fixtures/synthetic', status: 'docs_reviewed', revision: 'test-v1',
    license: null, licenseSource: null,
    sources: [{ url: 'https://example.com/synthetic-docs', claim: '合成资料，用于测试格式', checkedAt: '2026-10-08T00:00:00Z' }],
  }],
}];

export const plan = {
  workspace: 'E:\\测试工作目录\\with spaces',
  successCriteria: ['用合成检查验证交接状态'], constraints: ['不得安装、下载或执行外部项目'],
  steps: [{
    id: 'inspect', kind: 'inspect', title: '检查测试输入', instructions: ['确认合成测试输入的格式'],
    checks: [{ id: 'input', description: '输入数据具有预期字段' }], permissions: [], failureHelp: '修正测试输入，不修改外部系统',
  }, {
    id: 'configure', kind: 'implement', title: '写入测试产物', instructions: ['按合成计划记录本阶段结果'],
    checks: [{ id: 'output', description: '记录测试断言的通过结果' }],
    permissions: ['仅在测试临时目录写入合成产物'], failureHelp: '保留失败信息并重试当前阶段',
  }],
};

export const passed = (checkId) => ({ status: 'passed', summary: '合成通过反馈', checks: [{ id: checkId, status: 'passed', detail: '测试断言已通过，不是真实项目运行' }] });
