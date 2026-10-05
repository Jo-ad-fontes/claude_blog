# 2차 방어 (hook + permissions.deny)

CLAUDE.md "3중 방어" 중 2차. 구성은 아래와 같다.

| 파일 | 역할 |
|---|---|
| `.claude/hooks/lib/patterns.mjs` | 차단 패턴의 **단일 기준**. 사람이 수정한다. |
| `.claude/hooks/lib/common.mjs` | fail-closed 실행기, 경로 정규화, 명령어 분해 |
| `.claude/hooks/block-publish.mjs` | Bash/PowerShell: git·gh·wrangler 차단, 보호 경로 쓰기 차단 |
| `.claude/hooks/block-secret-read.mjs` | Bash/PowerShell/Read/Grep/Glob: `.env`, `*.pem`, `credentials*` 접근 차단 (이름 기준) |
| `.claude/hooks/scope-guard.mjs` | Write/Edit/NotebookEdit: 보호 경로·`.env` 쓰기 차단 |
| `.claude/settings.json` | hook 등록(`$CLAUDE_PROJECT_DIR` 기준) + `permissions.deny` |

테스트: `node tests/security/run.mjs` (실패가 하나라도 있으면 exit 1).

## 이것은 보안 경계가 아니다

hook 은 **실수 방지 장치**다. Claude 가 실수하거나 외부 텍스트에 속았을 때 흔한 경로를 막을 뿐,
의도적으로 우회하려는 시도를 막지 못한다. 진짜 경계는 아래 두 가지다.

1. **GitHub ruleset (`protect-main`)** — PR 필수, 관리자 우회 금지. 사람이 GitHub 에서 설정한다 (3차 방어).
2. **Claude 에게 인증 정보를 주지 않는 것** — push 권한·Cloudflare 자격증명이 없으면 hook 이 뚫려도 게시되지 않는다 (1차 방어).

## 동작 방식

- 차단 = stderr 에 사유 + **exit 2**. Claude Code 는 exit 2 만 차단으로 취급하고, 그 외 비정상 종료(1, 127 등)는 통과시킨다.
  그래서 모든 hook 은 전체를 try/catch 로 감싸 JSON 파싱 실패·필수 필드 누락·예기치 않은 예외를 전부 exit 2 로 끝낸다 (fail-closed).
  exit 0 은 판정을 끝까지 마치고 "허용"이 확정됐을 때만 나온다.
- Bash/PowerShell 명령은 따옴표 밖의 `; | & && || 개행 ( ) 백틱`으로 나누고, `VAR=x`, `sudo`, `npx`, `pnpm dlx` 같은
  접두어와 `git -C <경로>`, `git -c k=v` 같은 전역 옵션을 건너뛰어 실제 서브커맨드를 판정한다.
  `bash -c "..."`, `cmd /c ...`, `powershell -Command ...`, `-EncodedCommand`, `eval` 의 안쪽 문자열도 분해한다 (깊이 4).
- 역슬래시 해석은 두 가지(이스케이프 / 문자 그대로)로 모두 돌려 하나라도 걸리면 차단한다. Windows 경로 때문이다.
- `cd`/`pushd`/`Set-Location` 는 한 명령줄 안에서 추적해 상대경로를 해석한다.

## 알려진 우회 가능성 (숨기지 않는다)

아래는 **막지 못한다**. 테스트에도 통과 케이스로 넣지 않았다.

### 명령 조합
- **스크립트 파일을 만들어 실행**: `echo "git push" > x.sh && bash x.sh`. 파일 내용은 보지 않는다.
  (단 `echo ... > x.sh` 가 보호 경로가 아니면 이 쓰기 자체는 통과한다.)
- **변수·치환·인코딩으로 명령 조합**: `$g=git; & $g push`, `a=git; $a push`, `eval "$(echo Z2l0IHB1c2g= | base64 -d)"`,
  `` `echo git` push ``. 변수 값은 해석하지 않는다. (`-EncodedCommand` 와 단순 따옴표 분할 `g''it`, `eval "git push"` 는 처리한다.)
- **다른 인터프리터로 호출**: `node -e "require('child_process').execSync('git push')"`, `python -c ...`, `deno eval`.
  인터프리터 안의 코드는 보지 않는다. 같은 방식으로 `.env` 읽기·보호 경로 쓰기도 가능하다.
- **`npm run <script>` / `make` / 이미 있는 스크립트**: package.json 이나 Makefile 안에 `wrangler deploy` 가 있으면 그대로 실행된다.
- **`find -exec`, `xargs git push`** 같은 간접 실행: 앞쪽 명령만 판정한다. (`xargs` 는 래퍼로 취급하지 않는다.)
- **git alias·설정 파일**: `-c alias.*` 는 막지만, 이미 `.git/config` 나 `~/.gitconfig` 에 있는 alias 는 모른다.
  `git push` 와 같은 효과를 내는 다른 서브커맨드(`git send-pack`, `git update-ref` 후 외부 push 등)는 목록에 없다.
- **목록에 없는 명령**: `git pull`, `git cherry-pick`, `git am`, `git tag`, `git stash`, `gh release create`,
  `gh workflow run`, `gh repo ...`, `wrangler` 의 다른 서브커맨드는 요청 범위에 없어 막지 않는다.
- `sudo -u root git push` 처럼 래퍼 옵션이 값을 받는 경우는 옵션 값(`root`)을 실행 파일로 오인해 놓친다.
- `$(...)`, `{a,b}` 중 일부 PowerShell/bash 문법 변형, 환경변수 경로(`%USERPROFILE%`, `$HOME`, `~`)는 해석하지 않는다.
- 닫히지 않은 따옴표처럼 양쪽 해석 모두에서 깨지는 명령은 남은 부분이 한 토큰으로 취급되어 놓칠 수 있다.

### 경로
- 8.3 단축 경로(`ARTICL~1`), 심볼릭 링크·junction 으로 가린 경로는 판정하지 못한다.
- 프로젝트 **밖** 경로는 보호하지 않는다. `~/.claude/settings.json`(사용자 레벨 설정) 수정은 막지 못한다.
- `Grep` 에 `path` 를 주지 않고 프로젝트 전체를 검색하면 hook 은 `.env` 를 포함하는지 알 수 없다. (`Read(**/.env)` deny 가 막는지는 아래 "확인하지 못한 것" 참고)
- 쓰기 대상이 `*` 같은 와일드카드 하나로만 지정되고 `cp`/`mv` 의 목적지에 상위 디렉터리를 쓰는 경우 등, glob 판정은 대표 경로 표본(`patterns.mjs`)에 의존한다.

### 시크릿 이름 판정
- 이름 기준이라 `prod.env`, `secrets.json`, `id_rsa` 는 막지 않는다. (요청 범위: `.env`, `.env.*`, `*.pem`, `credentials*`.)
- 반대로 과차단이 있다. 명령 문자열에 `credentials` 로 시작하는 단어가 있으면(`grep credentials docs/`) 막는다.
- `block-secret-read` 는 Write/Edit 를 보지 않는다. `.env` 쓰기는 `scope-guard` 가 막지만 `.pem`/`credentials*` 쓰기는 막지 않는다.

### 알려진 한계 (의도적으로 막지 않음)
- **`.claude/agents/`, `.claude/skills/` 는 막지 않는다.** 이 디렉터리의 스킬·에이전트 정의는 Claude 의 행동을 바꿀 수 있으므로,
  Claude 가 자기 지침을 수정하는 경로가 열려 있다. 정상 작업(스킬 개선)을 위해 열어 두었으며, 변경은 PR 리뷰에서 사람이 확인해야 한다.
- `tests/security/`, `CLAUDE.md`, `config/` 도 막지 않는다. 테스트나 설정을 약화하는 변경은 PR 리뷰에서 확인한다.
- `articles/published/` **읽기**는 막지 않는다. CLAUDE.md 의 "게시본 스냅샷" 절차(`cp articles/published/x.md articles/snapshots/…`)가
  읽기를 필요로 하기 때문이다. 복사 계열 명령(`cp`, `Copy-Item` 등)은 목적지만 쓰기 대상으로 판정한다.

### 인프라
- hook 은 `node` 로 실행된다. Node 가 PATH 에 없거나 스크립트 파일을 못 찾으면 프로세스가 exit 2 가 아닌 코드(1, 127)로 끝나고
  **통과로 처리된다.** 이때는 `permissions.deny` 만 남는다.
- hook command 의 `$CLAUDE_PROJECT_DIR` 가 비어 있는 셸에서 실행되면 같은 이유로 통과된다.
  이 PC 에서는 임시 폴더에 복사한 같은 hook 으로 등록 방식을 시험해 쓰기 차단 2건을 확인했다 (아래 참고).
- `permission_mode: bypassPermissions` 에서는 `permissions.deny` 가 적용되는지 확인하지 못했다. hook 은 모드와 무관하게 실행된다고 문서에 있다.

## 확인한 것 / 확인하지 못한 것

| 항목 | 상태 |
|---|---|
| hook 스크립트 판정 (stdin JSON → exit code) | `node tests/security/run.mjs` 로 자동 검증 |
| `settings.json` 의 matcher·command 형태 | 같은 테스트가 파일 내용만 대조 (실제 Claude Code 가 읽어 실행하는지는 별도) |
| `$CLAUDE_PROJECT_DIR` 등록이 실제로 hook 을 실행하는지 | 임시 폴더(가짜 `.env`, `articles/published/`)에서 중첩 `claude -p` 로 시험. `articles/published/a.md` 와 `.claude/hooks/x.mjs` 쓰기가 차단되어 파일이 생기지 않은 것을 확인. Bash/Read/PowerShell 차단 메시지 원문은 확보하지 못했다 (모델 요약만 있음) |
| `permissions.deny` 규칙 문법 (`Bash(git push *)`, `Read(**/.env)`, `Edit(/articles/published/**)`) | **동작으로 확인하지 못했다.** 공식 문서 요약(서브에이전트 조회)에 근거해 넣었다. 새 세션에서 아래 절차로 확인할 것 |
| `Edit` deny 가 `Write`/`NotebookEdit` 에도 적용되는지, `Read` deny 가 Grep/Glob/Bash `cat` 에 적용되는지 | 확인하지 못했다. hook 이 같은 대상을 막으므로 이 규칙에만 의존하지 않는다 |

### 새 세션에서 수동으로 확인하는 절차
1. `/hooks` 와 `/permissions` 에서 위 항목이 보이는지 확인한다.
2. 아무 임시 폴더에서가 아니라 **이 저장소에서** 다음을 Claude 에게 시켜 본다 (모두 차단돼야 한다):
   `git status; git push --dry-run` / `.env.example 이 아닌 .env 읽기` / `articles/published/x.md 쓰기`.
   `.env` 는 실제 시크릿이므로, 차단이 안 되는 경우를 대비해 가짜 `.env` 가 있는 복사본에서 시험하는 것이 안전하다.
3. 차단되지 않는 항목이 있으면 이 README 의 "알려진 우회 가능성" 에 추가하고 hook 을 고친다.
