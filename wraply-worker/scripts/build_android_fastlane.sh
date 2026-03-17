#!/usr/bin/env bash
set -euo pipefail

JOB_ID="${1:-}"
SAFE_NAME="${2:-}"
PACKAGE_NAME="${3:-}"
APP_NAME="${4:-}"
URL="${5:-}"

echo "===== BUILD SCRIPT START ====="
echo "JOB_ID=$JOB_ID"
echo "SAFE_NAME=$SAFE_NAME"
echo "PACKAGE_NAME=$PACKAGE_NAME"
echo "APP_NAME=$APP_NAME"
echo "URL=$URL"

if [[ -z "$JOB_ID" || -z "$SAFE_NAME" || -z "$PACKAGE_NAME" || -z "$APP_NAME" || -z "$URL" ]]; then
  echo "❌ Usage: ./build_android_fastlane.sh <job_id> <safe_name> <package_name> <app_name> <url>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CI_ROOT="$(cd "$WORKER_ROOT/.." && pwd)"

PROJECT_DIR="$CI_ROOT/projects/android/$SAFE_NAME/$JOB_ID/source"
mkdir -p "$CI_ROOT/projects/android/$SAFE_NAME/$JOB_ID"

TMP_OUT="$CI_ROOT/builds/android/$SAFE_NAME/_tmp_$JOB_ID"
mkdir -p "$TMP_OUT"

SYNC_LOG="$TMP_OUT/sync.log"
PATCH_LOG="$TMP_OUT/patch.log"
BUILD_LOG="$TMP_OUT/build.log"

OUT_DIR=""
LOG_FILE=""

finalize_logs() {

  if [[ -n "${OUT_DIR:-}" && -d "${OUT_DIR:-}" ]]; then
    [[ -f "$SYNC_LOG" ]]  && mv "$SYNC_LOG"  "$OUT_DIR/sync.log" 2>/dev/null || true
    [[ -f "$PATCH_LOG" ]] && mv "$PATCH_LOG" "$OUT_DIR/patch.log" 2>/dev/null || true
    [[ -f "$BUILD_LOG" ]] && mv "$BUILD_LOG" "$OUT_DIR/build.log" 2>/dev/null || true
  fi

}

cleanup_tmp() {
  rm -rf "$TMP_OUT" 2>/dev/null || true
}

trap finalize_logs EXIT

# -------------------------------------------------------------------
# 1) template sync
# -------------------------------------------------------------------

echo "WRAPLY_STATE=PREPARING"

"$SCRIPT_DIR/sync_from_templates.sh" --platform android --safe "$SAFE_NAME" --job "$JOB_ID" --ci-root "$CI_ROOT" --log "$SYNC_LOG"

# -------------------------------------------------------------------
# 2) patch project
# -------------------------------------------------------------------

echo "WRAPLY_STATE=PATCHING"

(
  "$SCRIPT_DIR/patch_android.sh" \
  "$JOB_ID" \
  "$SAFE_NAME" \
  "$PACKAGE_NAME" \
  "$APP_NAME" \
  "$URL"
) > >(tee -a "$PATCH_LOG") 2>&1

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "❌ Project missing after sync: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

# -------------------------------------------------------------------
# 3) signing env 확인
# -------------------------------------------------------------------

if [[ -z "${ANDROID_KEYSTORE_PATH:-}" || -z "${ANDROID_KEY_ALIAS:-}" || -z "${ANDROID_STORE_PASSWORD:-}" || -z "${ANDROID_KEY_PASSWORD:-}" ]]; then
  echo "❌ Missing Android signing env"
  exit 1
fi

if [[ ! -f "$ANDROID_KEYSTORE_PATH" ]]; then
  echo "❌ Keystore file not found: $ANDROID_KEYSTORE_PATH"
  exit 1
fi

KEY_PROPERTIES_PATH="$PROJECT_DIR/key.properties"

cat > "$KEY_PROPERTIES_PATH" <<EOF
storeFile=$ANDROID_KEYSTORE_PATH
storePassword=$ANDROID_STORE_PASSWORD
keyAlias=$ANDROID_KEY_ALIAS
keyPassword=$ANDROID_KEY_PASSWORD
EOF

chmod 600 "$KEY_PROPERTIES_PATH" 2>/dev/null || true

# -------------------------------------------------------------------
# 4) version 추출
# -------------------------------------------------------------------

GRADLE_FILE="$(ls app/build.gradle app/build.gradle.kts 2>/dev/null | head -n 1 || true)"

if [[ -z "$GRADLE_FILE" ]]; then
  echo "❌ app/build.gradle(.kts) not found"
  exit 1
fi

VERSION_NAME="$(grep -E 'versionName' "$GRADLE_FILE" | head -n1 | sed -E 's/.*["= ]+([^"]+)["]?.*/\1/' || true)"
VERSION_CODE="$(grep -E 'versionCode' "$GRADLE_FILE" | head -n1 | grep -oE '[0-9]+' || true)"

[[ -z "$VERSION_NAME" ]] && VERSION_NAME="0.0.0"
[[ -z "$VERSION_CODE" ]] && VERSION_CODE="0"

VERSION="${VERSION_NAME}_${VERSION_CODE}"

OUT_DIR="$CI_ROOT/builds/android/$SAFE_NAME/$VERSION"
mkdir -p "$OUT_DIR"

echo "OUTPUT_DIR=builds/android/$SAFE_NAME/$VERSION"

finalize_logs

LOG_FILE="$OUT_DIR/build.log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "🤖 Android Fastlane Build"
echo "📦 SAFE_NAME: $SAFE_NAME"
echo "📦 PACKAGE: $PACKAGE_NAME"
echo "📌 VERSION: $VERSION"
echo "📁 OUTPUT: $OUT_DIR"
echo "📄 GRADLE_FILE: $GRADLE_FILE"

# -------------------------------------------------------------------
# 5) fastlane build
# -------------------------------------------------------------------

echo "WRAPLY_STATE=BUILDING"

if [[ ! -f "fastlane/Fastfile" ]]; then
  echo "❌ fastlane/Fastfile not found"
  exit 1
fi

echo "📦 Installing Ruby gems"

bundle config set path vendor/bundle
bundle install

echo "🚀 Running Fastlane"

bundle exec fastlane android release

# -------------------------------------------------------------------
# 6) build outputs 탐색
# -------------------------------------------------------------------

echo "WRAPLY_STATE=UPLOADING"

echo "🔍 Searching build outputs"

AAB_SRC="$(find . -type f -name '*.aab' | head -n 1 || true)"
APK_SRC="$(find . -type f -name '*.apk' | head -n 1 || true)"

echo "📦 Detected outputs:"
echo "  - AAB: ${AAB_SRC:-"(none)"}"
echo "  - APK: ${APK_SRC:-"(none)"}"

if [[ -z "$AAB_SRC" && -z "$APK_SRC" ]]; then
  echo "❌ No outputs found (.aab/.apk)"
  exit 1
fi

if [[ -n "$AAB_SRC" ]]; then
  cp "$AAB_SRC" "$OUT_DIR/app-release.aab"
  echo "WRAPLY_ARTIFACT=$OUT_DIR/app-release.aab"
fi

if [[ -n "$APK_SRC" ]]; then
  cp "$APK_SRC" "$OUT_DIR/app-release.apk"
  echo "WRAPLY_ARTIFACT=$OUT_DIR/app-release.apk"
fi

cleanup_tmp

echo "WRAPLY_STATE=FINISHED"

echo "✅ Build completed"