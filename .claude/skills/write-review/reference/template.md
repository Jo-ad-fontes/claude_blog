# 리뷰 글 템플릿

0주차에 superpowers를 손으로 리뷰하면서 실제로 쓸모 있었던 섹션만 남긴 버전이다.
원안의 14개 섹션 중 일부를 합치거나 뺐다 — 이유는 각 섹션 아래 괄호로 적어둔다.

## Front matter

```yaml
---
slug: ""                 # kebab-case, claude-code-<도구이름>-<type>-review 형태 권장
status: DRAFT
title: ""
seo_title: ""
meta_description: ""
primary_keyword: ""
secondary_keywords: []
lang: "en"                # 언어 전략(영어 우선)에 따라 항상 "en". /ko/ 버전이 생기면 그때 "ko" 추가
category: ""             # skills | plugins | connectors — config/taxonomy.yaml의 키와 일치해야 함
content_type: "Daily Review"
tags: []
candidate_id: ""         # research JSON의 candidate_id와 동일해야 함
tested_at: null          # hands_on_test가 없으면 null
claude_code_version: null
extension_version: null
os: null
fact_check:
  verdict: null
  checked_at: null
  issues: []
sources: []               # claims의 source_url을 그대로 모아서 넣는다
cost_usd: 0
---
```

## 본문 섹션

### 1. What is it?
한두 문단. 정의 + 한 줄 요약. (원안의 "정의"에 해당)

### 2. Why it matters
인지도·모멘텀 근거를 구체적 숫자로. "인기 있다"가 아니라 "스타 28만 개"처럼.
(원안의 "왜 주목할 만한가")

**변동성 있는 숫자(스타 수, 포크 수, 다운로드 수)는 정확한 스냅샷이 아니라
"28만 개 이상"처럼 문턱값으로 쓴다.** "290,025개"라고 정확히 쓰면 다음 날 숫자가
바뀌어서 fact-check가 영원히 WARNING을 낸다 — 2026-09-22 superpowers 리뷰에서
실제로 겪은 문제다. 정확한 숫자가 필요한 건 오직 버전 번호, 날짜, 출시일처럼
자연적으로 안 늘어나는 값뿐이다.

### 3. A name collision / caution worth flagging (해당될 때만)
동명 프로젝트, 흔한 오해, 검색했을 때 헷갈리는 것들. **claims에 근거가 있을 때만 쓴다.**
없으면 이 섹션 자체를 통째로 뺀다 — 억지로 채우지 않는다.

### 4. Key features
문서 기준 핵심 기능. claims 배열에서 직접 가져온다.

### 5. Installation
실제 설치 명령어 (install_commands 그대로). `hands_on_test`가 있으면 실제로
됐는지/걸린 시간/에러 여부까지 여기 붙인다. 없으면 "documented, not yet verified"라고
명시한다.

### 6. Hands-on test
`hands_on_test`가 있으면 관찰 내용을 그대로 서술한다 — 특히 문서 주장과
**다른** 부분이 있으면 그걸 중심으로 쓴다 (독자가 검색으로는 못 얻는 정보).
`hands_on_test`가 없으면:

```
## Hands-on test — pending

아직 실제로 설치·실행해보지 않았다. [ ] 체크리스트로 뭘 확인해야 하는지만 남긴다.
```

### 7. Automation ideas
이 도구로 뭘 자동화할 수 있는지. **hands_on_test가 있고 실제 동작을 확인한
경우에만** 쓴다. 문서만 보고 상상해서 쓰지 않는다 — 실제로 안 되는 걸
된다고 쓰는 사고가 여기서 제일 잘 난다.

### 8. Pros
검증된 것만. `<!-- to fill in after hands-on test -->`로 비워두는 걸 부끄러워하지 않는다.

### 9. Watch-outs
한계·주의사항. `watch_outs` 배열 + claims 중 부정적인 사실들.
(원안의 "한계/주의사항"에 해당, "장단점"을 분리하지 않고 대칭적으로 다룸)

### 10. Recommended users
누구에게 맞는지. **claims에 근거 문장이 없으면 이 섹션도 통째로 뺀다**
(추측으로 채우지 않는다 — 0주차 초안에서 실제로 이렇게 처리했다).

### 11. FAQ
검색 의도가 높은 질문 2~4개. 본문에서 이미 다룬 내용을 Q&A 형태로 재구성.

## 뺀 섹션과 이유

원안의 14개 섹션 중 다음은 뺐다 (0주차 결과 반영):

- **"Claude Code와 함께 사용하기"** — 대부분의 도구가 Claude Code 확장 기능
  자체이므로 "설치"·"기본 사용법"과 내용이 겹친다. 정말 별도로 설명할 통합
  방식이 있을 때만(예: 다른 도구와 조합) 섹션을 되살린다.
- **"버전 정보"를 별도 섹션으로 안 둠** — front matter에 이미 구조화되어
  있어서, 본문에 또 쓰면 중복이다.
- **"관련 콘텐츠"** — 아직 다른 글이 없어서 링크할 게 없다. 블로그에 글이
  쌓이면(대략 5편 이상) 다시 넣는다.

이 목록 자체도 고정이 아니다. 글을 몇 편 더 써보고 또 안 쓰이는 섹션이
보이면 이 파일을 고친다.
