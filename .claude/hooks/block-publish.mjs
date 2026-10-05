// PreToolUse: Bash / PowerShell. 게시·배포·git 쓰기 계열과 보호 경로 쓰기를 차단한다.
// 차단 = stderr 사유 + exit 2. 예외는 전부 exit 2 (lib/common.mjs 의 fail-closed).
import {
  runHook, str, invocations, gitParse, findProtectedWrite,
} from './lib/common.mjs';
import * as P from './lib/patterns.mjs';

function checkGit(args) {
  const g = gitParse(args);
  for (let i = 0; i < g.globals.length; i++) {
    if (g.globals[i] === '-c' && /^alias\./i.test(g.globals[i + 1] ?? '')) {
      return 'git -c alias.* 로 서브커맨드를 가리는 호출은 금지';
    }
  }
  if (P.GIT_BLOCKED_SUBCOMMANDS.has(g.sub)) return `git ${g.sub} 금지 (커밋·게시는 사람이 한다)`;
  if (g.sub === 'reset' && g.rest.some((a) => a === '--hard')) return 'git reset --hard 금지';
  return null;
}

function checkGh(args) {
  const pos = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-R' || args[i] === '--repo') i++;
    else if (!args[i].startsWith('-')) pos.push(args[i].toLowerCase());
  }
  if (pos[0] === 'pr' && pos[1] === 'merge') return 'gh pr merge 금지 (merge 는 사람이 한다)';
  if (pos[0] !== 'api') return null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const al = a.toLowerCase();
    let method = null;
    if (al === '-x' || al === '--method') method = args[i + 1] ?? '';
    else if (a.startsWith('-X') && a.length > 2) method = a.slice(2);
    else if (al.startsWith('--method=')) method = a.slice('--method='.length);
    if (method !== null && method.toUpperCase() !== 'GET') return `gh api 쓰기 호출 금지 (method ${method})`;
    if (
      P.GH_FIELD_FLAGS.has(a) || /^--(field|raw-field|input)=/.test(a) || /^-[fF][^-]/.test(a)
    ) {
      return 'gh api 에 필드/입력 지정 금지 (암묵적 POST)';
    }
  }
  return null;
}

function checkWrangler(args) {
  const w = args.map((a) => a.toLowerCase());
  const hit = w.find((a) => P.WRANGLER_BLOCKED_WORDS.has(a));
  if (hit) return `wrangler ${hit} 금지 (배포는 사람이 한다)`;
  const i = w.indexOf('versions');
  if (i >= 0 && w[i + 1] === 'upload') return 'wrangler versions upload 금지';
  return null;
}

runHook((input, ctx) => {
  if (input.tool_name !== 'Bash' && input.tool_name !== 'PowerShell') return null;
  const cmd = str(input.tool_input.command, 'command');
  const invs = invocations(cmd);
  for (const { exe, args } of invs) {
    let r = null;
    if (exe === 'git') r = checkGit(args);
    else if (exe === 'gh') r = checkGh(args);
    else if (exe === 'wrangler') r = checkWrangler(args);
    if (r) return r;
  }
  return findProtectedWrite(invs, ctx);
});
