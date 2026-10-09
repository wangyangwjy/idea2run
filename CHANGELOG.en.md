# Changelog

[简体中文](CHANGELOG.md) | [Usage](README.en.md)

## 0.3.0 — 2026-10-09

- One shared skill targets Codex, Claude Code, Hermes Agent, OpenClaw, and Pi. `--agent` selects native directories and invocation; Codex remains the default.
- Project/workspace and current-user global installations retain complete old-copy backups during updates. Global paths follow host directory environment variables without changing configuration, trust, or credentials.
- First-use instructions explain Hermes project trust, OpenClaw workspaces, Pi startup directories, and WSL/container/remote paths.
- The workflow uses actual available tools, reports missing search/file/execution capabilities, and checks file accessibility and path mapping before cross-environment handoff.
- Twenty-four tests cover five-host installation, updates, scope isolation, custom directories, and path protection. Compatibility docs distinguish file installation, native discovery, and complete use instead of claiming cross-host execution from fixtures.

## 0.2.4 — 2026-10-09

- Installation and use follow the user's sequence: choose project-local/global scope, use short Codex installation prompts or a direct download, and get minimal commands and first-use instructions. Target the actual working project and obtain the new source before updating.
- Installation output shows the version, scope, actual entry point, backup, and invocation example. Explicit global installation works across projects; project-local/global updates each preserve the complete old copy.
- Group key questions before recommending; short options distinguish ready to use, adaptation required, and development required, with environment, downloads, effort, and unknowns.
- Inspect actual handoff feedback before advancing. Prompts include a short summary of the latest passed stage; delivery always explains outputs, startup, usage, and unfinished work.
- New-project preparation creates target directories within existing authorization; missing inputs and path conflicts still stop the stage.
- Fifteen automated tests cover progress, handoff, installation, updates, and boundaries. Version checks include bilingual documentation, changelogs, and manifests.
- GitHub tags trigger checks and release publication, generating a full source ZIP and SHA256 checksums. Each release synchronizes source, tag, Release, and download package.

This release collects the previous 0.2.0–0.2.3 local development iterations. Their original local records are preserved; no public releases or validation results are retroactively invented.
