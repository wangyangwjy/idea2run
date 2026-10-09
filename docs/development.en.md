# Idea2Run development and local tools

[Back to the English homepage](../README.en.md) | [简体中文](development.zh-CN.md)

Local installation scripts and helper tools require Node.js 22+. Run the following commands from the repository root. Conversation-only use does not require these helper tools.

## Install for local development

v0.3.0 adds `--agent codex|claude-code|hermes|openclaw|pi`. Existing commands without `--agent` still target Codex. See [compatibility](compatibility.en.md) for other hosts' installation paths, commands, workspace/project requirements, directory environment variables, and validation scope. All hosts share the source skill; use the selected host's invocation after installation.

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

Default project-local installation copies `.agents/skills/idea2run` only into the specified project, without global configuration changes or external services, and refuses to overwrite an existing skill. Explicit `--update` is required to replace a recognized Idea2Run copy. Skill discovery and plugin packaging follow the [official skill mechanism](https://developers.openai.com/plugins/build/skills) and [plugin format](https://developers.openai.com/plugins/build/plugins). Discovery may vary with the host version and permissions.

### Choose an installation scope

- **Project-local (default)**: `npm run setup` installs into this source project's `.agents/skills/idea2run`, available only in that project and its subdirectories. Use the target-directory command above for another project; moving to a different project does not make this copy available there.
- **Global (current user)**: run `npm run setup -- --global` from the source/extracted directory to install into `~/.agents/skills/idea2run`, available across this user's projects. On Windows this is usually `%USERPROFILE%/.agents/skills/idea2run`; administrator privileges are not required.

Scope follows [Codex local skill discovery](https://developers.openai.com/codex/skills). `--global` cannot be combined with a target project directory; only an explicit selection writes into the user directory. Neither method changes Codex configuration or marketplaces. Project-local and global copies are separate, and same-name skills are not merged. If both appear, check their entry paths and select the intended copy; updates must also use its scope.

You can also ask the Agent to read the source skill directly, without installation:

```text
Read <absolute repository path>/plugins/idea2run/skills/idea2run/SKILL.md and follow its workflow to help implement this idea: <your idea>.
```

During development, refer to the source file directly so copied skills do not fall behind your changes. The plugin package is in `plugins/idea2run/` and includes both portable and Codex-compatible manifests. The repository also contains the plugin catalog used by the installation commands above.

## Installation and updates

Current version: **v0.3.1**. For installation and updates, obtain the source package from the [latest GitHub release](https://github.com/wangyangwjy/idea2run/releases/latest), then choose an installation scope. If the main branch contains later development, use the release tag and attachments as the version reference. Reinstalling from an old source directory is not an upgrade.

### Project-local skill

Obtain the new source or extract the delivery package, then run from that directory:

```powershell
npm run setup -- --update
# Specify a different target project when needed:
node scripts/install-skill.mjs "D:\your-project" --update
```

This also supports v0.1.1 copies without installation markers. Updates prepare the new copy first, move the entire old skill into the target project's `.idea2run/skill-updates/update-*/previous`, then replace the skill entry. The command prints the entry and backup paths. Local edits and extra files remain in the backup for migration, and existing `.idea2run/` progress is not cleared. If the skill is missing, `--update` performs the first installation.

Unrelated skills, symbolic links/directory junctions, existing installation locks, and preparation failures stop the update before the old skill is moved. Replacement failures attempt automatic restoration; if restoration also fails, the preserved old-copy path is printed. Backups are not automatically deleted. To roll back, have the Agent inspect the printed backup and current entry, then perform explicitly authorized restoration rather than deleting the entire `.idea2run/` directory.

### Global skill for the current user

Run first installation or updates from the new source/extracted directory:

```powershell
npm run setup -- --global
# An existing global copy:
npm run setup -- --global --update
```

Global updates reuse the same backup and restoration mechanism. Backups stay in the user directory's `.idea2run/skill-updates/update-*/previous`; the command prints the actual path. This does not update project-local skills, clear project progress, or change installed marketplace plugins. Global installation and updates were actually checked using an isolated user directory; the real user's global installation was not modified.

### Repository marketplace plugin

After publication, users whose README installation uses the `idea2run` marketplace run:

```powershell
codex plugin marketplace upgrade idea2run
codex plugin add idea2run@idea2run
```

Use the actual installation source's marketplace name, which can be checked with `codex plugin list`. Local marketplaces such as `personal` do not need Git snapshot refreshes: after confirming their source directory is updated, reinstall with the matching selector, such as `codex plugin add idea2run@personal`. Do not refresh all marketplaces or edit `marketplace.json` or global configuration by default. Update commands were checked against the local CLI help; no actual global plugin update was performed during this work.

After updating the selected scope, start a new task within that scope and type `$` to select Idea2Run. Check that the new entry is in use. If discovery fails or an old cache remains, ask the Agent to read the current source skill directly rather than automatically removing other installations.

Installation output must be understandable to ordinary users: current version, project-local/global scope, actual skill entry, old-copy backup for updates, and a first-use example. When installing into a working project, run the command with its absolute target path from the downloaded source; do not silently treat the download directory as the user's project.

v0.2.3 adds an explicit global installation choice and scope guidance. Plugin acceptance checks requirements, options, planning, handoff/feedback, delivery, and installation/updates. Extra sample-application performance or general host-Agent compatibility is not a gate for this plugin delivery; untested conditions remain unknown.

## What you get

1. Describe your idea. Idea2Run restates the goal, inputs and outputs, success criteria, and hard constraints, then groups gaps that affect the choice into one short clarification, usually 1–3 questions. You do not repeat known context; details that do not affect the approach wait until planning.
2. Compare a few short options: ready to use, adaptation required, or development required, with capabilities, gaps, reasons for recommending them, environment, necessary downloads, implementation and maintenance effort, sources, and unknowns.
3. Choose an option. Idea2Run expands it into a complete execution plan.
4. Approve the plan, then choose to implement it yourself or get Agent prompts.
5. Copy one stage's prompt at a time. Return the results to Idea2Run to continue or fix the current stage.
6. Receive four fixed delivery items: what was built, how to start it, how to use it, and what remains unfinished, including a direct entry, shortest startup steps, and a usage example.

Plans and prompts distinguish required existing inputs and earlier outputs from directories this stage will create. With creation already authorized, preparation creates and checks the specified project/output directories instead of asking the user to create them manually. Conflicting paths are preserved; missing inputs still stop the stage. v0.2.1 fixes a real usability issue where preparation stopped because a new project's directories had not yet been created.

v0.2.2 adds startup usability checks: choose an existing entry appropriate for the user, show a short status, actual output location and next step, and provide usage/help that does not execute implementation work. Detailed structured logs are available as needed. Check first launch, help and reuse without adding unrelated interfaces or services.

The host provides web search. If search is unavailable, Idea2Run explains the limitation, asks for source material, or leaves candidates unverified. Checking documentation does not mean installation or execution has succeeded.

If a key condition is unanswered, Idea2Run waits before making a recommendation; read-only research can continue. If you cannot determine it yet, preliminary approaches are conditional and marked “needs confirmation.” Questions about environment and effort stay relevant to the goal, without a generic hardware questionnaire.

“Ready to use” means a complete project can meet the key requirements through installation or configuration. “Adaptation required” means a complete project still needs code changes or an added integration. “Development required” means building a missing application or core functionality from libraries, frameworks, or examples. Mixed approaches are labeled by their main gap. Labels describe what documentation supports, rather than proving the project runs in your environment; uncertain compatibility conditions are marked “needs confirmation.” Complete projects come first, development options are not added just to fill the list, and candidates that conflict with hard constraints are excluded with a reason.

Each option uses a short card or compact table, with shared conditions grouped together and installation tutorials left until after selection. Sources include the actual review date, version and license or their unknown status. Download sizes, compatibility, and completion times remain unknown without evidence; missing information must not be presented as zero downloads or zero effort.

## Lightweight local handoff tools

Conversation alone is enough to recommend options. The optional tools require Node.js 22+ and only save progress and generate files. They have no third-party dependencies and do not execute commands from the plan.

```powershell
npm run idea2run -- --help
```

When an Agent needs to save progress, it follows the skill's `references/local-progress.md`. Records include the idea, environment summary, candidates, selected approach, plan, approvals, and result feedback. They are stored in the Git-ignored `.idea2run/` directory by default.

The tools record approach selection, plan approval, Agent handoff choice, and current-stage authorization separately. Changing the plan or approach invalidates previous approvals and applicable progress. A failed stage does not advance to the next one. Each prompt is limited to 2,400 characters; longer prompts must be split or shortened. Unknown machine details stay unknown.

Requirement summaries reuse `idea` and `environment`. The approach category and capability gaps go in `summary`; environment, downloads, and implementation work go in `requirements`; limitations and unknowns go in `caveats`. No new state fields are needed. Prompts between Agents include paths to required earlier outputs and relevant unknowns. Inspect outputs from actual feedback before advancing, and record documentation conclusions, Agent reports, and the receiving Agent's checks separately.

Handoffs distinguish the project root, actual execution directory, and input/output directories. Prefer absolute file paths and state the base directory for relative paths; avoid ambiguous phrases such as “this directory.” Report a missing path rather than expanding searches into unspecified directories. Record the Agent application separately from the command-line environment: a terminal name does not establish which Agent host was verified.

When actual feedback satisfies the current checks and the approach and authorization are unchanged, provide the next-stage prompt directly, referencing necessary earlier outputs rather than asking again whether to continue. Failures stay at the current stage, and incomplete feedback prompts a specific request for missing evidence. After the final stage passes, deliver the four items in `references/delivery.md`; if only plans or prompts were generated, state that the application has not yet been implemented or run.

The generated next prompt includes the most recently passed stage's feedback summary, limited to 240 characters and still labeled as a user/Agent report. Full feedback stays in the session. Put essential output paths early in the summary and keep complete required paths in the current task; execution must not depend on shortened text.

Exports contain `plan.md` and `session.json`, plus `current-prompt.md` when the required conditions are met. Exports use a new directory to avoid overwriting existing files. The tools help record approvals; they cannot replace the host's permission controls or verify the truth of user or Agent reports.

## Development and verification

```powershell
npm test
npm run check
npm run demo
```

`test` checks state transitions, authorization, unknown versions, failure retries, complete feedback, invalidation after changes, paths containing Chinese characters or spaces, overwrite protection, legacy update backups, progress preservation, unrelated skills and directory-link protection, preparation failures, and installation locks.

`check` checks plugin manifests, version consistency, references, file encoding, and script syntax.

`demo` uses **synthetic test data** to generate a plan and prompts for two stages under `.idea2run/`. It does not download, install, or run any open-source candidate and is not evidence of a real implementation. Test data stays in `tests/` and is not included in the plugin package.

A separate staged handoff within the host was actually executed: one Agent used the source skill to clarify the README link checker requirements and inspect preparation, a fresh Agent without the earlier dialogue built a local tool from the current prompt and preparation output, and the receiving Agent independently ran acceptance checks. All 14 local links in the two real READMEs passed without modifying inputs; error handling was checked with separately labeled synthetic probes. A user later relayed an Agent execution report after manually handing over the prompt: the real inputs and three error probes matched expectations, and local checks by the receiving Agent agreed. The report exposed a path ambiguity, which has been corrected. The other Agent application was not identified, and that Agent has not rerun the revised prompt. Records and the tool stay in the ignored `.idea2run/` directory and are not packaged with the plugin. These results do not prove coverage of all Markdown syntax, compatibility across hosts, or the entire interaction from selection to delivery.

v0.2.0 also completed an actual three-stage local handoff: a fresh Agent received the current prompt, installed the skill, and returned results; after inspecting outputs, the receiving Agent generated the next stage, and a fresh Agent updated the skill and returned the complete backup path. Inspection found that feedback-summary changes made during verification were missing from the copy, so the update stage was repaired before a fresh Agent verified and delivered the four items. All seven skill files finally matched, the actual old copy was preserved, and the installed helper's help command exited 0. The modification note was a labeled sample; installation, updates, file inspection, and help execution were real. This does not establish compatibility with other hosts or automatic discovery in a new task.

```text
plugins/idea2run/                Distributable plugin
  skills/idea2run/SKILL.md       Conversation workflow
  skills/idea2run/references/    Handoff format and progress guidance, read as needed
  skills/idea2run/scripts/       Local progress and export tools
scripts/                        Installation, checks, and synthetic demo
tests/                          Workflow tests and synthetic inputs
```

## Version releases and GitHub synchronization

Each published version provides GitHub source, a matching `vVERSION` tag, a Release, and an `idea2run-VERSION.zip` package. Users install from the [latest release](https://github.com/wangyangwjy/idea2run/releases/latest). Local completion alone does not mean GitHub is updated.

1. Update `package.json`, the lockfile, both plugin manifests, bilingual homepages/development/compatibility guides, and both changelogs. `npm run check` requires matching current versions and checks release tags against the manifests.
2. Run `npm test`, `npm run check`, and `npm audit --omit=dev`; inspect actual installation/updates, documentation, and `git diff`. Commit public files only.
3. Within the user's authorized GitHub synchronization scope, commit and push main, then create and push the matching version tag for that commit. Without publication authorization, prepare reviewable changes only; do not repeatedly ask when authorization already exists.
4. `.github/workflows/release.yml` checks main/PR changes. After a version tag passes checks on Linux and Windows with Node.js 22, it creates the full source ZIP, SHA256SUMS, and bilingual release notes, then publishes the GitHub Release. Fix failures first; do not overwrite published tags or invent success.
5. Verify the remote commit, tag, release version, and download assets. Check package manifest versions and exclusion of private records, then give users the release link and shortest usage steps. If source is pushed but the Release is unfinished, state that publication is incomplete.

v0.2.4 presents first use as “choose scope → install → describe an idea,” and installation output now includes the version and invocation example. Later versions follow this synchronization flow. The workflow uses GitHub's built-in token without adding accounts or credential configuration. The full source package includes public documentation, scripts, and tests; installed skills contain only plugin skill files.

## Contributing

Prioritize issues encountered in real use: the user's goal, the chosen approach, the failed stage, and a minimal reproduction that can be shared publicly. Remove private paths, input content, and tokens.

Keep the main workflow short. New capabilities should help users reach a usable result faster. Run tests and checks after changing the workflow or helper scripts. Distinguish source verification, documentation checks, and execution feedback; do not present synthetic data as real-world test results.
