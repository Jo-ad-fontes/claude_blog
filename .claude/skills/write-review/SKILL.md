---
name: write-review
description: Claude Code 확장 기능(Skill/Plugin/Connector) 조사 결과(JSON)를 받아 블로그 리뷰 초안을 작성한다. data/research/<slug>.json 형태의 조사 파일이 있고 "초안 써줘" / "리뷰 작성해줘" / "write-review" 같은 요청이 올 때 사용한다.
allowed-tools: Read, Write
---

# write-review

조사 결과를 블로그 초안으로 바꾸는 Skill이다. **이 Skill은 웹에 접근하지 않는다** — 의도적이다.
초안 단계에서 새로운 사실을 "확인"한답시고 검색하게 두면, 출처 없는 문장이 섞여 들어갈 길이 생긴다.
`data/research/<slug>.json`에 없는 사실은 쓸 수 없는 것으로 취급한다.

## 입력

`data/research/<slug>.json`. 없으면 사람에게 경로를 묻는다. 만들어내지 않는다.

스키마 (extension-research Skill이 나중에 이 형태로 만든다. 지금은 사람이 직접 채워도 된다):

```json
{
  "candidate_id": "obra-superpowers",
  "name": "Superpowers",
  "type": "skill",
  "category": "skills",
  "urls": { "official": "...", "github": "..." },
  "claims": [
    {
      "claim": "간결하고 검증 가능한 사실 한 문장",
      "source_url": "https://...",
      "source_kind": "official_docs",
      "fetched_at": "2026-09-18"
    }
  ],
  "install_commands": ["/plugin install ..."],
  "hands_on_test": {
    "tested_at": "2026-09-18",
    "claude_code_version": "2.1.276",
    "os": "Windows",
    "observations": [
      "관찰한 것 하나를 한 문장으로. 문서 주장과 다르면 특히 명확히 적는다."
    ]
  },
  "watch_outs": ["설치·사용 전 알아둘 것들"]
}
```

`source_kind`는 `official_docs / github_readme / release_notes / hands_on / community` 중 하나만 쓴다.
`hands_on_test`가 없으면 실전 테스트가 아직 없다는 뜻이다 — 지어내지 말고 "Hands-on test — pending"으로 남긴다.

## 글 구조

`reference/template.md`의 구조를 그대로 따른다 (0주차 실제 리뷰에서 검증된 섹션 구성).
파일이 길어서 본문에 안 넣었다 — 작업 전에 그 파일을 먼저 읽는다.

## 절대 규칙

1. **`claims` 배열에 없는 기술적 사실은 쓰지 않는다.** 도저히 필요하면
   `<!-- UNVERIFIED: 무엇이 왜 확인 안 됐는지 --> `로 남기고 본문 서술에는 넣지 않는다.
2. **`hands_on_test`가 없는 섹션(Hands-on test, Pros 일부, Automation ideas)은
   채우지 않는다.** "to fill in after hands-on test" 같은 플레이스홀더를 그대로 둔다.
   빈 자리를 그럴듯한 문장으로 채우는 것이 이 Skill이 저지르기 가장 쉬운 실수다.
3. **`watch_outs`에 이름 충돌(동명 저장소), 라이선스, 유료 전환 조건처럼
   독자가 설치 전에 알아야 할 함정이 있으면 "Watch-outs" 섹션에 반드시 반영한다.**
   빠뜨리면 안 된다 — 이게 검색 결과보다 나은 이유의 핵심이다.
4. **원문을 그대로 옮기지 않는다.** `claims`의 문장도 패러프레이즈해서 쓴다.
   인용이 꼭 필요하면 15단어 미만, 출처당 한 번만.
5. **front matter를 빠짐없이 채운다** (`reference/template.md` 참고). 모르는 값은
   `null`로 두고 코멘트로 이유를 남긴다 — 빈칸으로 비워두지 않는다.

## 출력

`articles/drafts/<slug>.md`. 이미 파일이 있으면 덮어쓰기 전에 사람에게 확인한다
(리서치 단계가 아니라 사람이 이미 손으로 고친 초안일 수 있다).

front matter의 `status`는 항상 `DRAFT`로 시작한다. `fact-check` Skill이 통과시키기
전까지 다른 값으로 바꾸지 않는다.

## 끝나면

무엇을 `<!-- UNVERIFIED -->`로 남겼는지, 어떤 섹션이 비어 있는지 한 문단으로
요약해서 알려준다. 사람이 다음에 뭘 채워야 하는지 바로 알 수 있어야 한다.
