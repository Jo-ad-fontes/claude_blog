---
slug: "claude-code-superpowers-skill-review"
status: PUBLISHED
title: "Superpowers for Claude Code: A Hands-On Review of the 280K+-Star Skill Library"
seo_title: "Superpowers for Claude Code — Review & Install Guide"
meta_description: "A hands-on review of obra/superpowers, the Claude Code skill library covering brainstorming, TDD, code review, and more — install test and behavior notes."
primary_keyword: "Superpowers Claude Code"
secondary_keywords:
  - "Claude Code skills"
  - "obra superpowers"
  - "Claude Code plugin marketplace"
lang: "en"
category: "skills"
content_type: "Daily Review"
tags: []
candidate_id: "obra-superpowers"
tested_at: "2026-09-18"
claude_code_version: "2.1.276"
extension_version: "6.4.1"  # as reported by /plugin on 2026-10-04 (installed 2026-09-18)
os: "Windows"
fact_check:
  verdict: "WARNING"
  checked_at: "2026-10-04"
  issues:
    - "Skill-library description: wording difference only ('composable skills' vs 'library', 'install the whole library' inferred, 'branch cleanup' narrower than README's 'Branch Completion'); core content matches the README."
    - "Logo load / telemetry: wording difference only (README says 'our website'; verifier said default-on was inferred, and the Claude Code DISABLE_TELEMETRY opt-outs the README also honors are not mentioned)."
  accepted_warnings:
    - claim: "Skill library description"
      decided_by: "user"
      decided_at: "2026-10-04"
      rationale: "Wording difference from the README's 'composable skills'; meaning is the same; the previous run was PASS."
    - claim: "Logo load / telemetry"
      decided_by: "user"
      decided_at: "2026-10-04"
      rationale: "Raw README states 'By default, ... is loaded from our website' (checked directly via curl 2026-10-04); omitting the Claude Code opt-outs is an omission, not an error."
sources:
  - "https://github.com/obra/superpowers"
  - "https://github.com/obra/superpowers/blob/main/README.md"
cost_usd: 0
---

## 1. What is it?

Superpowers isn't a single Claude Code skill — it's an entire development-methodology library packaged as one plugin. Installing it adds a set of skills that automatically trigger at different stages of a coding session, covering everything from brainstorming and planning through test-driven development, code review, and branch cleanup.

## 2. Why it matters

obra/superpowers is one of the largest projects in the Claude Code ecosystem: 280,000+ GitHub stars and 25,000+ forks (as of September 2026). It's listed in Anthropic's official plugin marketplace (`claude-plugins-official`), and its install paths extend beyond Claude Code to Antigravity, Codex, Cursor, Gemini CLI, GitHub Copilot CLI, Grok, Kimi Code, and OpenCode. Superpowers was built by Jesse Vincent and the Prime Radiant team.

## 3. A name collision worth flagging

Several repositories use the name "superpowers," and they are not interchangeable:

- **thecodingrobot/superpowers** is a plugin that clones `obra/superpowers-skills` at runtime; GitHub shows it as a fork of `obra/superpowers`.
- **abudhahir/superpowers** is a workflow tool that syncs state between VS Code, a terminal CLI, and GitHub Copilot; its repository description mentions a Claude Code skills library.
- **jsholmes/superpowers** is a stripped-down fork of `obra/superpowers`.

If you're searching for this project, confirm you're looking at `obra/superpowers` and that the star count (280K+) matches before installing.

## 4. Key features

- A full skill library rather than a single skill — brainstorming, TDD, code review, and branch-finishing steps each ship as their own skill under one plugin.
- Listed in Anthropic's official plugin marketplace (`claude-plugins-official`).
- Install paths documented for multiple AI coding tools beyond Claude Code (Antigravity, Codex, Cursor, Gemini CLI, GitHub Copilot CLI, Grok, Kimi Code, OpenCode).
- Contributions: per the README, new skills are generally not accepted, and updates to skills must work across all the coding agents the project supports.
- The brainstorming skill's optional "visual companion" loads a logo image from the project's website and reports only the Superpowers version (no project, prompt, or agent data) — on by default, disabled via the `SUPERPOWERS_DISABLE_TELEMETRY` environment variable.

## 5. Installation

```
/plugin install superpowers@claude-plugins-official
```

or, via the dedicated marketplace:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

**Verified 2026-09-18, Claude Code 2.1.276, Windows:** running `/plugin install superpowers@claude-plugins-official` completed in a few seconds with `✓ Installed superpowers. Plugin is now active.` and no errors.

## 6. Hands-on test

Tested 2026-09-18 on Claude Code 2.1.276, Windows.

- Installation via the official marketplace command completed cleanly in a few seconds, no errors.
- **Correction to a common description of the slash commands:** an earlier draft assumed the README documented three commands — `/superpowers:brainstorm`, `/superpowers:write-plan`, `/superpowers:execute-plan` — but that description came from a different fork's README, not the official `obra/superpowers` docs. The actual `/help` output shows each of the 12 skills exposed as its own slash command matching its skill name (e.g., `/superpowers:brainstorming`, `/superpowers:test-driven-development`).
- On a small, self-contained task (writing a cycloid function) issued without a slash command, Claude asked one light clarifying question and went straight to implementation — the RED-GREEN-REFACTOR pattern did not appear.
- On an open-ended architecture task (building a file upload API) issued without a slash command, the tool-call banner explicitly showed `Skill(superpowers:brainstorming) → Successfully loaded skill`. Claude also read the repository's CLAUDE.md, recognized the request didn't match the documented pipeline, and asked a structured question about the goal before proceeding.
- The TDD, code-review, and git-worktree stages were not exercised in this test.

## 7. Pros

- Clean, fast install with no errors (verified 2026-09-18, Claude Code 2.1.276, Windows).
- On an open-ended task, the brainstorming skill triggered automatically and visibly (tool-call banner), and Claude used it to ground its clarifying question in the repo's own CLAUDE.md rather than asking generically.

## 8. Watch-outs

- Multiple repositories share the name "superpowers" — verify you're installing `obra/superpowers` and that the star count matches before proceeding.
- Per the README, new skill contributions are generally not accepted, and updates to skills must work across all the coding agents the project supports. If your workflow needs a skill that doesn't exist yet, forking may be the practical route.
- The brainstorming skill's visual companion phones home a version number by default (not project/prompt/agent data); disable it with `SUPERPOWERS_DISABLE_TELEMETRY` if that matters to you.
- No version tag or release was visible on the main repository at research time, but `/plugin` reported version 6.4.1 as of 2026-10-04.
- Auto-triggering is inconsistent by design: it was weak-to-absent on a small, single-function task and clearly visible on an open-ended architecture task. Don't expect it to fire on every request.

## 9. FAQ

**Does Superpowers auto-trigger on every request?**
No. In this test, it triggered visibly (with a tool-call banner) on an open-ended architecture task, but a small, self-contained task proceeded without the brainstorming/TDD pattern appearing.

**Is `obra/superpowers` the same as other "superpowers" repos I might find?**
No. `thecodingrobot/superpowers`, `abudhahir/superpowers`, and `jsholmes/superpowers` are other repositories that use the same name (a plugin that clones `obra/superpowers-skills` at runtime and is shown as a fork of `obra/superpowers`, a workflow tool that syncs state between VS Code, a terminal CLI, and GitHub Copilot and whose repository description mentions a Claude Code skills library, and a stripped-down fork, respectively). Confirm you're on `obra/superpowers` before installing.

**Does it phone home?**
Only in one narrow spot: the brainstorming skill's optional visual companion loads a logo image from the project's website and sends the Superpowers version number (no project, prompt, or agent data). It's on by default — set `SUPERPOWERS_DISABLE_TELEMETRY` to turn it off.

**Can I contribute a new skill to the project?**
Per the README, new skill contributions are generally not accepted, and updates to skills must work across all the coding agents the project supports.
