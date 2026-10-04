---
name: fact-check
description: 리뷰 초안(articles/drafts/<slug>.md)의 기술적 클레임을 조사 원본(data/research/<slug>.json) 및 실제 출처와 대조해 PASS/WARNING/FAIL을 낸다. 초안이 다 써졌고 "fact-check 해줘" / "사실 검증해줘" 같은 요청이 올 때, 또는 write-review 직후 자연스럽게 이어서 쓴다.
allowed-tools: Read, Write, Edit, WebFetch, WebSearch, Task
---

# fact-check

`write-review`가 쓴 초안이 실제로 맞는 말을 하고 있는지 다시 확인하는 단계다.
write-review가 조사 JSON을 벗어나지 않으려고 노력했다는 것과, **그 조사 JSON
자체가 지금도 맞다는 것**은 별개다 — 이 Skill은 후자를 확인한다.

## 입력

- `articles/drafts/<slug>.md` — 검증할 초안
- `data/research/<slug>.json` — 원본 조사 (claims 배열)

둘 다 없으면 사람에게 경로를 묻는다.

## 절차

### 1. 초안에서 검증 대상 문장 뽑기

초안 본문을 읽고, 사실 주장처럼 보이는 문장을 전부 목록으로 만든다
(숫자, 기능 설명, 설치 결과, 인용 등). 의견이나 톤 표현("이건 유용하다" 같은)은
제외한다.

### 2. 출처 없는 문장부터 잡는다 (이게 제일 중요하다)

각 문장을 `data/research/<slug>.json`의 `claims` 배열과 대조한다.

- **매칭되는 claim이 있다** → 3단계로 넘어가서 실제 검증
- **매칭되는 claim이 없다** → 그 자체로 `FAIL`. write-review 단계에서 근거 없이
  써진 문장이라는 뜻이다. 추측으로 짜맞추지 않는다 — write-review의 규칙 위반을
  잡아내는 게 이 단계의 존재 이유 중 하나다.
- `hands_on_test.observations`에서 나온 문장(실전 테스트 서술)은 예외다 —
  이건 사람이 직접 관찰한 것이므로 외부 출처 대조 대상이 아니다. 다만 초안의
  서술이 `observations` 원문과 맥락이 달라지지 않았는지는 확인한다.

### 3. claims를 claim-verifier에 병렬로 넘긴다

매칭된 claim들을 `claim-verifier` 서브에이전트에 하나씩 맡긴다 (Task 도구로
동시에 여러 개 dispatch — 순차로 하지 않는다, 시간 낭비다). 각 결과를 모은다.

**판정 규칙(문턱값 처리 등)을 프롬프트에 다시 설명하지 말고, `reference/rubric.md`
경로를 그대로 알려주고 직접 읽게 한다.** claim-verifier는 프롬프트에 적힌
규칙 설명을 검증 안 된 지시로 취급하고 의심할 수 있다(실제로 2026-09-22
재검증에서 이런 일이 있었다 — 결과적으로는 옳게 동작했지만 재조회가 한 번
더 필요했다). 규칙의 출처를 파일로 직접 가리키면 이 왕복이 없어진다.

### 4. 종합 판정

- FAIL이 하나라도 있으면 → 전체 `verdict: FAIL`
- FAIL은 없지만 WARNING이 있으면 → 전체 `verdict: WARNING`
- 전부 PASS면 → 전체 `verdict: PASS`

`reference/rubric.md`에 판정 기준과 예시가 더 자세히 있다.

## 출력

### `data/factcheck/<slug>.json`

```json
{
  "slug": "...",
  "checked_at": "2026-09-18",
  "verdict": "PASS | WARNING | FAIL",
  "claims_checked": 8,
  "results": [
    { "claim": "...", "source_url": "...", "verdict": "PASS", "evidence": "..." }
  ],
  "unsourced_statements": [
    "초안에 있지만 claims 배열에 없던 문장 — 있으면 FAIL 사유"
  ]
}
```

### 초안 front matter 갱신

`articles/drafts/<slug>.md`의 `fact_check` 블록을 갱신한다.

```yaml
fact_check:
  verdict: "PASS | WARNING | FAIL"
  checked_at: "2026-09-18"
  issues: ["WARNING/FAIL 항목을 사람이 읽을 수 있게 한 줄씩"]
```

### 상태(status) 전이

- **PASS** → `status: READY_FOR_REVIEW`로 올린다 (다음은 사람 리뷰/PR 단계)
- **WARNING** → `status: DRAFT` 그대로 둔다. issues에 뭘 봐야 하는지 남기고
  사람 판단에 맡긴다.
- **FAIL** → `status: DRAFT` 그대로 둔다. **해당 문장 바로 위에
  `<!-- FACT-CHECK FAIL: 무엇이 왜 틀렸는지 -->`를 인라인으로 삽입**해서, 다음에
  write-review가 다시 손볼 때 정확히 어디를 고쳐야 하는지 바로 보이게 한다.

## 절대 규칙

1. **claim-verifier의 판정을 그대로 신뢰한다.** fact-check Skill 자신이 다시
   웹을 뒤져서 서브에이전트 판정을 뒤집지 않는다 — 그러면 이중 검증의 의미가
   없어진다. 서브에이전트 결과가 이상해 보이면 사람에게 보고하되, 스스로
   재판정하지 않는다.
2. **FAIL 하나로 전체를 막는다.** "이 정도는 사소하니까 WARNING으로 봐주자"는
   판단을 하지 않는다. 기준은 `reference/rubric.md`가 정한다.
3. **불확실하면 WARNING 이상으로 기운다.** claim-verifier와 같은 원칙이다.

## 끝나면

verdict와, FAIL/WARNING이 있으면 몇 개인지 사람에게 한 줄로 보고한다.
PASS면 "READY_FOR_REVIEW로 올렸다"고 명시한다 — 사람이 다음 단계
(리뷰/PR)로 넘어갈 준비가 됐다는 걸 알아야 한다.