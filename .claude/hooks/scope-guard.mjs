// PreToolUse: Write / Edit / NotebookEdit. 보호 경로 쓰기와 .env 쓰기를 차단한다.
import { runHook, str, baseName, pathProtected } from './lib/common.mjs';
import { isEnvName } from './lib/patterns.mjs';

runHook((input, ctx) => {
  let p;
  switch (input.tool_name) {
    case 'Write':
    case 'Edit':
      p = str(input.tool_input.file_path, 'file_path');
      break;
    case 'NotebookEdit':
      p = str(input.tool_input.notebook_path, 'notebook_path');
      break;
    default:
      return null;
  }
  if (isEnvName(baseName(p))) return `.env 파일 쓰기 금지: ${p}`;
  const hit = pathProtected(p, ctx.bases);
  if (hit) return `보호 경로 쓰기 금지: ${hit}`;
  return null;
});
