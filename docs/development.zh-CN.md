# Idea2Run 开发与本地工具

[返回中文首页](../README.md) | [English](development.en.md)

本地安装脚本与辅助工具需要 Node.js 22+。以下命令在仓库根目录运行；纯对话使用不需要这些辅助工具。

## 本地开发安装

克隆仓库后，在项目目录中安装技能副本：

```powershell
npm run setup
```

然后在 **项目目录中新开 Codex 对话**，输入 `$` 并选择 Idea2Run，直接说想法：

```text
$idea2run <你的想法>
```

需要在其他项目中使用时，明确目标目录：

```powershell
node scripts/install-skill.mjs "D:\你的项目"
```

安装只在指定项目中复制 `.agents/skills/idea2run`，不改全局配置、不连接外部服务，也不覆盖已有同名技能。项目内技能发现及插件打包采用 [官方技能机制](https://developers.openai.com/plugins/build/skills) 与 [插件格式](https://developers.openai.com/plugins/build/plugins)。宿主版本和权限可能影响发现方式。

无需安装也可以直接让 Agent 阅读源技能文件：

```text
请读取 <仓库绝对路径>/plugins/idea2run/skills/idea2run/SKILL.md，并按它的流程帮我实现这个想法：<你的想法>。
```

开发时优先直接引用源文件，避免已复制的技能副本落后于修改。插件包位于 `plugins/idea2run/`，已包含便携清单与 Codex 兼容清单。仓库内提供插件列表，可通过上面的命令安装。

## 用户看到什么

1. 说出想法；Idea2Run 只补问影响选型的关键问题。
2. 查看几个方案：能做什么、项目链接、推荐理由、环境要求和限制。
3. 选择方案；Idea2Run 展开该方案的完整执行计划。
4. 确认计划，决定自己实施或获取 Agent 提示词。
5. 一次复制一个阶段的提示词；把结果反馈给 Idea2Run，继续或修复当前阶段。

联网搜索由宿主提供；没有搜索工具时会说明限制，请用户提供资料，或把候选保留为待核对。资料核对不等于安装或运行通过。

## 轻量的本地交接工具

纯对话即可推荐方案。可选工具需要 Node.js 22+，只保存进度和生成文件，没有第三方依赖，不执行计划中的命令。

```powershell
npm run idea2run -- --help
```

Agent 需要保存进度时按技能的 `references/local-progress.md` 操作。保存内容包括想法、环境摘要、候选、所选方案、计划、确认和结果反馈；默认保存在被 Git 忽略的 `.idea2run/` 中。

工具区分选型、计划批准、Agent 交接选择和当前阶段授权。计划或方案改变会使旧确认与有效进度失效；失败不会跳到下一阶段。每条提示词最多 2400 个字符，超过时要求拆分或精简。机器信息未知时保持未知。

导出包含 `plan.md`、`session.json`，条件具备时另含 `current-prompt.md`。导出使用新目录，避免覆盖已有文件。此工具帮助记录确认，不能替代宿主的权限控制，也不能证明用户或 Agent 的报告真实。

## 开发与验证

```powershell
npm test
npm run check
npm run demo
```

`test` 检查状态推进、权限确认、版本未知、失败重试、反馈完整性、变更后失效，以及中文/空格路径和防覆盖。

`check` 检查插件清单、版本一致性、引用、文件编码和脚本语法。

`demo` 使用**合成测试数据**在 `.idea2run/` 中生成计划与两个阶段的提示词。没有下载、安装或运行任何开源候选，不是真实任务落地证据。测试数据留在 `tests/`，不会打入插件包。

```text
plugins/idea2run/                可分发插件
  skills/idea2run/SKILL.md       对话工作流
  skills/idea2run/references/    按需读取的交接格式与进度说明
  skills/idea2run/scripts/       本地进度和导出工具
scripts/                   安装、检查与合成演示
tests/                     流程测试与合成输入
```

## 贡献

优先提交实际流程中的问题：用户目标、选定路线、失败阶段、可公开的最小复现。删去私人路径、输入内容和令牌。

保持主流程短，新增能力必须帮助用户更快得到可用结果。修改工作流或辅助脚本后运行测试和检查。真实来源、文档核对和运行反馈分别说明，不将合成数据写成实测记录。
