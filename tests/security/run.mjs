// 2차 방어(hook) 테스트. 실행: node tests/security/run.mjs
// 각 hook 을 자식 프로세스로 띄워 샘플 JSON 을 stdin 으로 넣고 exit code 를 검증한다.
// 차단 기대 = exit 2 (정확히 2), 통과 기대 = exit 0. 그 외 코드는 실패로 센다.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]+$/, '');
const HOOK_DIR = join(ROOT, '.claude', 'hooks');

// settings.json 의 matcher 와 같아야 한다 (아래 "등록" 테스트가 대조한다).
const REGISTRATION = {
  'block-publish.mjs': 'Bash|PowerShell',
  'block-secret-read.mjs': 'Bash|PowerShell|Read|Grep|Glob',
  'scope-guard.mjs': 'Write|Edit|NotebookEdit',
};
const applies = (hook, tool) => REGISTRATION[hook].split('|').includes(tool);

function runHook(hook, stdin) {
  const r = spawnSync(process.execPath, [join(HOOK_DIR, hook)], { input: stdin, encoding: 'utf8' });
  return { status: r.status, stderr: (r.stderr ?? '').trim() };
}

function runTool(tool, tool_input) {
  const stdin = JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: tool, tool_input, cwd: ROOT });
  const results = Object.keys(REGISTRATION).filter((h) => applies(h, tool)).map((h) => runHook(h, stdin));
  if (results.some((r) => r.status !== 0 && r.status !== 2)) return { verdict: 'error', results };
  return { verdict: results.some((r) => r.status === 2) ? 'block' : 'allow', results };
}

const bash = (command) => ['Bash', { command }];
const ps = (command) => ['PowerShell', { command }];
const rd = (file_path) => ['Read', { file_path }];
const wr = (file_path) => ['Write', { file_path, content: 'x' }];
const ed = (file_path) => ['Edit', { file_path, old_string: 'a', new_string: 'b' }];

const cases = [];
const B = (name, [tool, input]) => cases.push({ name, tool, input, expect: 'block' });
const A = (name, [tool, input]) => cases.push({ name, tool, input, expect: 'allow' });

// ── 반드시 차단 (요청 목록) ─────────────────────────────────────────────────
B('git push', bash('git push'));
B('git   push origin x (공백 여러 개)', bash('git   push origin x'));
B('git -C . push', bash('git -C . push'));
B('echo hi && git push', bash('echo hi && git push'));
B('git add -u', bash('git add -u'));
B('git commit -m x', bash('git commit -m x'));
B('gh pr merge 1', bash('gh pr merge 1'));
B('cat .env', bash('cat .env'));
B('type .env', bash('type .env'));
B('grep KEY .env', bash('grep KEY .env'));
B('Read(.env)', rd(`${ROOT}\\.env`));
B('Write(articles/published/a.md)', wr(`${ROOT}\\articles\\published\\a.md`));
B('Edit(.claude/settings.json)', ed(`${ROOT}\\.claude\\settings.json`));
B('Write(.claude/hooks/x.mjs)', wr(`${ROOT}\\.claude\\hooks\\x.mjs`));

// ── 반드시 통과 (요청 목록) ─────────────────────────────────────────────────
A('git status', bash('git status'));
A('git diff', bash('git diff'));
A('git log', bash('git log'));
A('cat .env.example', bash('cat .env.example'));
A('npm run build', bash('npm run build'));
A('Write(articles/drafts/a.md)', wr(`${ROOT}\\articles\\drafts\\a.md`));
A('Edit(site/src/layouts/Base.astro)', ed(`${ROOT}\\site\\src\\layouts\\Base.astro`));

// ── 추가: git / gh / wrangler ───────────────────────────────────────────────
B('git merge main', bash('git merge main'));
B('git rebase main', bash('git rebase main'));
B('git reset --hard HEAD~1', bash('git reset --hard HEAD~1'));
B('git --no-pager -c user.name=x push', bash('git --no-pager -c user.name=x push'));
B('git -c alias.p=push p', bash('git -c alias.p=push p'));
B('"C:\\Program Files\\Git\\cmd\\git.exe" push', bash('"C:\\Program Files\\Git\\cmd\\git.exe" push'));
B('FOO=1 git push', bash('FOO=1 git push'));
B('(git push)', bash('(git push)'));
B('echo $(git push)', bash('echo $(git push)'));
B('git status; git push', bash('git status; git push'));
B('git status | git push', bash('git status | git push'));
B('bash -c "git push"', bash('bash -c "git push"'));
B("bash -c \"g''it push\" (따옴표 분할)", bash('bash -c "g\'\'it push"'));
B('sudo git push', bash('sudo git push'));
B('PowerShell: git push', ps('git push'));
B('PowerShell: git -C . push', ps('git -C . push'));
B('PowerShell: Write-Output x; git push', ps('Write-Output x; git push'));
B('powershell -Command "git push"', ps('powershell -Command "git push"'));
B('powershell -EncodedCommand (git push)', ps(`powershell -EncodedCommand ${Buffer.from('git push', 'utf16le').toString('base64')}`));
B('cmd /c git push', bash('cmd /c git push'));
B('gh pr merge --squash 1', bash('gh pr merge --squash 1'));
B('gh -R a/b pr merge 1', bash('gh -R a/b pr merge 1'));
B('gh api -X PUT repos/o/r/pulls/1/merge', bash('gh api -X PUT repos/o/r/pulls/1/merge'));
B('gh api --method=POST repos/o/r/git/refs', bash('gh api --method=POST repos/o/r/git/refs'));
B('gh api repos/o/r/issues -f title=x (암묵적 POST)', bash('gh api repos/o/r/issues -f title=x'));
B('wrangler deploy', bash('wrangler deploy'));
B('npx wrangler deploy', bash('npx wrangler deploy'));
B('npx -y wrangler pages deploy dist', bash('npx -y wrangler pages deploy dist'));
B('wrangler versions upload', bash('wrangler versions upload'));
B('wrangler publish', bash('wrangler publish'));
A('git reset --soft HEAD~1', bash('git reset --soft HEAD~1'));
A('git branch -a', bash('git branch -a'));
A('git show main:articles/published/x.md', bash('git show main:articles/published/x.md'));
A('git log --oneline -n 5', bash('git log --oneline -n 5'));
A('git -C . status', bash('git -C . status'));
A('echo "git push is blocked"', bash('echo "git push is blocked"'));
A('gh api repos/o/r/pulls/1 (GET)', bash('gh api repos/o/r/pulls/1'));
A('gh api -X GET repos/o/r', bash('gh api -X GET repos/o/r'));
A('gh pr view 1', bash('gh pr view 1'));
A('wrangler --version', bash('wrangler --version'));
A('PowerShell: git status', ps('git status'));

// ── 추가: 보호 경로 쓰기 (Bash / PowerShell) ────────────────────────────────
B('echo x > articles/published/a.md', bash('echo x > articles/published/a.md'));
B('echo x >> .claude/settings.json', bash('echo x >> .claude/settings.json'));
B('echo x >.claude/hooks/x.mjs (붙은 리다이렉트)', bash('echo x >.claude/hooks/x.mjs'));
B('echo x 1> articles\\published\\a.md', bash('echo x 1> articles\\published\\a.md'));
B('mv articles/drafts/a.md articles/published/a.md', bash('mv articles/drafts/a.md articles/published/a.md'));
B('cp a.md articles/published/', bash('cp a.md articles/published/'));
B('git mv articles/drafts/a.md articles/published/a.md', bash('git mv articles/drafts/a.md articles/published/a.md'));
B('rm articles/published/a.md', bash('rm articles/published/a.md'));
B('rm -rf articles', bash('rm -rf articles'));
B('rm -rf .claude', bash('rm -rf .claude'));
B('cd articles && rm -rf published', bash('cd articles && rm -rf published'));
B('rm -rf articles/pub*', bash('rm -rf articles/pub*'));
B('cp a.md articles/published/* (glob 대상)', bash('cp a.md articles/pub*/'));
B('tee .claude/settings.local.json', bash('echo {} | tee .claude/settings.local.json'));
B('sed -i s/a/b/ .claude/settings.json', bash('sed -i s/a/b/ .claude/settings.json'));
B('sed -i.bak ... .github/workflows/x.yml', bash('sed -i.bak s/a/b/ .github/workflows/x.yml'));
B('touch .mcp.json', bash('touch .mcp.json'));
B('절대경로 쓰기: echo x > C:\\...\\articles\\published\\a.md', bash(`echo x > ${ROOT}\\articles\\published\\a.md`));
B('git restore articles/published/a.md', bash('git restore articles/published/a.md'));
B('PowerShell: Set-Content articles\\published\\a.md', ps('Set-Content articles\\published\\a.md -Value x'));
B('PowerShell: Set-Content -Path:articles/published/a.md', ps('Set-Content -Path:articles/published/a.md -Value x'));
B('PowerShell: "x" | Out-File .claude\\settings.json', ps('"x" | Out-File .claude\\settings.json'));
B('PowerShell: New-Item articles\\published\\a.md', ps('New-Item articles\\published\\a.md'));
B('PowerShell: Move-Item a.md articles\\published\\', ps('Move-Item a.md articles\\published\\'));
B('PowerShell: Copy-Item a.md .github\\x.yml', ps('Copy-Item a.md .github\\x.yml'));
B('PowerShell: Remove-Item -Recurse articles\\published', ps('Remove-Item -Recurse articles\\published'));
B('PowerShell: Add-Content .mcp.json x', ps('Add-Content .mcp.json x'));
B('PowerShell: x > .claude\\settings.local.json', ps('"x" > .claude\\settings.local.json'));
B('cp -t articles/published a.md', bash('cp -t articles/published a.md'));
B('PowerShell: Copy-Item a.md -Destination articles\\published\\a.md', ps('Copy-Item a.md -Destination articles\\published\\a.md'));
B('PowerShell: Copy-Item -Path a.md -Destination:.github\\x.yml', ps('Copy-Item -Path a.md -Destination:.github\\x.yml'));
A('PowerShell: Copy-Item articles\\published\\a.md -Destination articles\\snapshots\\a.md', ps('Copy-Item articles\\published\\a.md -Destination articles\\snapshots\\a.md'));
A('ls articles/published', bash('ls articles/published'));
A('cat articles/published/a.md (읽기)', bash('cat articles/published/a.md'));
A('git diff main -- articles/published', bash('git diff main -- articles/published'));
A('echo x > articles/drafts/a.md', bash('echo x > articles/drafts/a.md'));
A('mv articles/drafts/a.md articles/drafts/b.md', bash('mv articles/drafts/a.md articles/drafts/b.md'));
A('cp articles/published/a.md articles/snapshots/a.md (게시본 → 스냅샷)', bash('cp articles/published/a.md articles/snapshots/a.md'));
A('echo x > data/research/a.json', bash('echo x > data/research/a.json'));
A('node x.mjs 2>&1', bash('node x.mjs 2>&1'));
A('PowerShell: Set-Content articles\\drafts\\a.md', ps('Set-Content articles\\drafts\\a.md -Value x'));
A('PowerShell: Get-Content articles\\published\\a.md', ps('Get-Content articles\\published\\a.md'));

// ── 추가: 시크릿 읽기 ───────────────────────────────────────────────────────
B('Get-Content .env', ps('Get-Content .env'));
B('Get-Content -Path "C:\\x\\.env"', ps('Get-Content -Path "C:\\x\\.env"'));
B('head -n 5 .env', bash('head -n 5 .env'));
B('tail ./.env', bash('tail ./.env'));
B('cat ../.env', bash('cat ../.env'));
B('cat "./.env"', bash('cat "./.env"'));
B('cat .env.local', bash('cat .env.local'));
B('cat .env.production', bash('cat .env.production'));
B('cat .e* (glob)', bash('cat .e*'));
B('cat .en? (glob)', bash('cat .en?'));
B('cp .env /tmp/x', bash('cp .env /tmp/x'));
B('echo x && cat .env', bash('echo x && cat .env'));
B('bash -c "cat .env"', bash('bash -c "cat .env"'));
B('cat key.pem', bash('cat key.pem'));
B('cat certs/server.pem', bash('cat certs/server.pem'));
B('cat credentials.json', bash('cat credentials.json'));
B('type C:\\Users\\x\\.aws\\credentials', bash('type C:\\Users\\x\\.aws\\credentials'));
B('Read(.env.local)', rd(`${ROOT}\\.env.local`));
B('Read(server.pem)', rd('C:\\keys\\server.pem'));
B('Read(credentials.json)', rd('C:\\keys\\credentials.json'));
B('Grep path=.env', ['Grep', { pattern: 'KEY', path: `${ROOT}\\.env` }]);
B('Grep glob=.env*', ['Grep', { pattern: 'KEY', glob: '.env*' }]);
B('Glob pattern=**/.env', ['Glob', { pattern: '**/.env' }]);
B('Glob pattern=**/*.pem', ['Glob', { pattern: '**/*.pem' }]);
A('type .env.example', bash('type .env.example'));
A('Read(.env.example)', rd(`${ROOT}\\.env.example`));
A('Read(site/src/pages/index.astro)', rd(`${ROOT}\\site\\src\\pages\\index.astro`));
A('Grep path=site/src', ['Grep', { pattern: 'KEY', path: `${ROOT}\\site\\src` }]);
A('Grep (path 없음)', ['Grep', { pattern: 'KEY' }]);
A('Glob pattern=**/*.md', ['Glob', { pattern: '**/*.md' }]);
A('Glob pattern=**/*', ['Glob', { pattern: '**/*' }]);
A('cat .envrc.txt 가 아닌 .environment 같은 이름', bash('cat .environment'));
A('ls', bash('ls'));
A('node tests/security/run.mjs', bash('node tests/security/run.mjs'));

// ── 추가: Write / Edit / NotebookEdit ───────────────────────────────────────
B('Write(.claude/settings.local.json)', wr(`${ROOT}\\.claude\\settings.local.json`));
B('Write(.mcp.json)', wr(`${ROOT}\\.mcp.json`));
B('Write(.github/workflows/x.yml)', wr(`${ROOT}\\.github\\workflows\\x.yml`));
B('Write(.env)', wr(`${ROOT}\\.env`));
B('Write(.env.local)', wr(`${ROOT}\\.env.local`));
B('Edit(.claude/hooks/lib/patterns.mjs)', ed(`${ROOT}\\.claude\\hooks\\lib\\patterns.mjs`));
B('Write 상대경로 articles/published/a.md', wr('articles/published/a.md'));
B('Write 슬래시 혼용 + 대소문자 Articles/Published', wr(`${ROOT.replace(/\\/g, '/')}/Articles/Published/a.md`));
B('Write ../ 우회 articles/drafts/../published/a.md', wr('articles/drafts/../published/a.md'));
B('Write /c/... Git Bash 형태', wr(`/${ROOT[0].toLowerCase()}${ROOT.slice(2).replace(/\\/g, '/')}/articles/published/a.md`));
B('NotebookEdit(articles/published/n.ipynb)', ['NotebookEdit', { notebook_path: `${ROOT}\\articles\\published\\n.ipynb`, new_source: 'x' }]);
B('NotebookEdit(.claude/settings.json)', ['NotebookEdit', { notebook_path: `${ROOT}\\.claude\\settings.json`, new_source: 'x' }]);
A('Write(articles/snapshots/a.md)', wr(`${ROOT}\\articles\\snapshots\\a.md`));
A('Write(data/research/a.json)', wr(`${ROOT}\\data\\research\\a.json`));
A('Write(.env.example)', wr(`${ROOT}\\.env.example`));
A('Edit(CLAUDE.md)', ed(`${ROOT}\\CLAUDE.md`));
A('Edit(.claude/skills/x/SKILL.md) — 알려진 한계: 막지 않음', ed(`${ROOT}\\.claude\\skills\\x\\SKILL.md`));
A('Edit(.claude/agents/x.md) — 알려진 한계: 막지 않음', ed(`${ROOT}\\.claude\\agents\\x.md`));
A('Write(tests/security/x.mjs)', wr(`${ROOT}\\tests\\security\\x.mjs`));
A('NotebookEdit(data/n.ipynb)', ['NotebookEdit', { notebook_path: `${ROOT}\\data\\n.ipynb`, new_source: 'x' }]);

// ── 실행 ────────────────────────────────────────────────────────────────────
const rows = [];
for (const c of cases) {
  const { verdict, results } = runTool(c.tool, c.input);
  const ok = verdict === c.expect;
  const detail = results.find((r) => r.status !== 0)?.stderr ?? results.map((r) => r.stderr).find(Boolean) ?? '';
  rows.push({ group: '동작', name: `${c.tool}: ${c.name}`, expect: c.expect, got: verdict, ok, detail });
}

// fail-closed: 깨진 입력은 모든 hook 에서 정확히 exit 2
const broken = [
  ['JSON 깨짐', '{"tool_name": "Bash", "tool_input": {'],
  ['빈 stdin', ''],
  ['JSON 이 아닌 텍스트', 'git push'],
  ['null', 'null'],
  ['tool_input 없음', JSON.stringify({ tool_name: 'Bash' })],
  ['tool_name 없음', JSON.stringify({ tool_input: { command: 'ls' } })],
  ['Bash 인데 command 가 숫자', JSON.stringify({ tool_name: 'Bash', tool_input: { command: 5 } })],
  ['Read 인데 file_path 없음', JSON.stringify({ tool_name: 'Read', tool_input: {} })],
  ['Write 인데 file_path 없음', JSON.stringify({ tool_name: 'Write', tool_input: { content: 'x' } })],
  ['NotebookEdit 인데 notebook_path 없음', JSON.stringify({ tool_name: 'NotebookEdit', tool_input: {} })],
];
for (const [label, stdin] of broken) {
  for (const hook of Object.keys(REGISTRATION)) {
    // 입력에 해당 hook 이 처리하지 않는 tool_name 이 들어 있으면 "해당 없음"이라 allow 가 정상이다.
    let toolName = null;
    try { toolName = JSON.parse(stdin)?.tool_name ?? null; } catch { /* 깨진 입력 */ }
    const relevant = toolName === null || applies(hook, toolName);
    if (!relevant) continue;
    const r = runHook(hook, stdin);
    rows.push({
      group: 'fail-closed', name: `${hook}: ${label}`, expect: 'exit 2', got: `exit ${r.status}`,
      ok: r.status === 2, detail: r.stderr,
    });
  }
}

// 등록: settings.json 이 hook 을 $CLAUDE_PROJECT_DIR 경로로 같은 matcher 에 등록했는지
const settingsPath = join(ROOT, '.claude', 'settings.json');
let settings = null;
try {
  settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : null;
} catch { /* 아래에서 실패로 기록 */ }
const entries = settings?.hooks?.PreToolUse ?? [];
for (const [hook, matcher] of Object.entries(REGISTRATION)) {
  const e = entries.find((x) => x.hooks?.some((h) => h.command?.includes(`/.claude/hooks/${hook}`)));
  const cmd = e?.hooks?.find((h) => h.command?.includes(hook))?.command ?? '';
  rows.push({
    group: '등록', name: `${hook}: matcher=${matcher}`, expect: 'registered', got: e ? `matcher=${e.matcher}` : '없음',
    ok: Boolean(e) && e.matcher === matcher, detail: '',
  });
  rows.push({
    group: '등록', name: `${hook}: command 가 $CLAUDE_PROJECT_DIR 기준`, expect: '$CLAUDE_PROJECT_DIR', got: cmd || '없음',
    ok: /\$\{?CLAUDE_PROJECT_DIR\}?/.test(cmd), detail: '',
  });
}
const deny = settings?.permissions?.deny ?? [];
rows.push({
  group: '등록', name: 'permissions.deny 규칙 존재', expect: '≥ 1개', got: `${deny.length}개`, ok: deny.length > 0, detail: '',
});

// ── 보고 ────────────────────────────────────────────────────────────────────
const pad = (s, n) => (s.length >= n ? s : s + ' '.repeat(n - s.length));
const w = Math.min(78, Math.max(...rows.map((r) => r.name.length)));
console.log(`${pad('결과', 4)} | ${pad('구분', 10)} | ${pad('케이스', w)} | 기대 → 실제`);
console.log(`${'-'.repeat(4)}-+-${'-'.repeat(10)}-+-${'-'.repeat(w)}-+-${'-'.repeat(24)}`);
for (const r of rows) {
  const tail = r.ok ? `${r.expect}` : `${r.expect} → ${r.got}${r.detail ? `  (${r.detail.split('\n')[0]})` : ''}`;
  console.log(`${pad(r.ok ? 'PASS' : 'FAIL', 4)} | ${pad(r.group, 10)} | ${pad(r.name, w)} | ${tail}`);
}
const failed = rows.filter((r) => !r.ok);
const byGroup = {};
for (const r of rows) {
  byGroup[r.group] ??= { pass: 0, fail: 0 };
  byGroup[r.group][r.ok ? 'pass' : 'fail']++;
}
console.log('');
for (const [g, v] of Object.entries(byGroup)) console.log(`${pad(g, 11)} 통과 ${v.pass} / 실패 ${v.fail}`);
console.log(`합계        통과 ${rows.length - failed.length} / 실패 ${failed.length} (총 ${rows.length}건)`);
process.exit(failed.length ? 1 : 0);
