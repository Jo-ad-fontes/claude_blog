---
slug: "web-quality-skills-review"
status: PUBLISHED
title: "web-quality-skills for Claude Code: A One-PC Hands-On Test of Three of Its Six Skills"
seo_title: "web-quality-skills in Claude Code: Hands-On Test on Windows (Audit, Accessibility, Performance)"
meta_description: "A one-PC test of three of the six web-quality-skills Skills in Claude Code on Windows: what each did on a broken HTML page, and one time it edited my file."
primary_keyword: "web quality skills claude code"
secondary_keywords:
  - "addyosmani web-quality-skills"
  - "claude code accessibility audit skill"
  - "claude plugin marketplace add web-quality-skills"
  - "claude code lighthouse skill"
lang: "en"
category: "skills"
content_type: "Daily Review"
tags: []                  # taxonomy.yaml tags are intentionally empty for now; left for a human to decide
candidate_id: "addyosmani-web-quality-skills"
tested_at: "2026-10-15"
claude_code_version: "2.1.300"
extension_version: "web-quality-skills 2.0.0 (commit afa8da9, read from the installed plugin record)"
os: "Windows (Git Bash)"
fact_check:
  verdict: "WARNING"
  checked_at: "2026-10-15"
  human_decision: "accepted WARNING 1-4 (all remaining); FAIL 0"
  decided_by: "사용자 (typed /blog-accept)"
  decided_at: "2026-10-16"
  issues:
    - "WARNING 1: source_kind labels in the research JSON are loose for GitHub API responses (repo metadata, file tree, search results), a shell script, and SKILL.md files (all labeled github_readme)"
    - "WARNING 2: some draft statements are newer or more specific than the research JSON claims (file tree is 51 entries in full vs 'first 60' in the JSON; the two look-alike repositories' description text; the Lighthouse 13+ note is only in watch_outs). Values were rechecked at the source on 2026-10-15"
    - "WARNING 3: scope statements (3 of 6 Skills, plugin route only, observations come from the user's notes based on 6 screenshots, screenshots not received; prompts typed in Korean) rest on the author's statement"
    - "WARNING 4: analyze.sh '113 lines on the current main branch' can drift because main is mutable (confirmed with wc -l on 2026-10-15)"
    - "Note: absence claims (no api key, token, secret, credential mention; one telemetry mention) were confirmed with curl + grep -ciE on 11 raw files from main: 0, 0, 0, 0, and 1 (performance SKILL.md)"
    - "Note: auto-fixed 9 wording problems in round 1 (overstated or untested statements); round 2 rechecked the changed external-fact sentences. See data/factcheck/web-quality-skills-review.json"
sources:
  - "https://raw.githubusercontent.com/addyosmani/web-quality-skills/main/README.md"
  - "https://api.github.com/repos/addyosmani/web-quality-skills"
  - "https://api.github.com/repos/addyosmani/web-quality-skills/releases"
  - "https://raw.githubusercontent.com/addyosmani/web-quality-skills/main/CHANGELOG.md"
  - "https://api.github.com/repos/addyosmani/web-quality-skills/git/trees/main?recursive=1"
  - "https://raw.githubusercontent.com/addyosmani/web-quality-skills/main/.claude-plugin/marketplace.json"
  - "https://raw.githubusercontent.com/addyosmani/web-quality-skills/main/LICENSE"
  - "https://raw.githubusercontent.com/addyosmani/web-quality-skills/main/skills/web-quality-audit/SKILL.md"
  - "https://raw.githubusercontent.com/addyosmani/web-quality-skills/main/skills/web-quality-audit/scripts/analyze.sh"
  - "https://raw.githubusercontent.com/addyosmani/web-quality-skills/main/skills/accessibility/SKILL.md"
  - "https://api.github.com/search/repositories?q=web-quality-skills+in:name"
  - "https://agentskillsfinder.com/skills/code-review-and-quality"
  - "data/research/webquality-sandbox-record-2026-10-15.md"   # first-hand test record (hands_on), not a public URL
cost_usd: 0
---

**Short version:** I installed the `web-quality-skills` plugin in Claude Code on one Windows PC and gave it a deliberately broken 11-line HTML page. Three prompts, three different Skills loaded. Two of them (a web quality audit and an accessibility check) produced reports and left the file alone, and both said plainly that they had only read the source and measured nothing. The third, a performance prompt, edited my file with no question on screen first (I did not record that session's permission mode, which also decides whether Claude Code asks), again without measuring anything, and said so in its report. Everything below is one machine and one run of each prompt, unless I say otherwise.

**Scope note:** I tested three of the six Skills (`web-quality-audit`, `accessibility`, `performance`) through the Claude Code plugin route only. I did not test `seo`, `best-practices`, or `core-web-vitals`, the Chrome DevTools MCP path, or the Codex and Gemini installs the README also describes.

## What is it?

`web-quality-skills` is a set of six Agent Skills for checking and improving websites: `web-quality-audit`, `performance`, `core-web-vitals`, `accessibility`, `seo`, and `best-practices`. The repository calls itself an unofficial, measurement-first collection built around Lighthouse, Chrome DevTools, Core Web Vitals, WCAG, and search guidance. The copyright line in its license file names Addy Osmani.

In one line: six instruction sets that tell Claude how to audit a web page and which tools to prefer, plus one small shell script.

## Why it matters

The repository, `addyosmani/web-quality-skills`, had more than 2,900 GitHub stars and more than 250 forks when I checked on 2026-10-15. Those are numbers for this repository alone. It was created on 2026-01-18, its last push was 2026-08-24, and it was not archived. That is a snapshot of those dates, not a promise about the future.

The version story is thin. GitHub showed no releases and no tags when I looked. The version I can name is 2.0.0, from the plugin manifest, and the installed plugin record in my test pointed at commit `afa8da9`. The repository's CHANGELOG describes 2.0.0 as a shift from source-based advice to evidence-led audits: prefer browser performance traces and live Lighthouse audits when available, and drop unsupported ranking percentages and generic savings estimates. It also says the six Skill names and trigger phrases stay compatible with version 1.

## A caution worth flagging: same-name copies

A search of GitHub repository names turned up look-alike repositories under other owners. One, `RUSHYOP/mirror-addyosmani-web-quality-skills`, names this project as its source. Another, `costrict-plugins-repo/github-trending-web-quality-skills`, describes itself as an auto-generated mirror of a project with a similar name, and it is not clear from its description that it mirrors this one. Both had zero stars when I looked. I did not compare their code with the original, and I did not check whether the plugin is listed in other marketplaces. The marketplace manifest in the original repository names the marketplace `addy-web-quality-skills` and the plugin `web-quality-skills`, so check the owner (`addyosmani`) when you add it.

A third-party listing site, agentskillsfinder.com, also credits a code-review Skill to a separate repository by the same author, `addyosmani/agent-skills`. That is a different project from the one reviewed here, and I did not review it.

## Key features

Based on the README, the Skill files, and the installed copies (I compared them with the repository below):

- **Six Skills, one plugin.** The folders under `skills/` are `accessibility`, `best-practices`, `core-web-vitals`, `performance`, `seo`, and `web-quality-audit`. Some have extra reference documents. The only script file in the repository's whole file tree (51 entries) is `skills/web-quality-audit/scripts/analyze.sh`.
- **Tool routing.** The README and the audit Skill say they prefer live evidence when the agent has it: with Chrome DevTools MCP, a performance trace and a Lighthouse audit. Without it, they fall back to the Lighthouse CLI, PageSpeed Insights or CrUX tools, manual browser checks, and static inspection. The README calls the DevTools integration optional. I did not check whether the tool names it lists match the real Chrome DevTools MCP.
- **A small static analyzer.** The audit Skill points to `scripts/analyze.sh <path>` as a quick smoke test and says it is not a substitute for auditing a rendered page. I read the script (113 lines on the current main branch). Its comment says it is read-only, and the code I read uses only `grep`, `find`, and `jq`. It looks for a missing doctype, charset, viewport meta tag, `lang` attribute, or `<title>`, images without `alt`, and `http://` URLs, then prints JSON. If `jq` is missing it exits with a `missing_dependency` error. I did not run it. The installed copy matched main apart from line endings (see the hands-on section).
- **Example commands in the docs.** The accessibility Skill's automated-testing section shows `npx lighthouse https://example.com --only-categories=accessibility` and `npm install @axe-core/cli -g`, a global install. These are examples in a document. I did not see Claude propose either during my tests.
- **A line about keys.** The audit Skill describes the direct CrUX API as a fallback to use only when a key is already available or automation is requested.

## Installation

Documented in the README for Claude Code, and these are the commands I ran:

```
/plugin marketplace add addyosmani/web-quality-skills
/plugin install web-quality-skills@addy-web-quality-skills
```

Claude Code answered "Successfully added marketplace: addy-web-quality-skills" and then "Installed web-quality-skills. Plugin is now active." So the marketplace and plugin names in the README matched what I saw on screen. The README also lists other routes (`npx skills add addyosmani/web-quality-skills`, `npx add-skill addyosmani/web-quality-skills`, or copying `skills/*` into `~/.claude/skills/`). I did not run any of those. The README describes `add-skill`, which the two `npx` commands use, as a separate command-line tool. I did not look into who maintains it.

## Hands-on test

**Environment:** Claude Code 2.1.300 on Windows with Git Bash, model shown as Sonnet 5.5, Claude Pro. The plugin was installed with local scope in a sandbox folder outside my blog repository. The installed plugin record said version 2.0.0, commit `afa8da9`, installed 2026-10-15. I ran each prompt once.

**About the test page:** the `index.html` is a made-up 11-line page I wrote on purpose to be bad. It loads lodash from an external script, uses very light gray text (`#bbb` on `#fff`), has an image without `alt`, a clickable `div` with an `onclick`, and an `input` without a label. None of it is a real site. I typed the prompts in Korean; I translate them below.

**Installed files versus the repository:** I compared the six installed `SKILL.md` files and `analyze.sh` with the current main branch (commit `afa8da9`) as downloaded on 2026-10-15. They were identical once carriage returns were ignored; the installed files use Windows line endings and main uses Unix ones. I did not compare the `references/` documents. So where this review describes those seven files, it is describing what I actually installed.

### Test 1: "Check index.html from a web-quality point of view. Don't fix the file, just give me a report."

Claude loaded `web-quality-skills:web-quality-audit` (I rechecked the screen to confirm which Skill it was). It did not change the file. It said it had only read the source, and that it had run no browser measurements: no Lighthouse, no trace, no LCP, INP, or CLS numbers.

The report listed nine findings grouped as Critical/High, Medium, and Low, plus a summary by area: performance "not measured, one concern from the source", accessibility serious, SEO lacking, best practices lacking, and agentic browsing low. It flagged the gray text as a 1.9:1 contrast ratio and suggested `#767676` at 4.54:1. After the test I recomputed both with the WCAG relative-luminance formula and got 1.92:1 for `#bbb` on white and 4.54:1 for `#767676` on white, so the numbers held up. It ended by saying Lighthouse and a performance trace should be rerun under the same conditions after fixes. I saw no improvement percentages on the screens I captured.

### Test 2: "Look at accessibility only."

Claude loaded `web-quality-skills:accessibility`. The result was a report titled as a WCAG 2.2 check of `index.html`: eight findings (4 critical, 3 serious, 1 moderate), each with a WCAG criterion number and a line number. It stated that it had not run Lighthouse, axe, a screen reader, or keyboard testing, and it did not modify the file. It also listed separately the things it could not judge from the source alone, such as focus visibility, target size, and zoom or reflow behavior.

### Test 3: "Improve the site's speed."

Claude loaded `web-quality-skills:performance` and the screen showed "Successfully loaded skill". This time it edited `index.html` directly (a Write, six lines added and three removed). It removed the lodash script, added a doctype, a charset meta tag, and a viewport meta tag, and added `max-width:100%;height:auto` to the image. The screens I captured showed no question asking whether it could edit the file first. Whether Claude Code asks before an edit depends on its permission mode, and I did not record which mode that session was in, so I cannot say the Skill itself skipped a prompt.

Its report said it could not measure in a browser, that the effect was judged from reading the code, and that with no "before" numbers a before-and-after comparison was impossible. It did not run Lighthouse. It left the accessibility problems (contrast, the clickable `div`, the missing label, `alt`, and `lang`) untouched as unrelated to speed, and it said image optimization, caching, and server settings could not be judged from this one file.

### Where the README and my test differ

The README describes the Skills as measurement-first: use CrUX or real-user data to prioritize and DevTools traces to diagnose. In my one performance run on a PC without Chrome DevTools MCP, Claude edited the file without measuring anything, and it said so in its report. I would not generalize from one run. The honest summary is that the Skill's reports were upfront about what was not measured, but upfront reporting did not stop an edit. I also cannot say why it edited: my wording was "improve," which may have invited a change, and I did not repeat the prompt with different wording.

### What I did not see

The `analyze.sh` script was not run in any of the three tests as far as I could see, and no `jq` error appeared. I checked on 2026-10-15 and `jq` was not installed on this PC, so I cannot say whether the script was skipped, run out of sight, or simply not needed because Claude read the HTML directly. The last of those is a guess.

### Not verified

- Whether `analyze.sh` runs, and what the `jq` failure looks like on Windows
- The Skill count after installation and what the `/plugin` screen showed after install (my `/reload-plugins` ran before the install)
- Whether Claude ever proposes the global `npm install` or `npx lighthouse` commands from the docs
- Any real Lighthouse score change (I measured nothing)
- The `seo`, `best-practices`, and `core-web-vitals` Skills
- The Chrome DevTools MCP path
- Whether the same prompts give the same results on a second run
- Behavior on other PCs, other OSes, or other versions

## Automation ideas

The one pattern I saw work is narrow: ask for a report and say "don't fix the file" in the prompt. In Test 1, where I said that, the file stayed untouched. In Test 2 I asked for an accessibility look without saying either way, and the file also stayed untouched. One run each, so I would not build a pipeline on it. A performance prompt like the one in Test 3 edited the file, so if you automate anything with these Skills, run it in a copy of the files and review the diff. Beyond that, I have nothing tested to recommend.

## Pros

- The documented install commands worked as written, and the names on screen matched the README (one machine).
- In my three prompts, each one loaded a different Skill, and each name matched what I had asked for.
- The run where I said "don't fix the file" left the file alone, and so did the accessibility run.
- Every report I read said what it had not measured. In the audit report I saw no improvement percentages.
- The contrast numbers in the audit report were right when I recomputed them.
- The license reads as MIT in every place I looked (see Watch-outs).

## Watch-outs

- **It can edit your files.** In Test 3, the performance Skill modified `index.html` without a confirmation question visible on screen. Whether Claude Code asks first depends on your permission mode, which I did not record for that session. If you only want a report, say so in the prompt, and try it on a copy first. I saw this once.
- **Its reports are source-reading unless you add tools.** Without Chrome DevTools MCP, my audit and accessibility results were reading the file, not measuring a page. The reports said so. A clean report is not a Lighthouse score.
- **`analyze.sh` needs `jq`.** The script exits with an error if `jq` is missing, and its install hint is `brew install jq`, a Homebrew command. `jq` was not on my Windows PC. I do not know what a Windows user sees in practice, because the script never visibly ran in my tests.
- **The fallback paths use outside tools.** The accessibility docs show the Lighthouse CLI run through `npx`, and a global install (`-g`) of `@axe-core/cli`, which is not limited to your project folder. I did not see either run.
- **No release tags.** GitHub shows none, so record the plugin version (2.0.0) and the commit if you need to say what you tested. The repository may have changed since 2026-10-15.
- **Unofficial.** The README calls it unofficial, and I did not look for any affiliation beyond that. The audit Skill also carries a note that from Lighthouse 13 on, the Performance category uses shared Performance Insights, so what you see depends on the Lighthouse and DevTools versions involved.
- **Same-name copies exist.** See the caution above. Check the owner before you install.
- **Six Skills arrive together.** I saw three prompts load three different Skills. I did not test ambiguous prompts that might match more than one. Installing through the plugin route and through `npx skills add` at once might show Skills twice; that is a guess I did not test.
- **API keys: I found none mentioned, which is not the same as none needed.** I downloaded the README, the six `SKILL.md` files, `analyze.sh`, `CHANGELOG.md`, and the repository's own `CLAUDE.md` and `AGENTS.md`, and searched them with `grep -ciE "api[_ -]?key|token|secret|credential|telemetry"`. There were no matches for the first four terms. "Telemetry" appeared once, in the performance Skill, in a sentence about production monitoring, not about this tool collecting data. I did not search the `references/` documents. The outside tools these Skills point to, such as the Lighthouse CLI or PageSpeed Insights, are separate, and I did not check what they require.
- **License: consistent in what I read.** The README, the plugin manifest, each Skill's front matter, and GitHub's metadata all say MIT, and the `LICENSE` file opens with "MIT License" and a 2026 copyright line for Addy Osmani. I read only the opening of the license file, not the whole text.
- **I did not check which numbers other sites show.** Third-party directories list their own install counts. I did not verify any of them, so I do not quote them.

## FAQ

**How do I install web-quality-skills in Claude Code?**
The README documents `/plugin marketplace add addyosmani/web-quality-skills` followed by `/plugin install web-quality-skills@addy-web-quality-skills`. I ran both on Windows and both reported success. I did not test the `npx` or copy-the-folder routes.

**Does it run Lighthouse for you?**
Not in my tests. On a PC without Chrome DevTools MCP, the audit and accessibility reports said they had only read the source, and the performance run said it could not measure. The README says live audits are used when the agent has those tools. I did not test that path.

**Will it change my files?**
In my one performance run, yes: it edited the page without a visible confirmation question (my permission mode for that session is unrecorded, and it affects whether you are asked). In the two report-style runs, no. If you want a read-only report, say so in the prompt and work on a copy.

**Does it need an API key?**
I found no mention of one in the documents I searched, but I did not audit the outside tools it can call, so I cannot say none is needed.

**Is it an official Google or Anthropic tool?**
The README describes it as unofficial. I did not look for any affiliation beyond that.
