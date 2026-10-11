---
slug: "mcp-memory-server-review"
status: PUBLISHED
title: "The MCP Memory Server in Claude Code: A Hands-On Test of Where It Actually Saves Your Data"
seo_title: "MCP Memory Server (server-memory) in Claude Code: Hands-On Test on Windows"
meta_description: "A one-machine hands-on test of the MCP Memory server with Claude Code on Windows: where it saves data, what it stores, and what changing the path does."
primary_keyword: "mcp memory server claude code"
secondary_keywords:
  - "@modelcontextprotocol/server-memory"
  - "claude mcp add memory"
  - "MEMORY_FILE_PATH memory.jsonl"
  - "claude code persistent memory mcp"
lang: "en"
category: "connectors"
content_type: "Daily Review"
tags: []                  # taxonomy.yaml tags are intentionally empty for now; left for a human to decide
candidate_id: "modelcontextprotocol-servers-memory"
tested_at: "2026-10-07"
claude_code_version: "2.1.292"
extension_version: "@modelcontextprotocol/server-memory 2026.8.31"   # npm view result and the installed package.json agree
os: "Windows (Git Bash), Node v24.21.0"
fact_check:
  verdict: "WARNING"
  checked_at: "2026-10-09"
  issues:
    - "WARNING (accepted by human): source_kind labels in the research JSON are ambiguous for the memory index.ts source, package.json, GitHub API metadata, commits API, and npm registry (labeled github_readme or release_notes)"
    - "WARNING (accepted by human): Scope note ('a process Claude Code starts', remote connector directory not examined) rests on the author's statement"
    - "WARNING (resolved 2026-10-09): the inference 'one line that is not valid JSON would make the whole load fail' is now listed in inferred_not_confirmed of the research JSON"
    - "WARNING (resolved 2026-10-09): the installed dist/index.js observations are now recorded in memory-sandbox-record-2026-10-07.md"
    - "Note: the source-behavior sentences match hands_on_test observations 16-18 (installed 2026.8.31 build checked directly by the user; main differs and is labeled as such)"
    - "Note: README absence claims (no claude mcp add, no telemetry/permission/network mention) were confirmed with curl + grep -i on the raw memory README: 0 matches for each term"
    - "Note: GitHub stars/forks are threshold claims and passed; push date on 2026-10-07 is disclosed in the draft"
  accepted_warnings:
    - claim: "source_kind classification of non-README sources (index.ts, package.json, GitHub API, commits API, npm registry) in the research JSON"
      decided_by: "사용자"
      decided_at: "2026-10-09"
      rationale: "이번 글의 오류가 아니라 조사 파일의 분류 문제이고 발행 후 규칙을 논의한다."
    - claim: "Scope note: local process and claude.ai remote connector directory not examined"
      decided_by: "사용자"
      decided_at: "2026-10-09"
      rationale: "조사 범위를 밝히는 작성자 진술이다."
sources:
  - "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/README.md"
  - "https://api.github.com/repos/modelcontextprotocol/servers"
  - "https://api.github.com/repos/modelcontextprotocol/servers/commits?path=src/memory&per_page=5"
  - "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/LICENSE"
  - "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/memory/README.md"
  - "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/memory/package.json"
  - "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/src/memory/index.ts"
  - "data/research/memory-sandbox-record-2026-10-07.md"   # first-hand test record (hands_on), not a public URL
cost_usd: 0
---

**Short version:** I registered the MCP Memory server with Claude Code on one Windows PC, saved two made-up facts, and got them back in a new session. By default the data went into a plain-text file buried inside the npx cache, not anywhere I would have picked. Setting `MEMORY_FILE_PATH` moved it, but the new server started empty and did not carry the old memory over. Everything below is one machine, one run of each test, unless I say otherwise.

**Scope note:** This server runs locally on your own PC, as a process Claude Code starts. I did not look at the remote connector directory on claude.ai, so this review says nothing about those connectors.

## What is it?

`@modelcontextprotocol/server-memory` is a small MCP server that gives Claude a persistent memory in the form of a local knowledge graph. The graph is built from entities, relations between them, and observations attached to entities. It exposes nine tools: `create_entities`, `create_relations`, `add_observations`, `delete_entities`, `delete_observations`, `delete_relations`, `read_graph`, `search_nodes`, and `open_nodes`. It also offers a `memory://knowledge-graph` resource.

In one line: a local, file-backed notebook that Claude can read and write through MCP tools.

## Why it matters

It is one of the reference servers listed in the root README of the `modelcontextprotocol/servers` repository, which the README says is maintained by the MCP steering group. That same README describes the servers as reference implementations and educational examples, not production-ready solutions, and tells developers to assess the security requirements for their own threat model. Keep that in mind before storing anything you care about.

The repository has more than 91,000 GitHub stars and more than 11,000 forks. Those are the numbers for the whole monorepo, not for the memory server alone, and I did not find a figure for the memory server by itself.

On maintenance, as of 2026-10-07: the repository was not archived, its last push was 2026-10-05, the most recent commits touching the memory server's folder were from 2026-09-03 (fixes such as a concurrent-write race and validating entries loaded from disk), and npm's latest version, 2026.8.31, was published on 2026-08-31 with no deprecation notice. That is a snapshot of those dates, not a promise about the future. I looked at only the five most recent commits. A later check on 2026-10-09 showed a push on 2026-10-07.

## A caution worth flagging: which version number to trust

The `package.json` on the repository's main branch showed version 0.6.3, while npm's latest was 2026.8.31. The two labels disagree, so in this review I use the version I actually installed: 2026.8.31. The dependency list tells the same story. My research notes, based on the repository's main branch, also listed `zod` as a dependency, but the installed package's `package.json` listed only `@modelcontextprotocol/sdk` (^1.30.0). Where the two differ, I follow the installed copy.

## Key features

Based on the memory server's README and the installed package:

- A knowledge graph of entities, relations, and observations, with the nine tools listed above.
- Storage in a JSON Lines file. The README only says the default location is "the server directory," and that the `MEMORY_FILE_PATH` environment variable changes it. The source resolves the default relative to where the server's index file lives. My test showed what that means in practice (see below).
- Per the source, saving writes to a temporary file and then renames it over the memory file; I also saw this in the installed 2026.8.31 build. In the installed 2026.8.31 build (dist/index.js), loading reads the file as UTF-8, splits it into lines and parses each line with JSON.parse. Lines whose type is entity or relation are kept, and a line with any other type is ignored silently. I saw no per-line error handling there, so I would expect one line that is not valid JSON to make the whole load fail instead of being skipped. I read this in the code and did not test it. The repository's current main branch has extra validation and "Skipping malformed line" warnings that I did not find in the installed file, so I do not assume main's behavior for this release.
- Per the README, the model decides when to create memories, and that depends on your prompt. The README's sample prompt for chat personalization lists things like basic identity and relationships as things to remember.

## Installation

The README's setup examples are written for Claude Desktop (`claude_desktop_config.json`) and VS Code. It does not contain a `claude mcp add` command for Claude Code. The command below is therefore what I ran in my test, not something from the docs.

Registration that worked for me (local scope):

```
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
```

The configuration landed in the `memory_mcp_sandbox` project entry of `~/.claude.json`. The `/mcp` screen showed the server as connected, with Capabilities of tools and resources and nine tools. The README tells Windows users to wrap `npx` in `cmd /c`; I did not, and it connected anyway. That is one PC. I cannot say whether it holds elsewhere.

The README also documents a Docker example (`docker run -i -v claude-memory:/app/dist --rm mcp/memory`). I did not run it.

## Hands-on test

**Environment:** Claude Code 2.1.292, Windows with Git Bash, Node v24.21.0, server 2026.8.31 (both `npm view` and the installed `package.json` said so). I ran the tests in a separate sandbox folder, `memory_mcp_sandbox`, not in a real project. Each test below was done once.

**About the data:** the nickname "Buldak," the cup noodle, "Seoul," and "soccer" used in these tests are made-up test data, not real personal information.

### What the tools looked like

The `/mcp` screen marked the three `delete_*` tools as destructive and `read_graph`, `search_nodes`, and `open_nodes` as read-only.

### Saving something

I typed, in Korean, that my nickname was Buldak and my favorite cup noodle was Buldak stir-fried noodles, and asked it to remember that in the memory server. Claude called the `memory` tool twice and said it had saved an entity named `User` of type `person`.

### Where it went

With no `MEMORY_FILE_PATH` set, the data was in the npx cache folder:

```
C:/Users/Joh/AppData/Local/npm-cache/_npx/15b07286cbcc3329/node_modules/@modelcontextprotocol/server-memory/dist/memory.jsonl
```

It was 134 bytes, last modified 2026-10-07 19:27, and held one line:

```json
{"type":"entity","name":"User","entityType":"person","observations":["별명은 Buldak","좋아하는 컵라면은 Buldak 볶음면"]}
```

Three things stand out:

- The stored sentences are Claude's rewording, not my exact words.
- The Korean text was stored without garbling (no cp949-style problem).
- It is plain text. Anyone, or any program, that can read that folder can read it. I saw no encryption or access restriction.

### Does it survive a restart?

I quit and restarted `claude`, then asked "what was my nickname?" with no hint. Claude called the memory tool on its own and answered with Buldak and the noodle name. I then asked it to look the information up in the memory server; it answered the same, but the screen showed no tool-call line, so it may have reused the earlier result from the same session. Both were one-time observations.

### Changing the storage path

I removed the server and registered it again with the path set:

```
claude mcp remove memory
claude mcp add memory -e MEMORY_FILE_PATH=C:/Users/Joh/Desktop/project/memory_mcp_sandbox/my-memory.jsonl -- npx -y @modelcontextprotocol/server-memory
```

A forward-slash Windows path worked, and `my-memory.jsonl` was created at that location. I did not try backslash paths.

Then I asked "what was my nickname?" again. Claude replied (in Korean) that it could not find the nickname in stored memory: there was no file-based memory (`MEMORY.md`) yet, and the MCP memory graph was empty. The Buldak record did not show up.

Next I said I lived in Seoul and my hobby was soccer, and asked it to remember that. Claude called the memory tool once and put "lives in Seoul" and "hobby is soccer" into an entity named `user`. This time the name was lowercase: Claude used `User` in one save and `user` in the other. I saw only these two saves. The new file was 120 bytes, modified 2026-10-07 20:38, with one line:

```json
{"type":"entity","name":"user","entityType":"person","observations":["서울에 거주한다","취미는 축구이다"]}
```

The old cache file was unchanged, still 134 bytes from 19:27. I checked it again on 2026-10-09 and it was the same. So after the path change, the old records stayed in the old file and the new server started fresh in the new one. The two entities, `User` and `user`, were in different files, so I never saw what happens when the names differ inside one file.

### Not verified

- What happens when entity names differ inside one file (duplicates or not)
- Whether the default file disappears when the npx cache is cleaned or the version changes
- Whether Claude looks memory up on its own for questions other than the one I asked (one observation only)
- What the `delete_*` tools actually do
- Whether the server makes any network calls
- How `create_relations` entries are stored (I only saved an entity with observations)
- Whether Claude Code showed an approval prompt for the tool calls
- Behavior on other PCs, other OSes, or other versions

## Automation ideas

The one thing I saw working end to end is narrow: telling Claude a small fact once and having it come back in a later session, with the file location under your control via `MEMORY_FILE_PATH`. I saw that recall once, so I won't build bigger claims on it. Anything beyond that, such as relations between entities or deleting stored data, is not something this test supports.

## Pros

- Registered with a single `claude mcp add` command and showed as connected, even without the `cmd /c` wrapper the README recommends for Windows (one PC).
- Korean text was stored and read back without garbling.
- The storage is a human-readable file, so you can see exactly what was remembered.
- The location can be set with `MEMORY_FILE_PATH`, and a forward-slash Windows path worked.
- In my one test, in a new session, Claude found the saved facts on its own.

## Watch-outs

- **Plain text, readable by anyone with file access.** The memory file is plain JSON Lines. I observed no encryption and no access restriction. Do not put secrets or private data in it. The README's sample prompt lists identity details such as location as things to remember. In my test, what actually got saved was a nickname, a favorite cup noodle, a city of residence, and a hobby (all made-up test data). I did not save relationships (`create_relations`) or other identity details.
- **The default location is inside the npx cache.** Without `MEMORY_FILE_PATH`, my data went into a package folder under `npm-cache/_npx/...`, which is not a place you would think to look or back up. Whether a cache cleanup or a version change would delete that file, I did not test. Set the path explicitly and check with your own eyes that the file appears where you expect.
- **Keep the file out of your repository (a precaution I did not test).** If you work in a Git project, point the path outside the repository so personal memory is not tracked by accident. In this test, the default location was inside the npx cache, which is outside any repository.
- **Changing the path does not move the memory.** The new server started with an empty graph. In my test, Claude said the memory graph was empty. The old file stayed where it was. I did not test whether copying the old file to the new path makes the new server read it.
- **Entity names were not consistent in my test.** Claude used `User` in one save and `user` in the other. I saw only these two saves, and I did not test what that does inside a single file.
- **The README is written for Claude Desktop and VS Code.** It has no `claude mcp add` command, and no information about Claude Code's scopes, tool-name prefixes, or approval prompts. I only covered the part I ran.
- **Reference implementation, not a production tool.** The repository itself says so.
- **License: I won't give you one answer.** The root README says new contributions are Apache-2.0 and existing code is MIT. The root LICENSE file describes a transition from MIT to Apache-2.0 and contains both texts. The memory folder has no LICENSE file of its own, its `package.json` says "SEE LICENSE IN LICENSE," and GitHub's API reports no license classification (NOASSERTION). From the text alone I could not determine whether the memory server's code is Apache-2.0 or MIT. Read the LICENSE yourself if it matters to you.
- **Star counts belong to the monorepo.** There is no per-server number I could verify.
- **The README says little about permissions, network, and telemetry.** In the parts of the memory README I read, I found no mention of telemetry, analytics, permissions, networking, or privacy. The README does describe local storage (a JSONL file, and a Docker volume in its Docker example). "Not mentioned" is not the same as "none." I did not audit the source for network calls, so I can't say either way.
- **Similar-looking servers.** I did not search for same-named forks or copies, so I can't say whether any exist.
- **I did not compare it to Claude Code's own memory** (such as CLAUDE.md). I have no evidence for that comparison yet.

## FAQ

**Where does the MCP Memory server store its data by default?**
In my Windows test, with no environment variable set, it wrote a file named `memory.jsonl` inside the npx cache folder for the package, at `.../node_modules/@modelcontextprotocol/server-memory/dist/`. That is one machine; I did not test how it behaves when the cache is cleaned.

**How do I change where it saves?**
Register it with `-e MEMORY_FILE_PATH=<path to a .jsonl file>`. On my PC, a path written with forward slashes (`C:/...`) worked and the file was created. The new server did not read the old file's contents.

**Is the saved memory private?**
It is a plain-text file with no encryption or access restriction that I could observe. Treat it as readable by anyone who can open the folder.

**Does it work in Claude Code on Windows without `cmd /c`?**
On my PC, `npx` registered directly showed as connected in `/mcp`, even though the README recommends the `cmd /c` wrapper for Windows. One machine, so I can't promise the same elsewhere.

**Did Claude remember across sessions in my test?**
In my one test, after restarting `claude` and asking without any hint, Claude called the memory tool and answered correctly. I did not repeat it enough to say how reliable that is.
