# MCP Memory 서버 샌드박스 시험 기록 (2026-10-07)

글 작성의 "직접 써본" 근거 자료. 사용자가 memory_mcp_sandbox 폴더에서 직접 수행한 시험의 관찰만 적는다. 확인한 것과 미확인을 구분한다.

## 환경
- Windows, Git Bash, Claude Code v2.1.292, Node v24.21.0
- 시험 폴더: memory_mcp_sandbox (claude_blog와 분리)
- `npm view @modelcontextprotocol/server-memory version` 결과: 2026.8.31
- 실제 설치된 버전(npx 캐시의 package.json, 읽기 전용 확인): 2026.8.31. npm view 결과와 같음.
- 등록 명령: `claude mcp add memory -- npx -y @modelcontextprotocol/server-memory` (local 범위, 설정은 C:\Users\Joh\.claude.json 의 memory_mcp_sandbox 프로젝트 항목)
- `cmd /c` 로 감싸지 않고 npx만으로 등록했고 /mcp 에서 connected 로 표시됨. (README는 Windows에서 cmd /c 래핑을 안내함. 이 환경에서는 래핑 없이 connected였음.)
- /mcp 화면: Capabilities는 tools, resources이고 도구는 9개

## 시간순 기록
1. 등록 후 /mcp 에서 connected, 도구 9개 확인.
2. 저장 시험 1: 사용자가 "내 별명은 Buldak이고, 좋아하는 컵라면은 Buldak 볶음면이야. 메모리 서버에 기억해 줘."라고 입력. Claude는 memory를 2번 호출했고 엔티티 이름 User(person)로 저장했다고 답함.
3. 저장 파일 확인: npx 캐시 폴더 안 dist/memory.jsonl에 기록됨(아래 "관찰" 참고).
4. 이후 시험에서 엔티티 이름이 소문자 user로 달라짐(Claude가 그때그때 정함).
5. 새 세션 시험: claude를 껐다 켜고 힌트 없이 "내 별명이 뭐였지?"라고 물으니 Claude가 스스로 memory를 호출해 Buldak과 Buldak 볶음면을 답함. 이어서 "메모리 서버에서 내 별명이랑 좋아하는 컵라면을 찾아서 알려줘."라고 물었을 때는 같은 내용을 답했으나 화면에 도구 호출 표시가 없어 같은 세션의 앞선 결과를 재사용했을 수 있음. 이 시험은 각 1회뿐.
6. 저장 위치 지정 시험: `claude mcp remove memory` 후 `claude mcp add memory -e MEMORY_FILE_PATH=C:/Users/Joh/Desktop/project/memory_mcp_sandbox/my-memory.jsonl -- npx -y @modelcontextprotocol/server-memory` 로 다시 등록. 이 경로에 my-memory.jsonl이 실제로 생성됨(120바이트, 2026-10-07 20:38).
7. 위치를 바꾼 뒤 "내 별명이 뭐였지?"라고 물으니 Claude가 "저장된 기억에서 별명을 찾지 못했습니다. 파일 기반 메모리(MEMORY.md)는 아직 없고, MCP 메모리 그래프도 비어 있습니다."라고 답함. Buldak 기록은 보이지 않았음.
8. 이어서 "내가 사는 곳은 서울이고, 취미는 축구야. 메모리 서버에 기억해 줘."라고 입력. Claude는 memory를 1번 호출했고 user 항목에 "서울에 거주한다", "취미는 축구이다"를 넣었다고 답함.
9. 사용자가 my-memory.jsonl을 확인: 120바이트, 수정 시각 2026-10-07 20:38, 내용은 한 줄 JSON `{"type":"entity","name":"user","entityType":"person","observations":["서울에 거주한다","취미는 축구이다"]}`.
10. 위치를 바꾼 뒤에도 옛 캐시 폴더의 memory.jsonl은 134바이트, 2026-10-07 19:27 그대로 남아 있었음. 옛 기록은 옛 파일에 남고, 새 서버는 새 파일에서 새로 시작함.

## 관찰
- 도구 9개: create_entities, create_relations, add_observations, delete_entities, delete_observations, delete_relations, read_graph, search_nodes, open_nodes. 이 중 delete 3개는 /mcp 화면에 destructive, read_graph/search_nodes/open_nodes는 read-only로 표시됨.
- 기본 저장 위치(MEMORY_FILE_PATH 미지정): npx 캐시 폴더 안 C:/Users/Joh/AppData/Local/npm-cache/_npx/15b07286cbcc3329/node_modules/@modelcontextprotocol/server-memory/dist/memory.jsonl, 134바이트, 수정 시각 2026-10-07 19:27.
- 내용은 한 줄 JSON: `{"type":"entity","name":"User","entityType":"person","observations":["별명은 Buldak","좋아하는 컵라면은 Buldak 볶음면"]}`
- 사용자가 말한 문장 그대로가 아니라 Claude가 정리한 문장이 저장됨.
- 한글 저장은 깨지지 않음(cp949 문제 같은 현상 없음).
- 평문 JSONL로 저장됨(위 내용 그대로 읽힘).
- MEMORY_FILE_PATH에 슬래시(/) 형태의 Windows 절대 경로(C:/...)를 주면 그 경로에 파일이 생성됨.
- 저장 위치를 바꾸면 기존 기억이 따라오지 않음: 새 서버는 새 파일(my-memory.jsonl)에서 새로 시작했고(질문에 "MCP 메모리 그래프도 비어 있습니다"라고 답함), 옛 파일은 그대로 남았음. 엔티티 두 개(User, user)는 서로 다른 파일에 하나씩 있었음.
- 두 파일 모두 평문 JSON Lines. 암호화나 접근 제한은 관찰되지 않음.

## 읽기 전용 확인 (2026-10-09, 두 파일 모두 읽기만 함)
- 위 npx 캐시 폴더의 package.json: version = 2026.8.31. dependencies는 @modelcontextprotocol/sdk ^1.30.0 하나뿐이고 zod는 없음.
- 같은 폴더 dist/memory.jsonl: 위 한 줄 JSON과 동일(User / person / 관찰 2건), 134바이트, 수정 시각 2026-10-07 19:27. 즉 첫 저장 이후 이 파일은 바뀌지 않았다. 같은 dist 폴더에는 index.js와 memory.jsonl이 있었음.
- 이 확인은 시험 이틀 뒤의 파일 상태이며, 소문자 user 엔티티와 이후 저장 내용은 이 파일에 없다. 그것들은 my-memory.jsonl에 있다(시간순 기록 9번).

## 미확인 항목
- 새 세션 시험의 두 번째 질문이 실제로 도구를 호출했는지(화면에 호출 표시 없음). 각 1회뿐이라 재현성 미확인.
- 같은 파일 안에서 엔티티 이름이 달라지면 항목이 중복되는지(시험하지 않음. 두 엔티티는 서로 다른 파일에 하나씩 있었음).
- 캐시 정리나 버전 변경 시 기본 저장 파일이 사라지는지(시험하지 않음).
- 질문이 달라져도 Claude가 자동으로 조회하는지(힌트 없는 질문 1회 관찰뿐).
- delete_* 도구의 실제 동작.
- 네트워크 호출 여부.
- create_relations의 저장 형식(시험한 저장은 엔티티와 관찰뿐).
- 도구 호출 승인 프롬프트.
- 다른 PC나 다른 버전(OS, Claude Code, 서버)에서의 동작. cmd /c 불필요도 이 PC 한 대 기준.

## 설치본 코드 직접 확인 (2026-10-09, 사용자 수행)
- 사용자가 설치본 dist/index.js(2026.8.31)를 grep과 sed로 직접 확인했다. loadGraph는 UTF-8로 읽어 줄 단위로 나누고 줄마다 JSON.parse를 한다. type이 entity나 relation인 줄만 담고 그 외 type은 아무 메시지 없이 무시한다. 줄별 try/catch는 보이지 않고, 바깥 catch는 ENOENT일 때만 빈 그래프를 돌려주고 다른 오류는 다시 던진다. 로드 함수에 스키마 검증은 보이지 않았다. "Skipping"과 "record.type" 문자열은 파일에 없었다.
- saveGraph는 같은 디렉터리의 임시 파일(이름은 메모리 파일명 뒤에 랜덤 16바이트 16진수와 .tmp)에 쓴 뒤 rename으로 덮어쓴다. 설치본 주석과 코드에서 확인했다.
- 같은 날 받은 main의 src/memory/index.ts에는 "Skipping malformed line in memory file", "Skipping non-object line in memory file" 경고와 entity, relation 검증(safeParse)이 있고(120, 125, 131, 141행 부근), 임시 파일 후 rename도 있다(193, 194행 부근). 설치본과 main의 로드 동작은 서로 다르다.
- 깨진 줄(유효하지 않은 JSON)에 대한 실제 동작은 시험하지 않았다. 위 내용은 코드를 읽은 결과이며, 실행해 본 결과가 아니다.
