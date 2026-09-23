#!/usr/bin/env bash
# tests/security/test_wp_role.sh
#
# blogbot 계정으로 status:publish 요청을 보내서 거부되는지 확인한다.
# 통과 = 403 또는 rest_cannot_publish 류 에러가 와야 정상.
# 200/201이 오면 3차 방어가 뚫린 것이므로 절대 다음 단계로 넘어가면 안 된다.
#
# 사용법: WP_URL, WP_USER, WP_APP_PASSWORD를 .env에서 읽어와 실행
#   set -a; source .env; set +a; bash tests/security/test_wp_role.sh

set -euo pipefail

if [[ -z "${WP_URL:-}" || -z "${WP_USER:-}" || -z "${WP_APP_PASSWORD:-}" ]]; then
  echo "WP_URL, WP_USER, WP_APP_PASSWORD 환경변수가 필요합니다."
  echo "예: set -a; source .env; set +a; bash $0"
  exit 1
fi

echo "== blogbot으로 publish 시도 (거부되어야 정상) =="

RESPONSE=$(curl -s -w "\n%{http_code}" -u "${WP_USER}:${WP_APP_PASSWORD}" \
  -H "Content-Type: application/json" \
  -X POST "${WP_URL%/}/wp-json/wp/v2/posts" \
  -d '{"title":"test_wp_role permission check","content":"should not publish","status":"publish"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP 상태 코드: $HTTP_CODE"
echo "응답 본문: $BODY"
echo

if [[ "$HTTP_CODE" == "201" ]]; then
  echo "❌ FAIL — 글이 실제로 게시됐습니다. 3차 방어(WordPress 권한)가 뚫려 있습니다."
  echo "   blogbot 역할에 publish_posts가 있는지 즉시 확인하세요."
  echo "   방금 생성된 글은 워드프레스 관리자에서 수동으로 지워야 합니다."
  exit 1
elif [[ "$HTTP_CODE" == "403" ]] || echo "$BODY" | grep -qi "cannot_publish\|forbidden\|rest_cannot"; then
  echo "✅ PASS — publish 요청이 거부됐습니다. 3차 방어가 정상 작동합니다."
  exit 0
else
  echo "⚠️  예상치 못한 응답입니다. 200/201/403이 아닌 다른 상태입니다."
  echo "   BODY를 직접 읽어보고 원인을 확인하세요 (인증 실패 등 다른 문제일 수 있음)."
  exit 2
fi
