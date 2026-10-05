# hookify 샌드박스 시험 기록 (2026-10-05)

글 작성(2번째 글)의 "직접 써본" 근거 자료. 확인한 것과 추정·미확인을 구분해서 적는다.

## 환경
- Windows, Git Bash, 한국어 환경(오류 메시지에 cp949 코덱이 나옴), Claude Code 2.1.289, Claude Pro 로그인
- 시험 폴더: ~/Desktop/project/hookify_sandbox (claude_blog와 분리)
- 설치본: hookify @ anthropic-plugin-directory, Scope project, Author Anthropic, Installed at commit d182ca4 (캐시 폴더명 d182ca456ca0-da43175c)
- 구성: Commands configure/help/hookify/list, Agent conversation-analyzer, Skill writing-rules, Hooks PreToolUse/PostToolUse/Stop/UserPromptSubmit
- 같은 세션에 superpowers@claude-plugins-official의 SessionStart 훅도 로드돼 있었음(/hooks 화면). 시험 환경이 완전히 깨끗하진 않았음.
- 공식 마켓플레이스 로컬 사본(marketplaces/claude-plugins-official/plugins/hookify)에도 hookify가 있음. 두 사본이 같은 코드인지는 미확인. 후보 조사의 hookify@claude-plugins-official 표기는 틀린 정보가 아니었으나, 이번에 설치된 것은 anthropic-plugin-directory 출처.

## 시간순 기록
1. 설치: /plugin에서 project 범위로 설치. Installed 탭에서 Enabled 확인.
2. 명령 이름: /hookify:help 는 동작. help 문서는 "/hookify <설명>"으로 안내하지만 이 환경에서는 /hookify 가 "Unknown command". /hookify:hookify <설명> 으로 하니 규칙이 만들어짐. 원인 미확인("내 환경에서는"으로 한정).
3. 규칙 생성: Claude가 한국어 설명을 규칙 파일(.claude/hookify.<이름>.local.md)로 변환. frontmatter는 name/enabled/event/pattern/action, 본문은 발동 시 메시지. 만들어진 pattern: (?i)(^|[\s;&|])(rm|del|erase|unlink|rmdir|rd|remove-item|ri)\s+[^;&|\n]*dummy2\.txt . 본문에 이모지와 한글이 들어감.
4. 첫 시험 실패: 규칙을 만든 직후 dummy.txt, dummy2.txt 삭제가 경고도 차단도 없이 실행됨. 재시작(/exit 후 재실행)해도 동일. /hooks 에서 hookify의 PreToolUse 등 훅 등록은 확인됨. 화면에는 오류 표시가 없었음(조용히 통과).
5. 원인 규명: 훅 스크립트(pretooluse.py)를 CLAUDE_PLUGIN_ROOT 설정 후 직접 실행하자 "Error: Malformed rule file ... 'cp949' codec can't decode byte 0xf0 in position 172" 가 나오고 출력은 {} 종료코드 0(통과). PYTHONUTF8=1 을 설정하면 같은 입력에서 permissionDecision "deny"와 차단 메시지가 나옴. PYTHONUTF8=1 로 claude를 시작한 실제 세션에서도 차단·경고가 작동함.
   - 해석(추정): 규칙 파일을 인코딩 지정 없이 읽어 Windows 기본 코드페이지(cp949)로 해석하는 것으로 보임. 소스 코드는 확인하지 않음. 실패 위치가 본문 첫머리 이모지 자리와 맞음.
   - 규칙 파일을 못 읽으면 규칙이 건너뛰어지고 명령이 통과(fail-open).
6. 해결책 두 가지 확인: (a) PYTHONUTF8=1 로 claude 시작, (b) 이모지·한글 없는 ASCII 규칙은 PYTHONUTF8 없이도 deny (훅 직접 실행 기준). 깨진 규칙 파일 2개가 같은 폴더에 있어도 ASCII 규칙은 작동하고 Error 2줄이 출력됨(훅 직접 실행 기준. 실제 세션에서 이 오류가 보이는지는 미확인).

## block과 warn의 차이 (실제 세션, PYTHONUTF8=1)
- block: PreToolUse에서 "Blocked by hook" 오류, 명령 미실행, 파일 유지.
- warn: PreToolUse에서 경고가 표시되고 명령은 실행됨. PostToolUse에서 같은 경고가 한 번 더 표시됨(총 2회).
- 관찰 1회: warn 시험 후 Claude의 답변은 "경고 메시지도 보이지 않았습니다"라고 했음. 경고가 사용자 화면에는 보이지만 모델에게는 전달되지 않을 수 있다는 단서. 반복 미확인이므로 단정 금지.

## 우회와 한계
- 차단됨: rm dummy2.txt, rm ./dummy2.txt, rm -f dummy2.txt
- 통과(실제 세션): mv dummy2.txt gone.txt → 실행되고 gone.txt 생성 확인.
- 통과(훅 직접 실행, 파일은 건드리지 않음): rm *.txt, python3 -c "import os; os.remove('dummy2.txt')". 대조군 rm dummy2.txt 는 deny.
- 실제 세션에서 rm *.txt 는 hook이 아니라 Claude Code 자동 모드 분류기("Irreversible Local Destruction")가 거부함. python 삭제 시험은 모델이 앞선 거부를 근거로 실행하지 않음. 즉 두 경우 모두 hook이 막은 것이 아님.
- 결론: 이 규칙은 파일명과 삭제 명령어가 명령 문자열에 함께 나올 때만 작동하는 문자열 매칭. 이름 변경, 와일드카드, 다른 인터프리터 호출은 규칙에 없으면 통과.

## 시험 해석상 주의
- /hookify:list 실행 후 Claude가 "규칙이 있으므로 삭제하지 않겠다"고 한 것은 hook 차단이 아니라 모델의 자발적 거부다(실행 시도 자체가 없었음). 증거로 쓰지 않는다.
- ! 접두사로 사용자가 직접 실행하는 셸 명령은 hook을 거치지 않으므로 시험이 되지 않는다.

## 글에 쓸 때 주의 / 미확인
- 37,000+ 스타는 모노레포 수치. hookify 수치로 쓰지 않는다.
- 미확인: 다른 OS·로케일에서의 동작, 최신 버전에서도 재현되는지, /hookify 단축형이 안 되는 원인, hookify 소스(인코딩 처리) 원문 대조, 두 마켓플레이스 사본의 동일성.
- 재현 환경 한정 표현 필요: "한국어 Windows(cp949) + project 범위 설치 + 한글/이모지 규칙".
- 글 소재: 규칙이 조용히 무시되면 보안 목적의 hook은 무력해진다(fail-open). 이 블로그의 3중 방어(hook은 실수 방지용, 우회 가능)와 연결할 수 있음.

## 추가 관찰 (2026-10-05, 사용자가 팩트체크 후 보충한 항목)
- (a) /hookify:help 출력의 첫 문단: "Hookify lets you block or warn on unwanted Claude behavior by writing small markdown rules. You don't edit hooks.json." (플러그인 자체 도움말 문구. hooks.json을 직접 편집하지 않는다는 설명의 근거.)
- (b) 시험 전 확인: 이 PC에서 python, py, python3 모두 Python 3.14.7로 동작했고, 훅은 python3로 실행됨. (Python 경로 문제를 만나지 않았다는 서술의 근거. 이 PC 한 대 기준이며 다른 환경은 미확인.)
- (c) 설치된 커밋(d182ca4) 캐시에서 직접 확인: LICENSE는 Apache License Version 2.0, README 338~340행은 "## License / MIT License". (설치된 복사본에서도 README와 LICENSE 파일의 표기가 다름.)
- (d) /plugin Marketplaces 화면: "Anthropic Directory"(Built in, 2484 available)와 "claude-plugins-official"(anthropics/claude-plugins-official, 315 available, 1 installed)는 별개의 마켓플레이스. 설치된 hookify의 출처 anthropic-plugin-directory는 앞쪽이고, 그 항목은 "(no CLI name) · listed as Anthropic Directory"로 표시됨. 두 사본의 코드 동일성은 여전히 미확인.
- (e) 설치 경로: 사용자가 /plugin 메뉴의 Discover 탭에서 직접 설치했다고 확인함(2026-10-05, 시험 후 사용자 진술). 설치 범위는 project, Installed 탭에서 Enabled 확인.
