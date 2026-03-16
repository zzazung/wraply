#!/bin/bash
set -euo pipefail

JOB_ID="${1:-}"
SAFE_NAME="${2:-}"
PACKAGE_NAME="${3:-}"
APP_NAME="${4:-}"
SERVICE_URL="${5:-}"

if [[ -z "$JOB_ID" || -z "$SAFE_NAME" || -z "$PACKAGE_NAME" || -z "$APP_NAME" || -z "$SERVICE_URL" ]]; then
  echo "❌ Usage: ./patch_android.sh <job_id> <safe_name> <package_name> <app_name> <service_url>"
  exit 1
fi

CI_ROOT="$(pwd)"
SRC="$CI_ROOT/projects/android/$SAFE_NAME/$JOB_ID/source"

if [[ ! -d "$SRC" ]]; then
  echo "❌ Project not found: $SRC"
  exit 1
fi

# patch.log는 호출하는 build 스크립트에서 OUT_DIR 만든 후 넘기는게 가장 좋지만,
# 여기선 기본 경로로 둠 (build 스크립트에서 redirect 권장)
echo "🤖 Android patch"
echo "📛 package: $PACKAGE_NAME"
echo "🏷 appName: $APP_NAME"
echo "🌐 url: $SERVICE_URL"

# 1) applicationId 변경 (build.gradle or kts)
GRADLE_FILE="$(ls "$SRC/app/build.gradle" "$SRC/app/build.gradle.kts" 2>/dev/null | head -n 1 || true)"
if [[ -z "$GRADLE_FILE" ]]; then
  echo "❌ build.gradle(.kts) not found"
  exit 1
fi

# 기존 applicationId가 있으면 교체, 없으면 defaultConfig 블록에 추가(단순 케이스)
if grep -qE 'applicationId' "$GRADLE_FILE"; then
  perl -pi -e "s/applicationId\\s*=?\\s*\"[^\"]+\"/applicationId = \"$PACKAGE_NAME\"/g" "$GRADLE_FILE"
else
  # 최소한의 안전: defaultConfig 아래에 삽입(복잡한 gradle은 템플릿 고정 권장)
  perl -0777 -pi -e "s/(defaultConfig\\s*\\{\\s*)/\$1\\n        applicationId = \"$PACKAGE_NAME\"\\n/sg" "$GRADLE_FILE"
fi

# 2) App name (strings.xml)
STRINGS_XML="$(find "$SRC/app/src/main/res" -name strings.xml | head -n 1 || true)"
if [[ -n "$STRINGS_XML" ]]; then
  perl -pi -e "s#(<string\\s+name=\"app_name\">)([^<]*)(</string>)#\$1$APP_NAME\$3#g" "$STRINGS_XML"
fi

# 3) URL 플레이스홀더 치환 (템플릿에 __WRAPLY_URL__ 넣어두기 권장)
# 템플릿 전체에서 __WRAPLY_URL__ 치환
grep -RIl "__WRAPLY_URL__" "$SRC" | while read -r f; do
  perl -pi -e "s#__WRAPLY_URL__#$SERVICE_URL#g" "$f"
done

echo "✅ Android patch done"