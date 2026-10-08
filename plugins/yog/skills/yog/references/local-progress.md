# 可选的本地进度工具

此文档仅在需要保存进度、跨会话继续或导出文件时读取。纯对话不必使用脚本。

把下列 `<tool>` 替换为本技能目录下 `scripts/yog.mjs` 的实际绝对路径；`<session>` 使用用户确认目录中的 `.yog/session.json`。命令参数是结构化数据文件路径，不是待执行 shell。记录文件只保存必要摘要，默认不上传。

## 操作顺序

```text
node <tool> init <session> --idea <用户想法> --environment <已确认环境摘要>
node <tool> routes <session> <routes.json>
node <tool> select <session> <用户选择的编号> --confirmed
node <tool> plan <session> <plan.json>
node <tool> approve <session> --confirmed
node <tool> agent <session> yes --confirmed
node <tool> prompt <session>
node <tool> result <session> <当前阶段编号> <result.json>
node <tool> export <session> <新的导出目录>
```

`--confirmed` 只能记录用户在对话中已经给出的明确确认，不能擅自添加。用户自行实施时把 `agent` 选项设为 `no`，仍可导出计划。

`show` 显示当前阶段与需授权影响。存在影响时，先向用户展示；获得授权后用 `authorize <session> <当前阶段编号> --confirmed`，再生成提示词。`prompt --preview` 只生成显著标识的审阅草稿；用 `--step <编号> --preview` 查看后续阶段。

失败结果停留在当前阶段，再次生成提示词会带失败摘要；改变操作或版本时先修订计划，不沿用旧授权。`plan` 更新会清除旧确认和有效进度，历史反馈仍保存在 events。

目标或环境变化时用 `revise <session> <brief.json>`，内容为 `{ "idea": "新目标", "environment": "新环境或 null" }`。重新比较与选型。`routes` 替换候选、`select` 换方案也会使旧确认失效。

## 小型数据格式

`routes.json` 是数组。每个方案包含：

```json
{
  "id": "route-a",
  "title": "方案名称",
  "summary": "能实现什么",
  "reason": "为什么适合用户目标",
  "requirements": ["必要环境条件"],
  "caveats": ["限制和未知条件"],
  "repositories": [{
    "url": "https://github.com/实际所有者/实际仓库",
    "status": "docs_reviewed",
    "revision": null,
    "license": null,
    "licenseSource": null,
    "sources": [{
      "url": "https://官方文档地址",
      "claim": "该文档支持的能力或限制",
      "checkedAt": "实际核对时间，带时区"
    }]
  }]
}
```

以上是格式说明，不是可直接使用的真实候选；填入实际链接和日期。未核对项目用 `discovered`，`sources` 可为空。未知版本和许可用 null。不收集 Stars、总分、假哈希或假运行记录。

`plan.json`：

```json
{
  "workspace": "用户确认的绝对路径",
  "successCriteria": ["任务效果的可检查标准"],
  "constraints": ["保留输入和已有产物"],
  "steps": [{
    "id": "inspect",
    "kind": "inspect",
    "title": "检查准备条件",
    "instructions": ["只读核对来源、固定版本和必要环境；不要安装"],
    "checks": [{"id": "environment", "description": "明确满足、冲突和未知条件"}],
    "permissions": [],
    "failureHelp": "说明缺少哪些条件及最小下一步"
  }]
}
```

`kind` 使用 inspect（只读核对）、implement（安装、配置、修改或运行）、verify（结果验证）。未核对项目或未知版本只能交接 inspect；补齐版本后修订并重新确认计划。`permissions` 列具体影响，例如下载来源与体积、写入目录或安装范围；工具不会从任务文本推断所有副作用，Agent 必须核对这些字段。

`result.json`：

```json
{
  "status": "passed",
  "summary": "实际完成情况",
  "checks": [{"id": "environment", "status": "passed", "detail": "实际检查结果及依据"}]
}
```

阶段状态是 passed 或 failed；检查项允许 passed、failed、not_run。只有所有约定检查项都有通过反馈才能记录阶段通过。工具只保存用户/Agent 报告，不把反馈升级为独立运行证据。

导出包含 `plan.md`、`session.json`，条件具备时另含 `current-prompt.md`。导出目录必须是新的，避免覆盖。状态和确认帮助避免误推进，不是隔离或权限执行器。
