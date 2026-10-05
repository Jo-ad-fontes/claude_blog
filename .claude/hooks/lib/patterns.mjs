// 차단 패턴의 단일 기준(single source of truth).
// config/pipeline.yaml 이 아니라 여기에 둔다: config/ 는 Claude 가 편집할 수 있지만
// .claude/hooks/ 는 scope-guard 와 permissions.deny 가 보호한다.
// 이 파일은 사람이 수정한다.

// ── 보호 경로 (프로젝트 루트 기준, 소문자, 슬래시 구분) ─────────────────────
export const PROTECTED_DIRS = ['articles/published', '.claude/hooks', '.github'];
export const PROTECTED_FILE_RES = [
  /^\.claude\/settings[^/]*\.json$/, // settings.json, settings.local.json, ...
  /^\.mcp\.json$/,
];
// 삭제·이동 계열 명령이 이 디렉터리 자체를 대상으로 하면 하위 보호 경로가 사라지므로 막는다.
export const PROTECTED_ANCESTORS = ['articles', '.claude'];
// glob 토큰 판정에 쓰는 대표 경로
export const PROTECTED_SAMPLES = [
  'articles/published',
  'articles/published/x.md',
  '.claude/hooks',
  '.claude/hooks/x.mjs',
  '.claude/settings.json',
  '.claude/settings.local.json',
  '.mcp.json',
  '.github',
  '.github/workflows/x.yml',
];

// ── 시크릿 파일 이름 (basename 기준) ─────────────────────────────────────────
export const ENV_ALLOWED = new Set(['.env.example']);
export function isSecretName(name) {
  const n = name.toLowerCase();
  if (ENV_ALLOWED.has(n)) return null;
  if (n === '.env' || n.startsWith('.env.')) return '.env 파일';
  if (n.endsWith('.pem')) return '*.pem 파일';
  if (n.startsWith('credentials')) return 'credentials* 파일';
  return null;
}
export function isEnvName(name) {
  const n = name.toLowerCase();
  return !ENV_ALLOWED.has(n) && (n === '.env' || n.startsWith('.env.'));
}
// glob 패턴이 .env 계열 이름에 매칭될 수 있는지 판정할 때 쓰는 표본
export const ENV_SAMPLES = ['.env', '.env.local', '.env.production'];

// ── 명령어 분석 ─────────────────────────────────────────────────────────────
// 실행 파일 앞에 붙어 다음 토큰을 실행하는 래퍼
export const WRAPPERS = new Set([
  'sudo', 'command', 'env', 'nohup', 'time', 'exec', 'call', 'start', 'nice',
  'builtin', 'npx', 'bunx', 'pnpx', 'wsl',
]);
// `pnpm dlx x`, `npm exec x` 형태
export const PKG_RUNNERS = new Set(['pnpm', 'npm', 'yarn', 'bun']);
export const PKG_RUNNER_SUBS = new Set(['dlx', 'exec', 'x']);
export const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh', 'pwsh', 'powershell', 'cmd']);
export const CD_COMMANDS = new Set(['cd', 'chdir', 'pushd', 'set-location', 'sl']);

// ── git / gh / wrangler ─────────────────────────────────────────────────────
export const GIT_BLOCKED_SUBCOMMANDS = new Set(['push', 'add', 'commit', 'merge', 'rebase']);
export const GIT_VALUE_GLOBALS = new Set([
  '-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--super-prefix',
]);
export const WRANGLER_BLOCKED_WORDS = new Set(['deploy', 'publish']); // versions upload 는 별도 판정
export const GH_FIELD_FLAGS = new Set(['-f', '-F', '--field', '--raw-field', '--input']);

// ── 보호 경로를 대상으로 할 때 차단하는 쓰기 성격 명령 ─────────────────────────
export const WRITE_COMMANDS = new Set([
  // POSIX / cmd
  'mv', 'cp', 'rm', 'tee', 'install', 'ln', 'touch', 'mkdir', 'truncate', 'dd',
  'move', 'copy', 'xcopy', 'robocopy', 'del', 'erase', 'rmdir', 'rd', 'ren', 'rename',
  'curl', 'wget', 'unzip', 'tar', '7z',
  // PowerShell (+ 흔한 별칭)
  'new-item', 'ni', 'set-content', 'sc', 'add-content', 'ac', 'out-file', 'clear-content', 'clc',
  'remove-item', 'ri', 'move-item', 'mi', 'copy-item', 'ci', 'rename-item', 'rni', 'set-item', 'si',
  'tee-object', 'export-csv', 'export-clixml', 'expand-archive',
  'invoke-webrequest', 'iwr', 'invoke-restmethod', 'irm',
]);
// 복사 계열은 원본이 아니라 "목적지"만 쓰기 대상이다 (게시본 → 스냅샷 복사는 허용해야 한다).
export const COPY_COMMANDS = new Set(['cp', 'copy', 'xcopy', 'robocopy', 'install', 'copy-item', 'ci']);
export const COPY_DEST_FLAGS = new Set(['-t', '--target-directory', '-destination', '-dest']);
// 대상이 보호 디렉터리의 상위 디렉터리(articles, .claude)여도 막는 파괴적 명령
export const DESTRUCTIVE_COMMANDS = new Set([
  'mv', 'rm', 'move', 'del', 'erase', 'rmdir', 'rd', 'ren', 'rename',
  'remove-item', 'ri', 'move-item', 'mi', 'rename-item', 'rni',
]);
// git 서브커맨드 중 보호 경로를 인자로 받으면 쓰기로 보는 것
export const GIT_WRITE_SUBCOMMANDS = new Set(['mv', 'rm', 'restore', 'checkout']);
export const GIT_DESTRUCTIVE_SUBCOMMANDS = new Set(['mv', 'rm']);
