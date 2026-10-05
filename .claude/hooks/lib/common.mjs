// hook 공통 코드: fail-closed 실행기, 경로 정규화, 명령어 분해.
// 규칙: 판정을 끝까지 마치고 "허용"이 확정됐을 때만 exit 0. 그 외 모든 예외는 exit 2.
import { readFileSync, writeSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as P from './patterns.mjs';

// ── 실행기 (fail-closed) ────────────────────────────────────────────────────
function block(reason) {
  try {
    writeSync(2, `[BLOCKED] ${reason}\n`);
  } catch {
    // stderr 쓰기 실패여도 exit 2 는 유지
  }
  process.exit(2);
}

export function runHook(handler) {
  process.on('uncaughtException', (e) => block(`fail-closed: ${e?.message ?? e}`));
  process.on('unhandledRejection', (e) => block(`fail-closed: ${e?.message ?? e}`));
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    if (
      !input || typeof input !== 'object' ||
      typeof input.tool_name !== 'string' ||
      !input.tool_input || typeof input.tool_input !== 'object'
    ) {
      throw new Error('malformed hook input');
    }
    const verdict = handler(input, makeCtx(input));
    if (verdict === null) process.exit(0);
    if (typeof verdict === 'string' && verdict) block(verdict);
    throw new Error('handler returned an invalid verdict');
  } catch (e) {
    block(`fail-closed: ${e?.message ?? e}`);
  }
}

export function str(v, name) {
  if (typeof v !== 'string') throw new Error(`tool_input.${name} is missing or not a string`);
  return v;
}

// ── 경로 정규화 ─────────────────────────────────────────────────────────────
// 소문자 + 슬래시 구분 절대경로. 드라이브 경로가 아니면 null.
function absNorm(p) {
  let s = p.replace(/\\/g, '/');
  const m = /^\/([a-zA-Z])(\/|$)/.exec(s); // Git Bash 형태 /c/Users
  if (m) s = `${m[1]}:${s.slice(2)}`;
  if (!/^[a-zA-Z]:(\/|$)/.test(s)) return null;
  return posix.normalize(s).replace(/\/+$/, '').toLowerCase();
}

export const ROOT = absNorm(fileURLToPath(new URL('../../../', import.meta.url)));

function underRoot(abs) {
  if (abs === ROOT) return '';
  return abs.startsWith(`${ROOT}/`) ? abs.slice(ROOT.length + 1) : null;
}

function makeCtx(input) {
  let cwdRel = '';
  if (typeof input.cwd === 'string') {
    const abs = absNorm(input.cwd);
    const rel = abs === null ? null : underRoot(abs);
    if (rel !== null) cwdRel = rel;
  }
  return { bases: [...new Set(['', cwdRel])] };
}

// p 를 프로젝트 루트 기준 상대경로 후보 목록으로 바꾼다. 프로젝트 밖이면 빈 배열.
export function toRels(p, bases) {
  if (!p || /^[~$%]/.test(p)) return [];
  const abs = absNorm(p);
  if (abs !== null) {
    const rel = underRoot(abs);
    return rel === null ? [] : [rel];
  }
  const s = p.replace(/\\/g, '/');
  if (s.startsWith('/')) return [];
  const out = [];
  for (const b of bases) {
    const rel = posix.normalize(posix.join(b, s)).replace(/\/+$/, '').toLowerCase();
    if (rel === '..' || rel.startsWith('../')) continue;
    out.push(rel === '.' ? '' : rel);
  }
  return [...new Set(out)];
}

export function baseName(p) {
  const parts = p.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

// ── glob ────────────────────────────────────────────────────────────────────
export const hasGlob = (s) => /[*?[]/.test(s);

// 경로 세그먼트 첫 글자의 와일드카드는 점(.)으로 시작하는 이름에 매칭되지 않는다(dotglob off).
export function globRe(g) {
  let re = '';
  let segStart = true;
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '/') {
      re += '/';
      segStart = true;
      continue;
    }
    if (c === '*' || c === '?') {
      if (segStart) re += '(?!\\.)';
      if (c === '?') re += '[^/]';
      else if (g[i + 1] === '*') {
        re += '.*';
        while (g[i + 1] === '*') i++;
      } else re += '[^/]*';
    } else if (c === '[') {
      const end = g.indexOf(']', i + 1);
      if (end < 0) re += '\\[';
      else {
        re += `[${g.slice(i + 1, end).replace(/\\/g, '\\\\')}]`;
        i = end;
      }
    } else {
      re += c.replace(/[.+^${}()|\\]/g, '\\$&');
    }
    segStart = false;
  }
  return new RegExp(`^${re}$`, 'i');
}

// ── 보호 경로 판정 ──────────────────────────────────────────────────────────
function protectedReason(rel, destructive) {
  for (const d of P.PROTECTED_DIRS) {
    if (rel === d || rel.startsWith(`${d}/`)) return `${d}/`;
  }
  for (const re of P.PROTECTED_FILE_RES) {
    if (re.test(rel)) return rel;
  }
  if (destructive && P.PROTECTED_ANCESTORS.includes(rel)) return `${rel}/ (하위에 보호 경로 포함)`;
  return null;
}

// 경로 문자열 하나가 보호 경로를 가리키면 사유를, 아니면 null 을 돌려준다.
export function pathProtected(p, bases, destructive = false) {
  if (hasGlob(p)) {
    const samples = destructive ? [...P.PROTECTED_SAMPLES, ...P.PROTECTED_ANCESTORS] : P.PROTECTED_SAMPLES;
    for (const g of toRels(p, bases)) {
      const re = globRe(g);
      const hit = samples.find((s) => re.test(s));
      if (hit) return `${hit} (glob: ${p})`;
    }
    return null;
  }
  for (const rel of toRels(p, bases)) {
    const r = protectedReason(rel, destructive);
    if (r) return r;
  }
  return null;
}

// ── 시크릿 이름 판정 ────────────────────────────────────────────────────────
// 문자열을 경로·구분자로 쪼개 조각마다 basename 규칙을 적용한다.
export function secretHit(text) {
  for (const piece of text.split(/[\/\\\s"'`=:,;()<>|&{}]+/)) {
    if (!piece) continue;
    const r = P.isSecretName(piece);
    if (r) return `${r} (${piece})`;
    if (hasGlob(piece)) {
      const re = globRe(piece);
      const hit = P.ENV_SAMPLES.find((s) => re.test(s));
      if (hit) return `.env 파일에 매칭되는 glob (${piece})`;
    }
  }
  return null;
}

// ── 명령어 분해 ─────────────────────────────────────────────────────────────
// 따옴표 밖의 구분자(; | & && || 개행 ( ) 백틱, 공백이 있는 { })로 나눈다.
// esc=true: 따옴표 안/밖의 역슬래시를 bash 식 이스케이프로 본다. esc=false: 문자 그대로 둔다.
// Windows 경로 때문에 두 해석을 모두 돌려 하나라도 걸리면 차단한다.
function splitSegments(cmd, esc) {
  const segs = [];
  let cur = '';
  let q = null;
  const push = () => {
    segs.push(cur);
    cur = '';
  };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    const n = cmd[i + 1];
    const p = cmd[i - 1];
    if (q) {
      cur += c;
      if (esc && q === '"' && c === '\\' && i + 1 < cmd.length) cur += cmd[++i];
      else if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'") {
      q = c;
      cur += c;
    } else if (esc && c === '\\' && i + 1 < cmd.length) {
      cur += c + cmd[++i];
    } else if (c === '`') {
      if (n === '\n' || n === '\r') {
        cur += ' ';
        i++;
      } else push();
    } else if (c === '\n' || c === ';' || c === '(' || c === ')') push();
    else if (c === '{' && (!n || /\s/.test(n))) push();
    else if (c === '}' && (!p || /\s/.test(p))) push();
    else if (c === '&') {
      if (p === '>' || n === '>') cur += c; // 2>&1, &>
      else {
        if (n === '&') i++;
        push();
      }
    } else if (c === '|') {
      if (p === '>') cur += c; // >|
      else {
        if (n === '|' || n === '&') i++;
        push();
      }
    } else cur += c;
  }
  push();
  return segs;
}

function tokenize(s, esc) {
  const out = [];
  let cur = '';
  let has = false;
  let quoted = false;
  let q = null;
  const flush = () => {
    if (has) out.push({ text: cur, quoted });
    cur = '';
    has = false;
    quoted = false;
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === q) q = null;
      else if (esc && q === '"' && c === '\\' && i + 1 < s.length) cur += s[++i];
      else cur += c;
      continue;
    }
    if (c === '"' || c === "'") {
      q = c;
      has = true;
      quoted = true;
    } else if (/\s/.test(c)) flush();
    else if (esc && c === '\\' && i + 1 < s.length) {
      cur += s[++i];
      has = true;
    } else {
      cur += c;
      has = true;
    }
  }
  flush(); // 닫히지 않은 따옴표는 남은 내용을 그대로 토큰으로 둔다 (반대 해석 모드가 보완)
  return out;
}

export function exeName(t) {
  return baseName(t).toLowerCase().replace(/\.(exe|cmd|bat|ps1|com)$/, '');
}

function shellInner(exe, args) {
  const lower = args.map((a) => a.toLowerCase());
  if (exe === 'cmd') {
    const i = lower.findIndex((a) => a === '/c' || a === '/k');
    return i >= 0 ? [args.slice(i + 1).join(' ')] : [];
  }
  if (exe === 'pwsh' || exe === 'powershell') {
    const out = [];
    const ci = lower.findIndex((a) => /^-c(o(m(m(a(n(d)?)?)?)?)?)?$/.test(a));
    if (ci >= 0) out.push(args.slice(ci + 1).join(' '));
    const ei = lower.findIndex((a) => /^-e(c|nc|ncodedcommand)?$/.test(a));
    if (ei >= 0 && args[ei + 1]) {
      try {
        out.push(Buffer.from(args[ei + 1], 'base64').toString('utf16le'));
      } catch {
        throw new Error('undecodable -EncodedCommand');
      }
    }
    return out;
  }
  const i = args.findIndex((a) => /^-[a-z]*c[a-z]*$/i.test(a));
  return i >= 0 && args[i + 1] !== undefined ? [args[i + 1]] : [];
}

function walk(cmd, esc, depth, res) {
  if (depth > 4) throw new Error('command nesting too deep');
  for (const seg of splitSegments(cmd, esc)) {
    const redirects = [];
    const words = [];
    const toks = tokenize(seg, esc);
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      const m = !t.quoted && /^(.*?)>>?\|?(.*)$/.exec(t.text);
      if (!m) {
        words.push(t.text);
        continue;
      }
      if (m[1] && !/^(\d+|\*|&)$/.test(m[1])) words.push(m[1]);
      if (m[2]) redirects.push(m[2]);
      else if (toks[i + 1]) redirects.push(toks[++i].text);
    }
    let guard = 0;
    while (words.length && guard++ < 12) {
      if (/^[A-Za-z_]\w*=/.test(words[0])) {
        words.shift();
        continue;
      }
      const exe = exeName(words[0]);
      if (P.WRAPPERS.has(exe)) {
        words.shift();
        while (words.length && words[0].startsWith('-')) words.shift();
        continue;
      }
      if (P.PKG_RUNNERS.has(exe) && P.PKG_RUNNER_SUBS.has((words[1] ?? '').toLowerCase())) {
        words.splice(0, 2);
        while (words.length && words[0].startsWith('-')) words.shift();
        continue;
      }
      break;
    }
    if (!words.length) {
      if (redirects.length) res.push({ exe: '', args: [], redirects });
      continue;
    }
    const exe = exeName(words[0]);
    const args = words.slice(1);
    if (P.SHELLS.has(exe)) for (const inner of shellInner(exe, args)) walk(inner, esc, depth + 1, res);
    if (exe === 'eval') walk(args.join(' '), esc, depth + 1, res);
    res.push({ exe, args, redirects });
  }
}

export function invocations(cmd) {
  const res = [];
  walk(cmd, true, 0, res);
  walk(cmd, false, 0, res);
  return res;
}

// git [전역옵션] <sub> ... 에서 서브커맨드를 찾는다.
export function gitParse(args) {
  let i = 0;
  const globals = [];
  while (i < args.length) {
    const a = args[i];
    if (P.GIT_VALUE_GLOBALS.has(a)) {
      globals.push(a, args[i + 1] ?? '');
      i += 2;
    } else if (a.startsWith('-')) {
      globals.push(a);
      i++;
    } else break;
  }
  return { sub: (args[i] ?? '').toLowerCase(), rest: args.slice(i + 1), globals };
}

// 인자 하나에서 경로일 수 있는 후보들을 뽑는다 (a,b 목록 / key=value / -Path:value).
function pathCandidates(a) {
  const out = new Set();
  for (const part of a.split(',')) {
    out.add(part);
    const eq = part.indexOf('=');
    if (eq > 0) out.add(part.slice(eq + 1));
    if (part.startsWith('-')) {
      const colon = part.indexOf(':');
      if (colon > 0) out.add(part.slice(colon + 1));
    }
  }
  return [...out].filter(Boolean);
}

// 보호 경로로 파일을 들이거나 지우거나 바꾸는 호출이 있으면 사유를 돌려준다.
export function findProtectedWrite(invs, ctx) {
  let bases = ctx.bases;
  for (const inv of invs) {
    const { exe, args, redirects } = inv;
    if (P.CD_COMMANDS.has(exe)) {
      const target = args.find((a) => !a.startsWith('-') && a !== '-');
      if (target) {
        const next = new Set();
        for (const b of bases) for (const r of toRels(target, [b])) next.add(r);
        if (next.size) bases = [...next];
      }
      continue;
    }
    for (const r of redirects) {
      const hit = pathProtected(r, bases);
      if (hit) return `보호 경로로 리다이렉트: ${hit}`;
    }
    let writes = P.WRITE_COMMANDS.has(exe);
    let destructive = P.DESTRUCTIVE_COMMANDS.has(exe);
    let argv = args;
    if (exe === 'sed') {
      writes = args.some((a) => /^-[A-Za-z]*i/.test(a) || a.startsWith('--in-place'));
    } else if (exe === 'git') {
      const g = gitParse(args);
      if (P.GIT_WRITE_SUBCOMMANDS.has(g.sub)) {
        writes = true;
        destructive = P.GIT_DESTRUCTIVE_SUBCOMMANDS.has(g.sub);
        argv = g.rest;
      }
    }
    if (!writes) continue;
    if (P.COPY_COMMANDS.has(exe)) {
      // 목적지만 검사: 마지막 위치 인자 + -t/-Destination 뒤의 값
      const dests = [];
      const positional = [];
      for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        const colon = a.startsWith('-') ? a.indexOf(':') : -1;
        const flag = (colon > 0 ? a.slice(0, colon) : a).toLowerCase();
        if (P.COPY_DEST_FLAGS.has(flag)) {
          if (colon > 0) dests.push(a.slice(colon + 1));
          else if (argv[i + 1] !== undefined) dests.push(argv[++i]);
        } else if (a.toLowerCase().startsWith('--target-directory=')) dests.push(a.slice(a.indexOf('=') + 1));
        else if (!a.startsWith('-')) positional.push(a);
      }
      // 목적지 플래그가 있으면 위치 인자는 전부 원본이다
      if (!dests.length && positional.length) dests.push(positional[positional.length - 1]);
      argv = dests;
    }
    for (const a of argv) {
      for (const cand of pathCandidates(a)) {
        const hit = pathProtected(cand, bases, destructive);
        if (hit) return `보호 경로에 쓰기/이동/삭제 (${exe}): ${hit}`;
      }
    }
  }
  return null;
}

export { block, makeCtx };
