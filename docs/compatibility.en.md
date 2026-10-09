# Agent compatibility and validation

[Homepage](../README.en.md) | [简体中文](compatibility.zh-CN.md)

Current version: **v0.3.1**. One standard `SKILL.md`, supporting references, and optional progress scripts integrate through native host skill mechanisms. Codex manifests are for Codex; other hosts install the complete skill directory without a Codex manifest or an additional model API.

## Installation paths and first use

These are default paths. `~` is the current user's home **inside the Agent runtime environment**. Use the parameter names below; other Agents can read the source skill and its referenced files directly.

| Host / parameter | Project or workspace | Global for the current user | Invocation example |
| --- | --- | --- | --- |
| Codex / `codex` | `<project>/.agents/skills/idea2run` | `~/.agents/skills/idea2run` | `$idea2run your idea` |
| Claude Code / `claude-code` | `<project>/.claude/skills/idea2run` | `~/.claude/skills/idea2run` | `/idea2run your idea` |
| Hermes Agent / `hermes` | `<Git project>/.hermes/skills/idea2run` | `~/.hermes/skills/idea2run` | `/idea2run your idea` |
| OpenClaw / `openclaw` | `<actual workspace>/skills/idea2run` | `~/.openclaw/skills/idea2run` | `/idea2run your idea`, or ask it to use Idea2Run |
| Pi coding agent / `pi` | `<startup directory>/.pi/skills/idea2run` | `~/.pi/agent/skills/idea2run` | `/skill:idea2run your idea` |

Run from the latest extracted source. Specify the absolute target for project installation; global installation takes no project path:

```powershell
node scripts/install-skill.mjs "D:\your-project" --agent claude-code
npm run setup -- --agent claude-code --global
```

For updates, **obtain the latest source first**, keep the same host and scope, and add `--update`. The full old skill copy is preserved and its actual backup path is printed. Host and scope copies are independent and are not automatically synchronized or merged. Existing commands without `--agent` still target Codex.

## Common installation mistakes

- **Hermes project scope**: current official documentation bases discovery on the Git project root and user trust. Check whether the host supports `hermes skills trust`; the user decides whether to trust it. The installer does not initialize Git or modify trust. Older versions can explicitly use global installation or read the skill directly. Global installation targets the current Hermes home/profile; install separately for multiple profiles.
- **OpenClaw**: target the selected Agent's actual workspace, rather than the chat client's current directory. Shared skills remain subject to enablement, Agent allowlists, and session snapshots. Installation does not restart the Gateway or change its configuration. A remote Gateway uses directories in its remote runtime environment.
- **Pi**: native `.pi/skills` discovery uses the startup directory; discovery from every child directory is not promised. Start in the target directory or install globally. Existing sessions can use `/reload`. Same-name resolution follows host discovery order.
- **Duplicate copies**: precedence varies by host. Check the loaded path rather than assuming the project copy always overrides the global copy.
- **WSL, containers, remote machines**: install and update where the Agent actually runs. Windows `E:\...` and WSL `/mnt/e/...` paths are not interchangeable. Check shared files and path mapping before handoff; do not automatically upload private files.

Global installation honors the selected host's environment variable: `CLAUDE_CONFIG_DIR`, `HERMES_HOME`, `OPENCLAW_STATE_DIR`, or `PI_CODING_AGENT_DIR`. `~/...` is supported; relative paths are rejected before writing. Backups are under the selected user/host directory's `.idea2run/skill-updates/`; use the printed path. Configuration-file paths, named-profile launch arguments, and remote layouts are not automatically parsed. Check the actual entry within the corresponding runtime/profile.

## Using hosts with fewer tools

The core workflow uses available host tools without binding to Codex tool names. Without web search, use user-provided sources or leave candidates unverified. Without file tools, provide content in conversation. Without execution tools, produce a current-stage prompt for a capable Agent. Conversation, planning, and handoff do not require Node.js; only optional local progress/export tools require Node.js 22+.

Check returned outputs against numbered acceptance checks before continuing. If the receiving Agent cannot access another host's outputs, label them as reports rather than local corroboration. A skill does not supply missing tools, permissions, or credentials.

## Current validation scope (2026-10-09)

| Host | File installation, updates, backups, scope | Native discovery | Complete in-host workflow |
| --- | --- | --- | --- |
| Codex | Verified | Entry available in the current session; new-session automatic discovery needs separate verification | Existing local staged execution, feedback, and delivery records |
| Claude Code | Verified | Pending | Pending |
| Hermes Agent | Verified; also installed inside WSL | v0.9.0 `hermes skills list` discovers `idea2run` in an isolated Hermes home | Pending; project discovery in that older version is unverified |
| OpenClaw | Verified | 2026.9.2 `skills list --json` discovers it in isolated state; model/command visible and not blocked by allowlists | Pending |
| Pi coding agent | Verified | Pending | Pending |

Twenty-four automated tests copy/update the complete skill, run the installed tool's help, and check scope isolation, backups, invalid options, and linked-directory protection. These verify the installer, not native discovery or model interaction. Hermes/OpenClaw discovery used existing runtimes and isolated directories without model requests or changes to real global configuration or trust.

## Sources checked

Official documentation and source were checked on 2026-10-09. Current upstream documentation does not establish support in every older release.

- [Codex skills](https://developers.openai.com/codex/skills)
- [Claude Code skills](https://code.claude.com/docs/en/skills) and [configuration directory](https://code.claude.com/docs/en/claude-directory)
- [Hermes skills, project discovery, and trust](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/)
- [OpenClaw skills and workspaces](https://docs.openclaw.ai/tools/skills)
- [Pi skills](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md), [skill loader](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/skills.ts), and [user directory implementation](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/config.ts)
