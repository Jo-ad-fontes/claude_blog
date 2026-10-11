# extension-research 출력 형태

## 1. 후보 조사: data/research/<category>-candidates-<YYYY-MM-DD>.json

```json
{
  "purpose": "다음 글(카테고리) 후보 선정",
  "created_at": "YYYY-MM-DD",
  "method_notes": [
    "설치·실행하지 않았다. 무엇을 읽었는지, 원문 대조를 했는지, 못 한 것은 무엇인지"
  ],
  "excluded_by_overlap": [
    { "name": "...", "reason": "이미 쓴 글 / 역할 겹침 등", "source_url": "...", "source_kind": "...", "fetched_at": "YYYY-MM-DD" }
  ],
  "candidates": [
    {
      "rank": 1,
      "candidate_id": "owner-name",
      "name": "...",
      "type": "plugin",
      "category": "plugins",
      "rank_reason": "한 문장",
      "listed_in": { "marketplace": "이름", "repository": "owner/repo", "source_url": "...", "source_kind": "official_docs", "fetched_at": "YYYY-MM-DD" },
      "claims": [
        { "claim": "한 문장 사실", "source_url": "...", "source_kind": "github_readme", "fetched_at": "YYYY-MM-DD", "note": "(선택) 원문 대조 전 등" }
      ],
      "criteria": {
        "verifiability": { "rating": "높음", "evidence": "...", "source_url": "..." },
        "tryability":    { "rating": "중간", "evidence": "...", "source_url": "..." },
        "demand":        { "rating": "미확인", "evidence": "...", "source_url": null },
        "differentiation": { "rating": "중간", "evidence": "..." },
        "risks":         { "rating": "중간", "evidence": "..." }
      },
      "install_command_unverified": "문서에 적힌 설치 명령 (미검증)"
    }
  ]
}
```

`rating`은 `높음 / 중간 / 낮음 / 미확인`만 쓴다. 근거가 없으면 `미확인`이다.

## 2. 심층 조사: data/research/<candidate_id>.json

`write-review`가 읽는 스키마와 같다(`.claude/skills/write-review/SKILL.md`).
`hands_on_test` 키는 만들지 않는다(사람이 직접 써본 뒤에 채운다).

```json
{
  "candidate_id": "owner-name",
  "name": "...",
  "type": "plugin",
  "category": "plugins",
  "urls": { "official": "...", "github": "..." },
  "claims": [
    { "claim": "...", "source_url": "...", "source_kind": "github_readme", "fetched_at": "YYYY-MM-DD", "note": "(선택)" }
  ],
  "install_commands": ["문서에 적힌 그대로"],
  "install_commands_note": "미검증. 사람이 실제로 실행하기 전까지 문서상의 명령이다",
  "watch_outs": ["이름 충돌", "라이선스 불일치", "OS·로케일 의존 가능성 등"],
  "writing_notes": ["글에서 쓰면 안 되는 수치나 표현"]
}
```
