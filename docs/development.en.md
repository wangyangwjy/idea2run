# Idea2Run development and local tools

[Back to the English homepage](../README.en.md) | [简体中文](development.zh-CN.md)

Local installation scripts and helper tools require Node.js 22+. Run the following commands from the repository root. Conversation-only use does not require these helper tools.

## Install for local development

Clone the repository, then install a skill copy from the repository directory:

```powershell
npm run setup
```

Start a **new Codex task in the project directory**, type `$`, and select Idea2Run:

```text
$idea2run <your idea>
```

To use it in another project, specify that project's directory:

```powershell
node scripts/install-skill.mjs "D:\your-project"
```

This copies `.agents/skills/idea2run` only into the specified project. It does not change global configuration, connect to external services, or overwrite an existing skill with the same name. Skill discovery and plugin packaging follow the [official skill mechanism](https://developers.openai.com/plugins/build/skills) and [plugin format](https://developers.openai.com/plugins/build/plugins). Discovery may vary with the host version and permissions.

You can also ask the Agent to read the source skill directly, without installation:

```text
Read <absolute repository path>/plugins/idea2run/skills/idea2run/SKILL.md and follow its workflow to help implement this idea: <your idea>.
```

During development, refer to the source file directly so copied skills do not fall behind your changes. The plugin package is in `plugins/idea2run/` and includes both portable and Codex-compatible manifests. The repository also contains the plugin catalog used by the installation commands above.

## What you get

1. Describe your idea. Idea2Run asks only the key questions that affect the choice of approach.
2. Compare a few options: capabilities, project links, reasons for recommending them, environment requirements, and limitations.
3. Choose an option. Idea2Run expands it into a complete execution plan.
4. Approve the plan, then choose to implement it yourself or get Agent prompts.
5. Copy one stage's prompt at a time. Return the results to Idea2Run to continue or fix the current stage.

The host provides web search. If search is unavailable, Idea2Run explains the limitation, asks for source material, or leaves candidates unverified. Checking documentation does not mean installation or execution has succeeded.

## Lightweight local handoff tools

Conversation alone is enough to recommend options. The optional tools require Node.js 22+ and only save progress and generate files. They have no third-party dependencies and do not execute commands from the plan.

```powershell
npm run idea2run -- --help
```

When an Agent needs to save progress, it follows the skill's `references/local-progress.md`. Records include the idea, environment summary, candidates, selected approach, plan, approvals, and result feedback. They are stored in the Git-ignored `.idea2run/` directory by default.

The tools record approach selection, plan approval, Agent handoff choice, and current-stage authorization separately. Changing the plan or approach invalidates previous approvals and applicable progress. A failed stage does not advance to the next one. Each prompt is limited to 2,400 characters; longer prompts must be split or shortened. Unknown machine details stay unknown.

Exports contain `plan.md` and `session.json`, plus `current-prompt.md` when the required conditions are met. Exports use a new directory to avoid overwriting existing files. The tools help record approvals; they cannot replace the host's permission controls or verify the truth of user or Agent reports.

## Development and verification

```powershell
npm test
npm run check
npm run demo
```

`test` checks state transitions, authorization, unknown versions, failure retries, complete feedback, invalidation after changes, paths containing Chinese characters or spaces, and overwrite protection.

`check` checks plugin manifests, version consistency, references, file encoding, and script syntax.

`demo` uses **synthetic test data** to generate a plan and prompts for two stages under `.idea2run/`. It does not download, install, or run any open-source candidate and is not evidence of a real implementation. Test data stays in `tests/` and is not included in the plugin package.

```text
plugins/idea2run/                Distributable plugin
  skills/idea2run/SKILL.md       Conversation workflow
  skills/idea2run/references/    Handoff format and progress guidance, read as needed
  skills/idea2run/scripts/       Local progress and export tools
scripts/                        Installation, checks, and synthetic demo
tests/                          Workflow tests and synthetic inputs
```

## Contributing

Prioritize issues encountered in real use: the user's goal, the chosen approach, the failed stage, and a minimal reproduction that can be shared publicly. Remove private paths, input content, and tokens.

Keep the main workflow short. New capabilities should help users reach a usable result faster. Run tests and checks after changing the workflow or helper scripts. Distinguish source verification, documentation checks, and execution feedback; do not present synthetic data as real-world test results.
