---
slug: "claude-code-hookify-plugin-review"
status: PUBLISHED
title: "hookify for Claude Code: Hands-On Review, and the Rule That Silently Did Nothing"
seo_title: "hookify Claude Code Plugin Review: Hands-On Test on Windows"
meta_description: "A hands-on test of the hookify plugin for Claude Code on Korean Windows: how block and warn rules behave, why a rule was silently skipped, and what it can't stop."
primary_keyword: "hookify claude code plugin"
secondary_keywords:
  - "claude code hooks"
  - "hookify review"
  - "claude code block dangerous commands"
lang: "en"
category: "plugins"
content_type: "Daily Review"
tags: []                  # taxonomy.yaml tags are intentionally empty for now; left for a human to decide
candidate_id: "anthropics-hookify"
tested_at: "2026-10-05"
claude_code_version: "2.1.289"
extension_version: "commit d182ca4"   # installed from anthropic-plugin-directory; no semantic version recorded
os: "Windows (Git Bash), Korean locale (cp949)"
fact_check:
  verdict: "PASS"
  checked_at: "2026-10-05"
  issues:
    - "Note: README checks were done by curl + grep on the full raw README and LICENSE; marketplace.json and star count come from earlier checks the same day"
    - "Note: README claims are labeled github_readme; verifiers called it a boundary case vs official_docs (human to decide)"
    - "Note: the hands-on observations added after the first check (/hookify:help text, python/py/python3 3.14.7, installed-copy license files, Marketplaces screen, Discover-tab install) were supplied by the human after the test; only consistency with the record was checked"
    - "Note: manifest check covers claude-plugins-official only; the Anthropic Directory manifest was not checked, and whether the two copies are identical code is unverified"
sources:
  - "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/hookify"
  - "https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json"
  - "https://github.com/anthropics/claude-plugins-official"
  - "data/research/hookify-sandbox-record-2026-10-05.md"   # first-hand test record (hands_on), not a public URL
cost_usd: 0
---

**Short version:** On Korean Windows, my hookify rules containing Korean text and emoji were silently skipped, so commands went through. Starting Claude Code with `PYTHONUTF8=1` fixed it; ASCII-only rules also worked in a direct hook run. Once working, block stopped a named delete command and warn only displayed a message, but a rename (`mv`) got past the rule. Treat it as a speed bump, not a safety boundary.

## What is it?

hookify is a Claude Code plugin that turns a plain-language description of "don't let Claude do this" into a hook rule. Instead of editing `hooks.json` by hand (the plugin's own `/hookify:help` output says you don't), you describe the behavior, and the plugin writes a small Markdown rule file under `.claude/` (named `hookify.<name>.local.md`). Each rule has YAML front matter that picks an event type (bash, file, stop, prompt, or all) and an action, either warn or block.

In one line: a way to write guardrail hooks as Markdown rules, made by Anthropic and, according to the official marketplace manifest, listed there.

## Why it matters

hookify is one of the plugins in Anthropic's official plugin repository, and it targets a need some users have: a hard stop on a specific action rather than a polite request in a prompt.

One number to treat carefully: the repository that contains hookify has more than 37,000 GitHub stars. That is the whole monorepo, not hookify alone. I could not find a star or install count for hookify by itself, so I won't claim one.

## A caution worth flagging

Before installing, check that the plugin's author is Anthropic.

There is also a source-label wrinkle I hit myself. My installed copy came from `anthropic-plugin-directory`, which in the `/plugin` Marketplaces screen is the built-in "Anthropic Directory" marketplace (more than 2,400 plugins listed when I looked). That is a separate marketplace from `claude-plugins-official` (the `anthropics/claude-plugins-official` repository, with more than 300 plugins). My earlier research listed hookify under `claude-plugins-official`, and the manifest check in this review covers that marketplace only; I did not check the Directory's own manifest. Whether the two copies are identical code is unverified.

## Key features

Based on the plugin's README:

- Rules are Markdown files with YAML front matter. Events are bash, file, stop, prompt, or all; actions are warn or block.
- Commands: `/hookify`, `/hookify:list`, `/hookify:configure`, `/hookify:help`. The README says rules apply without a restart (documented; I did not test this separately).
- Requires Python 3.7 or newer, with no dependencies beyond the standard library. The README says MIT, but the LICENSE file in the same folder is Apache 2.0 text; I couldn't tell which applies. I saw the same mismatch in my installed copy (commit d182ca4).

What the installed copy actually contained in my test: four commands (configure, help, hookify, list), a `conversation-analyzer` agent, a `writing-rules` skill, and hooks on PreToolUse, PostToolUse, Stop, and UserPromptSubmit.

## Installation

I installed it from the Discover tab of the `/plugin` menu, at project scope, and confirmed it showed as Enabled in the Installed tab.

The command `/plugin install hookify@claude-plugins-official` appears in my research notes, but I did not run it, so treat that as documented, not yet verified.

## Hands-on test

**Environment:** Claude Code 2.1.289, Windows with Git Bash, Korean locale, Claude Pro login. I tested in a separate sandbox folder, not in a real project. One caveat: a SessionStart hook from the superpowers plugin was also loaded, so the environment was not perfectly clean.

### Creating a rule

`/hookify:help` worked. The help text says to run `/hookify <description>`, but in my environment `/hookify` returned "Unknown command". Running `/hookify:hookify <description>` did create rules. I don't know why; take it as "in my environment" only.

I described the rule in Korean. Claude turned it into a rule file with front matter fields `name`, `enabled`, `event`, `pattern`, and `action`, plus a body that is the message shown when the rule fires. The generated pattern was a regex matching delete-style commands (rm, del, unlink, and similar) followed by `dummy2.txt`. The message body contained Korean text and emoji.

### The first test failed, silently

Right after creating the rule, I deleted `dummy.txt` and `dummy2.txt`. No warning, no block; the files were gone. Restarting Claude Code (`/exit`, then relaunch) changed nothing. The `/hooks` screen showed hookify's PreToolUse hook registered, and nothing on screen indicated an error.

### Why it failed

Running the hook script (`pretooluse.py`) directly, with `CLAUDE_PLUGIN_ROOT` set, printed an error saying the rule file was malformed because the `cp949` codec could not decode byte `0xf0` at position 172. The script's output was `{}` with exit code 0, which means "allow".

With `PYTHONUTF8=1` set, the same input produced a `deny` decision and the block message. Starting a real Claude Code session with `PYTHONUTF8=1` made both block and warn rules work.

My reading, and it is an inference: the plugin seems to read rule files without specifying an encoding, so Windows falls back to cp949, and the failure point lines up with the emoji at the start of the message body. I did not read the plugin's source to confirm this.

What I did confirm is the effect: when a rule file can't be read, that rule is skipped and the command goes through (fail-open).

Two workarounds worked:

1. Start Claude Code with `PYTHONUTF8=1`.
2. Write rules in plain ASCII, with no Korean or emoji. In a direct hook run, an ASCII rule denied the command even without `PYTHONUTF8`, and it still worked when two broken rule files sat in the same folder (the run printed two error lines). Whether those errors are visible in a live session, I did not check.

### Block vs. warn

With `PYTHONUTF8=1` in a real session:

- **block:** PreToolUse showed a "Blocked by hook" error, the command did not run, and the file stayed.
- **warn:** the warning appeared in PreToolUse and the command ran. The same warning appeared again in PostToolUse, so twice in total.

One observation, seen once and not repeated: after a warn test, Claude replied that it hadn't seen any warning message. That hints the warning may reach you but not the model, but one data point doesn't establish it.

### What the rule did and didn't stop

The rule matches when a delete command and the file name appear together in the command string.

| Command | Result |
|---|---|
| `rm dummy2.txt`, `rm ./dummy2.txt`, `rm -f dummy2.txt` | Blocked |
| `mv dummy2.txt gone.txt` | Passed in a real session; `gone.txt` was created |
| `rm *.txt` | Passed in a direct hook run (files untouched) |
| `python3 -c "import os; os.remove('dummy2.txt')"` | Passed in a direct hook run (files untouched) |

In the real session, `rm *.txt` was refused, but by Claude Code's auto-mode classifier ("Irreversible Local Destruction"), not by hookify. The Python deletion was not run because the model declined on the strength of the earlier refusal. Neither case shows hookify stopping anything, so I'm not counting them as evidence for it.

Two other things I excluded: when Claude said it wouldn't delete a file because rules existed (after `/hookify:list`), that was the model's own choice, not a hook block. And commands you run yourself with the `!` prefix don't pass through hooks, so they can't test a rule.

### Not verified

- Behavior on other operating systems or locales
- Whether this still reproduces on newer versions
- Why the `/hookify` shortcut didn't work
- A comparison against the plugin's source for how it handles encoding
- Whether the two marketplace copies are the same code
- Whether the model receives warnings

## Automation ideas

The pieces I saw working in a real session suggest one narrow use: a block rule on a specific, named destructive command, as a speed bump against accidental runs. Everything beyond that, such as broad safety policies, is not something this test supports, given how easily `mv` or a wildcard got past the rule I wrote.

## Pros

- Turning a plain-language (Korean) description into a working rule file worked once I used `/hookify:hookify` and handled the encoding issue; neither was smooth at first.
- With UTF-8 enabled, block stopped the command and left the file intact; warn showed a visible message while letting the command run.
- Rules are plain Markdown files in the project, easy to read.

## Watch-outs

- **Silent skipping on non-UTF-8 Windows.** In my Korean Windows setup, a rule containing Korean text or emoji was skipped without any visible error, and the command went through. If you rely on a rule, test it by trying to trigger it before trusting it. Fixes that worked: `PYTHONUTF8=1`, or ASCII-only rules. This is confirmed only for my environment (Korean Windows, cp949, project-scope install).
- **It's string matching, not a safety boundary.** A rename, a wildcard, or a different interpreter all got around the rule I wrote. Treat it as accident prevention.
- **Command name differs from the docs.** `/hookify <description>` didn't work for me; `/hookify:hookify` did. The cause is unknown.
- **Check the author.** Make sure the plugin you install is authored by Anthropic.
- **Conflicting license notes.** The README says MIT, while the LICENSE file in the same folder is Apache 2.0 text, both in the public repository and in my installed copy. I couldn't tell which applies.
- **Star count belongs to the monorepo.** There is no per-plugin number I could verify.
- **Permissions, network access, and telemetry are not documented in the README.** That means "unknown", not "none."
- **Block rules may block legitimate work.** This is a general risk of any blocking hook, not something I ran into in this test.
- **Python 3.7+ is required** according to the README. On my PC, `python`, `py`, and `python3` all ran Python 3.14.7, and the hooks ran under `python3`, so I hit no path problems. That is one machine; other setups are unverified.

## FAQ

**Does hookify work on Windows?**
It worked for me once I handled the encoding issue. On Korean Windows (cp949), rules containing Korean or emoji were silently skipped until I started Claude Code with `PYTHONUTF8=1`. ASCII-only rules worked without it in a direct hook run. I tested one machine, so other setups are unverified.

**What's the difference between warn and block?**
In my test, block refused the command and left the file in place. Warn displayed a message but let the command run, and showed the message twice (before and after).

**Can hookify stop every way of deleting a file?**
Not the rule I wrote. It caught `rm` variants that named the file, but `mv` to another name went through, and a wildcard `rm` and a Python one-liner passed in a direct hook run.

**Why didn't my rule do anything?**
In my case, the rule file couldn't be decoded and was skipped. Run the hook script directly to see the error that the live session didn't show, and try `PYTHONUTF8=1`.
