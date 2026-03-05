#!/bin/bash
set -euo pipefail
shopt -s globstar nullglob

SAFE_NAME="${1:-}"
PACKAGE_NAME="${2:-}"
APP_NAME="${3:-}"
SERVICE_URL="${4:-}"

if [[ -z "$SAFE_NAME" || -z "$PACKAGE_NAME" || -z "$APP_NAME" || -z "$SERVICE_URL" ]]; then
  echo "❌ Usage: ./build_android_fastlane.sh <safe_name> <package_name> <app_name> <service_url>"
  exit 1
fi

CI_ROOT="$(pwd)"
PROJECT_DIR="$CI_ROOT/projects/android/$SAFE_NAME/source"

# -------------------------------------------------------------------
# 0) 임시 로그 경로 (sync/patch/build) + 실패 대응(trap)
# -------------------------------------------------------------------
TMP_OUT="$CI_ROOT/builds/android/$SAFE_NAME/_tmp"
mkdir -p "$TMP_OUT"
SYNC_LOG="$TMP_OUT/sync.log"
PATCH_LOG="$TMP_OUT/patch.log"
BUILD_LOG="$TMP_OUT/build.log" # OUT_DIR 확정 전 임시 build log (필요시)

OUT_DIR=""      # version 추출 후 확정
LOG_FILE=""     # OUT_DIR/build.log

finalize_logs() {
  # OUT_DIR가 확정되었으면 TMP 로그를 옮긴다(성공/실패 모두)
  if [[ -n "${OUT_DIR:-}" && -d "${OUT_DIR:-}" ]]; then
    [[ -f "$SYNC_LOG" ]]  && mv "$SYNC_LOG"  "$OUT_DIR/sync.log"  2>/dev/null || true
    [[ -f "$PATCH_LOG" ]] && mv "$PATCH_LOG" "$OUT_DIR/patch.log" 2>/dev/null || true
    [[ -f "$BUILD_LOG" ]] && mv "$BUILD_LOG" "$OUT_DIR/build.log" 2>/dev/null || true
  fi
}
cleanup_tmp() {
  rm -rf "$TMP_OUT" 2>/dev/null || true
}

on_exit() {
  # set -e 환경에서 실패해도 최대한 로그를 남기기
  finalize_logs
  # tmp는 성공 시에만 지우고 싶다면 여기서 지우지 말고 성공 후에만 cleanup_tmp 호출
}
trap on_exit EXIT

# -------------------------------------------------------------------
# 1) sync
# -------------------------------------------------------------------
"$CI_ROOT/scripts/sync_from_templates.sh" \
  --platform android \
  --safe "$SAFE_NAME" \
  --ci-root "$CI_ROOT" \
  --log "$SYNC_LOG"

# -------------------------------------------------------------------
# 2) patch
# -------------------------------------------------------------------
( "$CI_ROOT/scripts/patch_android.sh" "$SAFE_NAME" "$PACKAGE_NAME" "$APP_NAME" "$SERVICE_URL" ) \
  > >(tee -a "$PATCH_LOG") 2>&1

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "❌ Project missing after sync: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

# -------------------------------------------------------------------
# 2.5) ✅ signing env 검증 + key.properties 생성 (운영형)
# -------------------------------------------------------------------
# worker/jobRunner에서 env로 주입되어야 함:
# ANDROID_KEYSTORE_PATH, ANDROID_KEY_ALIAS, ANDROID_STORE_PASSWORD, ANDROID_KEY_PASSWORD
if [[ -z "${ANDROID_KEYSTORE_PATH:-}" || -z "${ANDROID_KEY_ALIAS:-}" || -z "${ANDROID_STORE_PASSWORD:-}" || -z "${ANDROID_KEY_PASSWORD:-}" ]]; then
  echo "❌ Missing Android signing env."
  echo "   Required: ANDROID_KEYSTORE_PATH ANDROID_KEY_ALIAS ANDROID_STORE_PASSWORD ANDROID_KEY_PASSWORD"
  exit 1
fi

if [[ ! -f "$ANDROID_KEYSTORE_PATH" ]]; then
  echo "❌ Keystore file not found: $ANDROID_KEYSTORE_PATH"
  exit 1
fi

# key.properties는 Gradle rootProject에서 읽는다.
KEY_PROPERTIES_PATH="$PROJECT_DIR/key.properties"

cat > "$KEY_PROPERTIES_PATH" <<EOF
storeFile=$ANDROID_KEYSTORE_PATH
storePassword=$ANDROID_STORE_PASSWORD
keyAlias=$ANDROID_KEY_ALIAS
keyPassword=$ANDROID_KEY_PASSWORD
EOF

# 권한 최소화(선택)
chmod 600 "$KEY_PROPERTIES_PATH" 2>/dev/null || true

# -------------------------------------------------------------------
# 3) version 추출
# -------------------------------------------------------------------
GRADLE_FILE="$(ls app/build.gradle app/build.gradle.kts 2>/dev/null | head -n 1 || true)"
if [[ -z "$GRADLE_FILE" ]]; then
  echo "❌ app/build.gradle(.kts) not found"
  exit 1
fi

VERSION_NAME="$(grep -E 'versionName' "$GRADLE_FILE" | head -n1 | sed -E 's/.*"([^"]+)".*/\1/' || true)"
VERSION_CODE="$(grep -E 'versionCode' "$GRADLE_FILE" | head -n1 | grep -oE '[0-9]+' || true)"

if [[ -z "$VERSION_NAME" || -z "$VERSION_CODE" ]]; then
  echo "❌ Failed to extract versionName/versionCode"
  exit 1
fi

OUT_DIR="$CI_ROOT/builds/android/$SAFE_NAME/${VERSION_NAME}_${VERSION_CODE}"
mkdir -p "$OUT_DIR"

# tmp 로그를 우선 OUT_DIR로 이동(가능한 빨리 남기기)
finalize_logs

# 이제부터 build log는 OUT_DIR에 누적
LOG_FILE="$OUT_DIR/build.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🤖 Android Fastlane Build"
echo "📦 $SAFE_NAME / $PACKAGE_NAME"
echo "📌 Output: $OUT_DIR"
echo "🔐 Signing: alias=$ANDROID_KEY_ALIAS, keystore=$(basename "$ANDROID_KEYSTORE_PATH")"

# -------------------------------------------------------------------
# 4) build (fastlane)
# -------------------------------------------------------------------
if [[ ! -f "fastlane/Fastfile" ]]; then
  echo "❌ fastlane/Fastfile not found"
  exit 1
fi

# Ruby deps가 없는 경우를 대비(운영에서는 템플릿에 bundle install 완료 권장)
bundle exec fastlane android release

# -------------------------------------------------------------------
# 5) outputs copy (✅ universal: module name may not be 'app')
# -------------------------------------------------------------------

# newest file finder (mtime 기준)
find_latest() {
  local pattern="$1"
  # macOS / Linux 공통 동작을 위해 ls -t 사용
  # glob이 안 맞으면 ls가 에러 → 2>/dev/null 처리
  ls -t $pattern 2>/dev/null | head -n 1 || true
}

# 1) 표준(app 모듈) 먼저
AAB_SRC="$(find_latest "app/build/outputs/bundle/**/release/*.aab")"
APK_SRC="$(find_latest "app/build/outputs/apk/**/release/*.apk")"

# 2) 모듈명이 app이 아닐 수 있으니 1-depth 모듈 전체 탐색
if [[ -z "$AAB_SRC" ]]; then
  AAB_SRC="$(find_latest "*/build/outputs/bundle/**/release/*.aab")"
fi
if [[ -z "$APK_SRC" ]]; then
  APK_SRC="$(find_latest "*/build/outputs/apk/**/release/*.apk")"
fi

# 3) 최후 안전망: 더 깊게 탐색 (성능 부담은 있지만 outputs 디렉토리만 타격)
if [[ -z "$AAB_SRC" ]]; then
  AAB_SRC="$(find_latest "**/build/outputs/bundle/**/release/*.aab")"
fi
if [[ -z "$APK_SRC" ]]; then
  APK_SRC="$(find_latest "**/build/outputs/apk/**/release/*.apk")"
fi

echo "📦 Detected outputs:"
echo "  - AAB: ${AAB_SRC:-"(none)"}"
echo "  - APK: ${APK_SRC:-"(none)"}"

if [[ -z "$AAB_SRC" && -z "$APK_SRC" ]]; then
  echo "❌ No outputs found (.aab/.apk)"
  exit 1
fi

# 이름 통일해서 OUT_DIR에 저장
[[ -n "$AAB_SRC" ]] && cp "$AAB_SRC" "$OUT_DIR/app-release.aab"
[[ -n "$APK_SRC" ]] && cp "$APK_SRC" "$OUT_DIR/app-release.apk"

# -------------------------------------------------------------------
# 6) 성공 시 tmp 정리
# -------------------------------------------------------------------
cleanup_tmp

echo "✅ Done"
echo "OUTPUT_DIR=builds/android/$SAFE_NAME/${VERSION_NAME}_${VERSION_CODE}" # for jobRunner parse