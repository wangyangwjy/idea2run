# 🚀 Idea2Run

**Turn ideas into working projects.**

Describe your idea, find suitable open-source projects, choose an approach, and let an Agent work through the plan step by step.

[简体中文（默认）](README.md) | **English** · [Quick start](#quick-start) · [What it helps with](#what-it-helps-with) · [Development docs](docs/development.en.md)

## Start with an idea

“I want to build a local photo organizer.”

“I want to set up a team knowledge base.”

“I want to rename Word files based on their content.”

Idea2Run clarifies the key requirements, searches for suitable open-source projects, and presents a few understandable options. Once you choose, it creates a complete plan. After approving the plan, you can implement it yourself, ask an Agent to execute it, or copy short prompts to another Agent.

```text
Describe → Compare → Choose → Review the plan → Approve → Work step by step
```

## Quick start

The first version supports **Codex** and requires a host version with plugin support. Send this message to your Agent:

```text
Help me install Idea2Run in Codex: https://github.com/wangyangwjy/idea2run . Follow the installation instructions in the README, then tell me how to start using it.
```

<details>
<summary>Install it yourself: two commands</summary>

```powershell
codex plugin marketplace add wangyangwjy/idea2run
codex plugin add idea2run@idea2run
```

If your version does not support plugin commands, use the [project-local skill installation](docs/development.en.md#install-for-local-development).

</details>

After installation, **start a new task**, type `$`, select Idea2Run, and describe your idea:

```text
$idea2run I want to build a local photo organizer
```

Select it once at the start. After that, reply with “choose option two,” “approved,” or “continue.” You do not need to repeat long instructions. If the plugin does not appear, restart the app and select it again.

## What it helps with

| What you need | What Idea2Run provides |
| --- | --- |
| Find suitable open-source projects | Project links, intended uses, environment requirements, and key limitations |
| Choose an implementation approach | Usually 2–3 meaningfully different options, prioritizing projects you can use directly or adapt with small changes |
| Know what to do next | A complete plan for the selected approach, with stage outputs, verification, and failure handling |
| Hand work to an Agent | One short prompt per stage, for the current Agent or another Agent |
| Handle execution problems | Progress based on actual feedback; fix a failed stage before moving on |

You choose the approach, approve the plan, and decide whether to let an Agent execute it. Changes to the approach require reviewing and confirming the plan again.

## Keep it lightweight

- **Use your existing Agent.** The host supplies the model, search, and execution tools. Idea2Run requires no additional account or separate model API.
- **Look for existing projects first.** Recommendations include real sources and favor deployment, configuration, or small adaptations.
- **Work one step at a time.** Each handoff prompt is limited to 2,400 characters and focuses on one verifiable output.
- **Save progress when needed.** Optional local tools record progress and export plans and prompts; they do not execute commands from the plan.

## Common questions

**Will it activate automatically if I just describe an idea?**

The host may select the skill based on your request, but activation is not guaranteed. To invoke it explicitly, type `$idea2run`, or type `$` and select Idea2Run.

**Which Agents are supported?**

The first plugin version supports Codex. Generated prompts can be copied to other Agents; plugin compatibility with other hosts still needs verification. See the [official skills and plugins invocation guide](https://learn.chatgpt.com/docs/skills-and-plugins).

**Do I need to pay or install a local model?**

The plugin does not add a paid model API or require a local model. Your host's usage costs and the selected approach's downloads, hardware, and service costs depend on your environment and chosen solution.

**What if web search is unavailable?**

Idea2Run explains the limitation, uses materials you provide, or leaves candidates unverified. Documentation checks and actual execution verification are recorded separately.

## Current progress

**v0.1.1 · Early version**, with option comparison, plan generation, staged handoff, local progress, and export tools. The repository's **9 automated tests** cover progress and handoff tools.

There is one recorded real-world trial of content-based Word file renaming on Windows. The user approved an approach and authorized the current Agent to implement it; the tool was built and verified on sample copies. Automatic processing of the target directory was not enabled. The complete workflow of copying prompts between Agents still needs verification. The idea examples above do not mean every scenario has been tested. Private conversations and user files are not included in the repository.

Next priorities: clarify key requirements earlier, explain implementation effort when comparing options, and give clear startup and usage instructions at delivery. Share issues from real use through [Issues](https://github.com/wangyangwjy/idea2run/issues).

## Development and contributions

See the [development docs](docs/development.en.md) for alternative installation, local tools, verification commands, and contribution guidelines. Keep the main workflow short and add capabilities that help users reach a usable result faster.

## License

[MIT](LICENSE). Candidate open-source projects, dependencies, and user samples retain their own licenses.
