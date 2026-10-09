# 🚀 Idea2Run

**Turn ideas into working projects.**

Describe an idea, compare open-source approaches, approve a plan, and implement it step by step. Use your existing Codex; Idea2Run adds no account or model API.

[简体中文](README.md) | **English** · [Quick start](#quick-start) · [Updates](#updating-an-existing-installation) · [Development docs](docs/development.en.md)

Current version: **v0.2.4** · [Download the latest version](https://github.com/wangyangwjy/idea2run/releases/latest) · [Changelog](CHANGELOG.en.md)

## Quick start

### 1. Choose where to use it

| What you want | Choose | Available in |
| --- | --- | --- |
| Use it in one project | Project-local installation (default) | The target project and its subdirectories |
| Use it across projects | Global installation (current user) | This user's projects |

### 2. Install

**Let Codex install it for you.** Open Codex in the project you want to work in, then copy the prompt for your chosen scope:

Project-local installation:

```text
Install Idea2Run in my current project: https://github.com/wangyangwjy/idea2run . Read the latest README, obtain the latest release, and install into the current project's absolute path. Tell me the version, scope, entry point, and how to start.
```

Global installation:

```text
Install Idea2Run globally for my current user: https://github.com/wangyangwjy/idea2run . Read the latest README, obtain the latest release, and use global installation so I can use it across projects. Tell me the version, scope, entry point, and how to start.
```

<details>
<summary>Install it yourself: download, extract, run one command</summary>

Requires Codex and Node.js 22+. Download `idea2run-version.zip` from the [latest release](https://github.com/wangyangwjy/idea2run/releases/latest), extract it, and open a terminal in the extracted project folder containing `package.json`. Run the command for your chosen scope:

```powershell
# Project-local: replace this path with your actual working project
node scripts/install-skill.mjs "D:\your-project"

# Global: available across projects for the current user
npm run setup -- --global
```

If the extracted directory itself is your working project, you can run `npm run setup` directly. The output shows the version, scope, actual entry point, and first-use example. See [installation instructions](docs/development.en.md#installation-and-updates) for full steps and marketplace installation.

</details>

### 3. Start using it

After project-local installation, start a new Codex task in the **target project**. After global installation, start a new task in any project. Type `$` and select Idea2Run, or enter:

```text
$idea2run I want to build a local photo organizer
```

Then reply with “choose option two,” “approved,” or “continue.” If Idea2Run is missing, start a new task within the installation scope or restart Codex. If it still does not appear, ask the Agent to read the `SKILL.md` entry printed by the installer. If multiple same-name entries appear, check their paths and select the intended copy.

## What happens during use

```text
Describe → Clarify key needs → Compare short options → Choose → Approve the full plan → Work step by step → Receive outputs and usage instructions
```

| What you need | What Idea2Run provides |
| --- | --- |
| Clarify requirements | The goal, inputs, outputs, and success criteria, with grouped questions about gaps that affect the choice |
| Choose an approach | Usually 2–3 short options: ready to use, adaptation required, or development required, with environment, downloads, effort, and unknowns |
| Know what comes next | A complete plan for the chosen approach, including outputs, checks, and failure handling |
| Have an Agent execute | One short prompt per stage, for the current Agent or another Agent |
| Continue or repair | Paste actual results into the original conversation; continue after checks pass or fix the current stage |
| Use the result | Four fixed items: what was built, how to start it, how to use it, and what remains unfinished, with a direct entry point |

You choose the approach, approve the plan, and decide whether to let an Agent execute. Recommendations have real sources; download sizes, compatibility, and timings stay unknown without evidence. Documented support does not prove execution in your environment. Changes to the plan require reviewing the relevant approvals.

## Updating an existing installation

First download and extract the [latest release](https://github.com/wangyangwjy/idea2run/releases/latest). From the **new extracted directory**, run the command matching your existing scope:

```powershell
# Project-local: target the original working project
node scripts/install-skill.mjs "D:\your-project" --update

# Global for the current user
npm run setup -- --global --update
```

The installer prints the full old-copy backup path and preserves local edits and progress. Confirm the version and scope in the output, then start a new Codex task within that scope. Project-local and global copies are separate; updating one does not update the other. Marketplace users follow the [marketplace update instructions](docs/development.en.md#repository-marketplace-plugin).

## Common questions

**What if web search is unavailable?** Idea2Run explains the limitation, uses materials you provide, or leaves candidates unverified.

**Which Agents are supported?** The initial plugin entry supports Codex. Generated prompts can be copied to other Agents; plugin integration with other hosts is unverified.

**Do I need to pay or install a local model?** Idea2Run adds no account, cloud service, or model API. Host costs and the chosen approach's downloads, hardware, and service requirements depend on the actual environment.

## Development and feedback

The plugin provides clarification, option comparison, plan approval, staged handoff and feedback, four fixed delivery items, and safe project-local/global updates. Fifteen automated tests cover progress, handoff, installation scope, updates, and path protection. Actual local handoffs, installation checks, and user feedback are recorded separately; synthetic samples are not evidence of business execution.

Each version synchronizes GitHub source, its tag, Release, and download package, with matching bilingual documentation and manifests. See the [development and release workflow](docs/development.en.md#version-releases-and-github-synchronization). Acceptance focuses on plugin usability; extra sample-application or host-Agent tests are not gates for this delivery.

Report actual issues through [Issues](https://github.com/wangyangwjy/idea2run/issues). Progress is saved locally under `.idea2run/` when needed; private conversations, machine information, and user outputs are excluded from the public repository and download package.

## License

[MIT](LICENSE). Candidate projects, dependencies, and user samples retain their own licenses.
