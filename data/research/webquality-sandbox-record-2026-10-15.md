# web-quality-skills 샌드박스 시험 기록 (2026-10-15)

글 작성의 "직접 써본" 근거 자료. 사용자가 sandbox-webquality 폴더에서 직접 수행한 시험의 관찰만 적는다. 원본 메모는 data/research/webquality-sandbox-notes-2026-10-15.md(사용자가 시험 중 찍은 Claude Code 화면 캡처 6장을 보고 정리)이고, 캡처 이미지 자체는 이 기록 작성 시 받지 못했다. 확인한 것과 미확인을 구분한다.

## 환경
- Windows (Git Bash), Claude Code 2.1.300 (claude --version 출력), 모델 표시 Sonnet 5.5, Claude Pro
- 시험 폴더: ~\Desktop\project\sandbox-webquality (블로그 저장소 밖)
- 시험 대상: 사용자가 직접 만든 가짜 index.html 11줄. lodash 외부 스크립트, 대비가 낮은 글자색(#bbb on #fff), alt 없는 이미지, onclick div, label 없는 input 등을 일부러 넣음.
- jq: 조사 단계(2026-10-15)에 이 PC에서 command -v jq 출력이 없었음. 시험 중 jq 관련 오류는 관찰되지 않음.
- 설치된 플러그인 버전: 2.0.0 (아래 "설치본 읽기 전용 확인" 참고)

## 시간순 기록
1. /plugin marketplace add addyosmani/web-quality-skills → "Successfully added marketplace: addy-web-quality-skills"
2. /reload-plugins → "Reloaded: 4 plugins · 28 skills · 6 agents · 1 hook · 7 plugin MCP servers · 0 plugin LSP servers". 이 줄은 plugin install 전에 실행됐다. 설치 후 개수는 보지 않음.
3. /plugin install web-quality-skills@addy-web-quality-skills → "✓ Installed web-quality-skills. Plugin is now active."
4. 시험 1: "index.html을 웹 품질 관점에서 점검해줘. 파일은 고치지 말고 보고서만 줘."
5. 시험 2: "접근성만 따로 봐줘."
6. 시험 3: "사이트 속도를 개선해줘"

## 관찰
- 마켓플레이스 이름 addy-web-quality-skills, 설치 명령이 조사 문서(install_commands)의 명령과 일치했다.
- 시험 1: 발동한 스킬은 Skill(web-quality-skills:web-quality-audit) (사용자가 화면을 다시 확인해 알려 줌). 파일은 수정하지 않았다고 보고했고, 소스만 읽고 점검했다고 밝혔다. 브라우저 실측(Lighthouse, 트레이스)은 하지 않았고 LCP, INP, CLS 같은 수치는 측정하지 않았다고 명시했다.
- 시험 1: 항목 9개를 Critical/High, Medium, Low로 분류했다. 영역 요약 표는 성능(미측정, 소스상 우려 1건), 접근성(심각), SEO(부족), Best Practices(부족), Agentic Browsing(낮음).
- 시험 1: 글자색 대비 1.9:1(#bbb on #fff)을 지적하고 권장색 #767676(4.54:1)을 제시했다. 두 대비값은 WCAG 상대 휘도 공식으로 따로 계산해 확인했다(#bbb on #fff = 1.92:1, #767676 on #fff = 4.54:1, 2026-10-15, 시험 후 별도 계산).
- 시험 1: 마지막에 "수정 후 Lighthouse와 성능 트레이스를 같은 조건에서 다시 돌려야 한다"고 적었다. 근거 없는 개선율(%)은 화면에 없었다.
- 시험 2: 발동한 스킬은 Skill(web-quality-skills:accessibility) (사용자가 화면을 다시 확인해 알려 줌). "index.html 접근성 점검 (WCAG 2.2)" 제목 아래 총 8건(Critical 4, Serious 3, Moderate 1)을 WCAG 기준 번호와 줄 번호와 함께 보여 줬다.
- 시험 2: "Lighthouse, axe, 스크린리더, 키보드 실측은 하지 않았다"고 명시했고 파일은 수정하지 않았다. 현재 소스로는 판단할 수 없는 항목(포커스 표시, 대상 크기, 확대/리플로우 등)을 따로 구분해 적었다.
- 시험 3: Skill(web-quality-skills:performance)이 호출됐고 "Successfully loaded skill"이 표시됐다.
- 시험 3: 이 요청에서는 index.html을 직접 수정했다(Write, 6줄 추가 3줄 삭제). lodash script 제거, `<!DOCTYPE html>`·meta charset·meta viewport 추가, 이미지에 max-width:100%;height:auto 추가. 수정 전 파일 수정 확인 질문은 화면에 없었다.
- 시험 3: 보고서에 "브라우저로 측정하지 못해서 효과는 코드를 읽고 판단한 것", "수정 전 수치가 없어 전후 비교 불가"라고 명시했고 Lighthouse는 돌리지 않았다.
- 시험 3: 속도와 무관하다고 보고 접근성 문제(대비, onclick div, label, alt, lang)는 그대로 뒀다. 이미지 최적화·캐시·서버 설정은 이 파일만으로 확인 불가라고 구분했다.

## 설치본 읽기 전용 확인 (2026-10-15, Claude가 파일을 읽기만 함)
- C:\Users\Joh\.claude\plugins\installed_plugins.json의 web-quality-skills@addy-web-quality-skills 항목: scope local, version 2.0.0, installedAt 2026-10-15T08:14:39Z, gitCommitSha afa8da942115f2961fdbfa80807ea0b232ff6c00, projectPath C:\Users\Joh\Desktop\project\sandbox-webquality.
- 설치 경로 C:\Users\Joh\.claude\plugins\cache\addy-web-quality-skills\web-quality-skills\2.0.0\ 의 .claude-plugin/plugin.json: version 2.0.0, license MIT. 같은 폴더 skills/에 accessibility, best-practices, core-web-vitals, performance, seo, web-quality-audit 6개가 있고 web-quality-audit/scripts/에 analyze.sh가 있다.
- 설치된 SKILL.md 6개와 analyze.sh(총 7개 파일)가 줄 끝의 CR을 무시하면 2026-10-15에 받은 main(afa8da9)의 파일과 동일했다(diff --strip-trailing-cr). 설치본은 CRLF 줄바꿈이고 main은 LF다. references/ 하위 문서는 비교하지 않았다.
- 마켓플레이스 사본(~/.claude/plugins/marketplaces/addy-web-quality-skills)의 HEAD도 afa8da9였다.

## 미확인 항목
- analyze.sh 실행 여부와 jq 관련 오류: 세 번의 시험 모두 화면에 나오지 않았다고 사용자가 확인했다. 실행되지 않았는지, 눈에 띄지 않았는지는 미확인. jq 없는 PC에서 오류가 났다는 관찰은 없다.
- 설치 후 스킬 개수와 /plugin 화면(/reload-plugins는 설치 전에 실행됨).
- 전역 npm 설치(@axe-core/cli) 제안 여부: 캡처 범위에서는 보이지 않음.
- 실제 Lighthouse 점수 변화: 측정하지 않음.
- seo, best-practices, core-web-vitals 스킬: 시험하지 않음.
- Chrome DevTools MCP를 쓰는 경로: 시험하지 않음(이 환경에 연결 여부도 미확인).
- 각 요청을 한 번씩만 했다. "이 스킬은 항상 소스만 읽는다", "performance 스킬은 항상 파일을 고친다" 같은 일반화는 불가.
- 시험 3에서 수정 허락 없이 파일을 고친 것은 요청 문구("개선해줘")가 수정을 암시했을 가능성이 있으나 같은 조건을 반복해 확인하지 않았다.
- 다른 PC나 다른 버전(OS, Claude Code, 플러그인)에서의 동작.
