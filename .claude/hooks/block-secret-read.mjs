// PreToolUse: Bash / PowerShell / Read / Grep / Glob. 시크릿 파일(.env, *.pem, credentials*)
// 접근을 이름(basename) 기준으로 차단한다. .env.example 은 허용.
import { runHook, str, invocations, secretHit } from './lib/common.mjs';

function optStr(v, name) {
  if (v === undefined || v === null) return '';
  return str(v, name);
}

runHook((input) => {
  const t = input.tool_input;
  let texts;
  switch (input.tool_name) {
    case 'Bash':
    case 'PowerShell': {
      const cmd = str(t.command, 'command');
      texts = [cmd];
      for (const inv of invocations(cmd)) texts.push(inv.exe, ...inv.args, ...inv.redirects);
      break;
    }
    case 'Read':
      texts = [str(t.file_path, 'file_path')];
      break;
    case 'Grep':
      texts = [optStr(t.path, 'path'), optStr(t.glob, 'glob')];
      break;
    case 'Glob':
      texts = [str(t.pattern, 'pattern'), optStr(t.path, 'path')];
      break;
    default:
      return null;
  }
  for (const text of texts) {
    const hit = secretHit(text);
    if (hit) return `시크릿 파일 접근 금지: ${hit}`;
  }
  return null;
});
