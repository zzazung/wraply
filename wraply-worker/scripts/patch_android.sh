#!/bin/bash
set -euo pipefail

JOB_ID="${1:-}"
TENANT_ID="${2:-}"
SAFE_NAME="${3:-}"
PACKAGE_NAME="${4:-}"
APP_NAME="${5:-}"
SERVICE_URL="${6:-}"

if [[ -z "$JOB_ID" || -z "$TENANT_ID" || -z "$SAFE_NAME" || -z "$PACKAGE_NAME" || -z "$APP_NAME" || -z "$SERVICE_URL" ]]; then
  echo "❌ Usage: ./patch_android.sh <job_id> <tenant_id> <safe_name> <package_name> <app_name> <service_url>"
  exit 1
fi

CI_ROOT="$(pwd)"

SRC="$CI_ROOT/projects/$TENANT_ID/android/$SAFE_NAME/$JOB_ID/source"

if [[ ! -d "$SRC" ]]; then
  echo "❌ Project not found: $SRC"
  exit 1
fi

echo "🤖 Android patch"
echo "🏢 tenant: $TENANT_ID"
echo "📛 package: $PACKAGE_NAME"
echo "🏷 appName: $APP_NAME"
echo "🌐 url: $SERVICE_URL"

# -------------------------------------------------
# 1) applicationId 변경
# -------------------------------------------------

GRADLE_FILE="$(ls "$SRC/app/build.gradle" "$SRC/app/build.gradle.kts" 2>/dev/null | head -n 1 || true)"

if [[ -z "$GRADLE_FILE" ]]; then
  echo "❌ build.gradle(.kts) not found"
  exit 1
fi

if grep -qE 'applicationId' "$GRADLE_FILE"; then
  perl -pi -e "s/applicationId\\s*=?\\s*\"[^\"]+\"/applicationId = \"$PACKAGE_NAME\"/g" "$GRADLE_FILE"
else
  perl -0777 -pi -e "s/(defaultConfig\\s*\\{\\s*)/\$1\\n        applicationId = \"$PACKAGE_NAME\"\\n/sg" "$GRADLE_FILE"
fi

# -------------------------------------------------
# 2) App name 변경
# -------------------------------------------------

STRINGS_XML="$(find "$SRC/app/src/main/res" -name strings.xml | head -n 1 || true)"

if [[ -n "$STRINGS_XML" ]]; then
  perl -pi -e "s#(<string\\s+name=\"app_name\">)([^<]*)(</string>)#\$1$APP_NAME\$3#g" "$STRINGS_XML"
fi

# -------------------------------------------------
# 3) URL 치환
# -------------------------------------------------

grep -RIl "__WRAPLY_URL__" "$SRC" | while read -r f; do
  perl -pi -e "s#__WRAPLY_URL__#$SERVICE_URL#g" "$f"
done

echo "✅ Android patch done"