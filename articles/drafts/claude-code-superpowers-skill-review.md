---
slug: "claude-code-superpowers-skill-review"
status: READY_FOR_REVIEW
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
extension_version: null  # UNVERIFIED: no version tag or release found on the main repo at research time; needs confirmation before publish
os: "Windows"
fact_check:
  verdict: "PASS"
  checked_at: "2026-09-23"
  issues: []
sources:
  - "https://github.com/obra/superpowers"
  - "https://github.com/obra/superpowers/blob/main/README.md"
cost_usd: 0
---

## 1. What is it?

Superpowers isn't a single Claude Code skill — it's an entire development-methodology library packaged as one plugin. Installing it adds a set of skills that automatically trigger at different stages of a coding session, covering everything from brainstorming and planning through test-driven development, code review, and branch cleanup.

## 2. Why it matters

obra/superpowers is one of the largest projects in the Claude Code ecosystem: 280,000+ GitHub stars and 25,000+ forks (as of September 2026). It's listed in Anthropic's official plugin marketplace (`claude-plugins-official`), and its install paths extend beyond Claude Code to Antigravity, Codex, Cursor, Gemini CLI, GitHub Copilot CLI, Grok, Kimi Code, and OpenCode. The project is maintained by Jesse Vincent of Prime Radiant.

## 3. A name collision worth flagging

Several repositories use the name "superpowers," and they are not interchangeable:

- **thecodingrobot/superpowers** is a separate shim that clones `obra/superpowers-skills` at runtime.
- **abudhahir/superpowers** is an unrelated tool built for VS Code / GitHub Copilot.
- **jsholmes/superpowers** is a fork of obra's repo with 0 stars.

If you're searching for this project, confirm you're looking at `obra/superpowers` and that the star count (280K+) matches before installing.

## 4. Key features

- A full skill library rather than a single skill — brainstorming, TDD, code review, and branch-finishing steps each ship as their own skill under one plugin.
- Listed in Anthropic's official plugin marketplace (`claude-plugins-official`).
- Install paths documented for multiple AI coding tools beyond Claude Code (Antigravity, Codex, Cursor, Gemini CLI, GitHub Copilot CLI, Grok, Kimi Code, OpenCode).
- Governance is closed to new skills: the project accepts modifications to existing skills but not new skill contributions.
- The brainstorming skill's optional "visual companion" loads a logo image from Prime Radiant's server and reports only the Superpowers version (no project, prompt, or agent data) — on by default, disabled via the `SUPERPOWERS_DISABLE_TELEMETRY` environment variable.

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

## 7. Automation ideas

<!-- to fill in after hands-on test: no automation workflow was actually built or observed in this test run — do not speculate from the README alone -->

## 8. Pros

- Clean, fast install with no errors (verified 2026-09-18, Claude Code 2.1.276, Windows).
- On an open-ended task, the brainstorming skill triggered automatically and visibly (tool-call banner), and Claude used it to ground its clarifying question in the repo's own CLAUDE.md rather than asking generically.

<!-- to fill in after hands-on test: TDD, code-review, and git-worktree stages not yet exercised -->

## 9. Watch-outs

- Multiple unrelated repositories share the name "superpowers" — verify you're installing `obra/superpowers` and that the star count matches before proceeding.
- The project does not accept new skill contributions, only modifications to existing ones. If your workflow needs a skill that doesn't exist yet, forking is the only option.
- The brainstorming skill's visual companion phones home a version number by default (not project/prompt/agent data); disable it with `SUPERPOWERS_DISABLE_TELEMETRY` if that matters to you.
- No version tag or release was visible on the main repository at research time — the exact version installed could not be pinned down.
- Auto-triggering is inconsistent by design: it was weak-to-absent on a small, single-function task and clearly visible on an open-ended architecture task. Don't expect it to fire on every request.

## 10. FAQ

**Does Superpowers auto-trigger on every request?**
No. In this test, it triggered visibly (with a tool-call banner) on an open-ended architecture task, but a small, self-contained task proceeded without the brainstorming/TDD pattern appearing.

**Is `obra/superpowers` the same as other "superpowers" repos I might find?**
No. `thecodingrobot/superpowers`, `abudhahir/superpowers`, and `jsholmes/superpowers` are all different projects (a runtime shim, an unrelated VS Code/Copilot tool, and a low-activity fork, respectively). Confirm you're on `obra/superpowers` before installing.

**Does it phone home?**
Only in one narrow spot: the brainstorming skill's optional visual companion loads a logo image from Prime Radiant's server and sends the Superpowers version number (no project, prompt, or agent data). It's on by default — set `SUPERPOWERS_DISABLE_TELEMETRY` to turn it off.

**Can I contribute a new skill to the project?**
Not directly — the project currently only accepts modifications to existing skills, not new skill submissions.
