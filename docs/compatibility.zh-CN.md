# Agent 兼容与验证

[首页](../README.md) | [English](compatibility.en.md)

当前版本：**v0.3.1**。一份标准 `SKILL.md` 加参考文件和可选进度脚本，按宿主原生技能机制接入。Codex 插件清单只用于 Codex；其他宿主安装完整技能目录，不需要读取 Codex 清单，也不需要新增模型接口。

## 安装位置与首次用法

以下路径是默认目录，`~` 为**运行 Agent 的环境**中的当前用户目录。参数名固定如下；其他 Agent 可直接读取源技能及其引用文件。

| 宿主 / 参数 | 项目内或工作区 | 当前用户全局 | 调用示例 |
| --- | --- | --- | --- |
| Codex / `codex` | `<项目>/.agents/skills/idea2run` | `~/.agents/skills/idea2run` | `$idea2run 你的想法` |
| Claude Code / `claude-code` | `<项目>/.claude/skills/idea2run` | `~/.claude/skills/idea2run` | `/idea2run 你的想法` |
| Hermes Agent / `hermes` | `<Git 项目>/.hermes/skills/idea2run` | `~/.hermes/skills/idea2run` | `/idea2run 你的想法` |
| OpenClaw / `openclaw` | `<实际工作区>/skills/idea2run` | `~/.openclaw/skills/idea2run` | `/idea2run 你的想法`或自然语言使用 Idea2Run |
| Pi coding agent / `pi` | `<启动目录>/.pi/skills/idea2run` | `~/.pi/agent/skills/idea2run` | `/skill:idea2run 你的想法` |

从最新版解压目录运行，项目内明确目标绝对路径，全局不带目标目录：

```powershell
node scripts/install-skill.mjs "D:\你的项目" --agent claude-code
npm run setup -- --agent claude-code --global
```

更新时**先取得最新版**，使用同一宿主和范围，再加 `--update`。保留完整旧技能副本，打印真实备份位置。不同宿主与范围的副本独立，不自动同步或合并；现有 Codex 命令不带 `--agent` 仍兼容。

## 容易装错的情况

- **Hermes 项目内**：按当前官方文档，自动发现基于 Git 项目根并需要用户信任。在宿主中核对是否支持 `hermes skills trust`，由用户决定是否信任；安装器不初始化 Git 或修改信任。旧版可明确选全局，或直接读取技能。全局对应当前 Hermes home/档案，多个档案需要分别安装。
- **OpenClaw**：目标要是所用 Agent 的实际工作区，不能仅选聊天客户端当前文件夹。共享技能仍受启用设置、Agent 白名单和当前会话快照影响；安装不重启 Gateway 或修改配置。远程 Gateway 的全局目录属于远程运行环境。
- **Pi**：原生 `.pi/skills` 按启动目录发现，不承诺从每个子目录都自动发现这份副本。可从目标目录启动，或全局安装；已有会话使用 `/reload`。同名技能按宿主发现顺序处理。
- **同名副本**：优先级因宿主而异，核对实际加载路径；不要默认“项目副本一定覆盖全局”。
- **WSL、容器与远程机器**：在 Agent 实际运行的环境中安装和更新。Windows `E:\...` 与 WSL `/mnt/e/...` 不能直接混用。跨环境交接先核对共享文件和路径映射，不自动上传私人文件。

全局安装遵循环境中的 `CLAUDE_CONFIG_DIR`、`HERMES_HOME`、`OPENCLAW_STATE_DIR` 或 `PI_CODING_AGENT_DIR`，分别对应所选宿主；支持 `~/...`，相对路径会在写入前拒绝。备份在所选用户/宿主目录的 `.idea2run/skill-updates/`，具体路径以输出为准。配置文件中的自定义路径、命名档案启动参数和远程布局不自动解析，应在对应运行环境/档案中核对实际入口。

## 能力不足时怎样使用

核心流程使用宿主已有工具，不绑定 Codex 工具名称。没有联网搜索：使用用户资料或待核对候选；不能读写文件：在对话中给内容；不能执行：提供当前阶段提示词交给有执行能力的 Agent。没有 Node.js 时仍能对话推荐、规划和交接，只有可选的本地进度/导出工具需要 Node.js 22+。

跨 Agent 接收结果后，按检查编号核对产物再继续；不能访问对方产物时标为对方报告，不能写成本机复核。技能不会为宿主补出缺失的工具、权限或凭据。

## 当前验证范围（2026-10-09）

| 宿主 | 文件安装、更新、备份与范围 | 原生技能发现 | 宿主内完整流程 |
| --- | --- | --- | --- |
| Codex | 已验证 | 当前会话已有入口；新会话自动发现待单独验证 | 已有本地分步执行、反馈与交付记录 |
| Claude Code | 已验证 | 待验证 | 待验证 |
| Hermes Agent | 已验证；另在 WSL 实际安装 | v0.9.0 隔离 Hermes home 的 `hermes skills list` 发现 `idea2run` | 待验证；该旧版项目发现未验证 |
| OpenClaw | 已验证 | 2026.9.2 隔离 state 的 `skills list --json` 发现，模型/命令可见、未被白名单阻挡 | 待验证 |
| Pi coding agent | 已验证 | 待验证 | 待验证 |

24 项自动测试实际复制/更新完整技能并运行安装副本的工具帮助，检查目录隔离、备份、未知参数与目录链接保护。这些属于安装器验证，不能代替宿主原生发现或模型交互。Hermes/OpenClaw 发现检查使用已有宿主与隔离目录，没有启动模型请求，也没有修改真实全局配置或信任。

## 核对依据

2026-10-09 核对官方说明与源码；当前上游文档不代表所有旧版本都支持同样能力。

- [Codex 技能](https://developers.openai.com/codex/skills)
- [Claude Code 技能](https://code.claude.com/docs/en/skills)与[配置目录](https://code.claude.com/docs/en/claude-directory)
- [Hermes 技能、项目发现与信任](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/)
- [OpenClaw 技能与工作区](https://docs.openclaw.ai/tools/skills)
- [Pi 技能说明](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md)、[技能加载源码](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/skills.ts)和[用户目录源码](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/config.ts)
