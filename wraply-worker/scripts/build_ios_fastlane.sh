#!/usr/bin/env bash
set -euo pipefail

# rbenv 초기화
export RBENV_ROOT="$HOME/.rbenv"
export PATH="$RBENV_ROOT/bin:$PATH"

if command -v rbenv >/dev/null 2>&1; then
  eval "$(rbenv init - bash)"
fi

echo "PATH=$PATH"
which fastlane || true
fastlane --version || true

JOB_ID="${1:-}"
SAFE_NAME="${2:-}"
BUNDLE_ID="${3:-}"
APP_NAME="${4:-}"
URL="${5:-}"

if [[ -z "$JOB_ID" || -z "$SAFE_NAME" || -z "$BUNDLE_ID" || -z "$APP_NAME" || -z "$URL" ]]; then
  echo "❌ Usage: ./build_ios_fastlane.sh <job_id> <safe_name> <bundle_id> <app_name> <url>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CI_ROOT="$(cd "$WORKER_ROOT/.." && pwd)"

PROJECT_DIR="$CI_ROOT/projects/ios/$SAFE_NAME/$JOB_ID/source"
mkdir -p "$CI_ROOT/projects/ios/$SAFE_NAME/$JOB_ID"

# -------------------------------------------------
# keychain setup (multi build safe)
# -------------------------------------------------

KEYCHAIN_NAME="wraply_${JOB_ID}.keychain"
KEYCHAIN_PASSWORD="wraply"

echo "🔐 Creating temp keychain: $KEYCHAIN_NAME"

# security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

# security set-keychain-settings -lut 21600 "$KEYCHAIN_NAME"

# security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

# # keychain search list 추가
# security list-keychains -s "$KEYCHAIN_NAME" login.keychain

KEYCHAIN_PATH="$HOME/Library/Keychains/$KEYCHAIN_NAME"

security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"
security set-keychain-settings -lut 21600 "$KEYCHAIN_NAME"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

security list-keychains -d user -s \
"$KEYCHAIN_PATH" \
"$HOME/Library/Keychains/login.keychain-db" \
"/Library/Keychains/System.keychain"

security default-keychain -s "$KEYCHAIN_PATH"

# fastlane keychain 환경 변수
export MATCH_KEYCHAIN_NAME="$KEYCHAIN_NAME"
export MATCH_KEYCHAIN_PASSWORD="$KEYCHAIN_PASSWORD"
export FASTLANE_KEYCHAIN_NAME="$KEYCHAIN_NAME"
export FASTLANE_KEYCHAIN_PASSWORD="$KEYCHAIN_PASSWORD"

# -------------------------------------------------
# 0) tmp logs
# -------------------------------------------------

TMP_OUT="$CI_ROOT/builds/ios/$SAFE_NAME/_tmp_$JOB_ID"
mkdir -p "$TMP_OUT"

SYNC_LOG="$TMP_OUT/sync.log"
PATCH_LOG="$TMP_OUT/patch.log"
BUILD_LOG="$TMP_OUT/build.log"

OUT_DIR=""
LOG_FILE=""

finalize_logs() {

  if [[ -n "${OUT_DIR:-}" && -d "${OUT_DIR:-}" ]]; then

    [[ -f "$SYNC_LOG" ]] && mv "$SYNC_LOG" "$OUT_DIR/sync.log" 2>/dev/null || true
    [[ -f "$PATCH_LOG" ]] && mv "$PATCH_LOG" "$OUT_DIR/patch.log" 2>/dev/null || true
    [[ -f "$BUILD_LOG" ]] && mv "$BUILD_LOG" "$OUT_DIR/build.log" 2>/dev/null || true

  fi

}

cleanup_tmp() {
  rm -rf "$TMP_OUT" 2>/dev/null || true
  security delete-keychain "$KEYCHAIN_NAME" 2>/dev/null || true
}

trap finalize_logs EXIT

# -------------------------------------------------
# 1) template sync
# -------------------------------------------------

echo "WRAPLY_STATE=PREPARING"

"$SCRIPT_DIR/sync_from_templates.sh" \
  --platform ios \
  --safe "$SAFE_NAME" \
  --job "$JOB_ID" \
  --ci-root "$CI_ROOT" \
  --log "$SYNC_LOG"

# -------------------------------------------------
# 2) patch project
# -------------------------------------------------

echo "WRAPLY_STATE=PATCHING"

(
  "$SCRIPT_DIR/patch_ios.sh" \
  "$JOB_ID" \
  "$SAFE_NAME" \
  "$BUNDLE_ID" \
  "$APP_NAME" \
  "$URL"
) > >(tee -a "$PATCH_LOG") 2>&1

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "❌ Project missing after sync: $PROJECT_DIR"
  exit 1
fi

cd "$PROJECT_DIR"

# -------------------------------------------------
# 3) workspace / project detection
# -------------------------------------------------

if [[ -f "Podfile" ]]; then
  BUILD_TARGET="$(find . -maxdepth 2 -type d -name "*.xcworkspace" ! -path "*.xcodeproj/*" | head -n 1 || true)"
  [[ -z "$BUILD_TARGET" ]] && echo "❌ Podfile exists but workspace not found" && exit 1
  TARGET_FLAG=(-workspace "$BUILD_TARGET")
else
  BUILD_TARGET="$(find . -maxdepth 2 -type d -name "*.xcodeproj" | head -n 1 || true)"
  [[ -z "$BUILD_TARGET" ]] && echo "❌ xcodeproj not found" && exit 1
  TARGET_FLAG=(-project "$BUILD_TARGET")
fi

# -------------------------------------------------
# 4) version extract
# -------------------------------------------------

VERSION="$(xcodebuild "${TARGET_FLAG[@]}" -showBuildSettings | grep MARKETING_VERSION | head -n1 | awk '{print $3}')"
BUILD_NUMBER="$(xcodebuild "${TARGET_FLAG[@]}" -showBuildSettings | grep CURRENT_PROJECT_VERSION | head -n1 | awk '{print $3}')"

if [[ -z "$VERSION" || -z "$BUILD_NUMBER" ]]; then
  echo "❌ Failed to extract version/build"
  exit 1
fi

VERSION_DIR="${VERSION}_${BUILD_NUMBER}"

OUT_DIR="$CI_ROOT/builds/ios/$SAFE_NAME/$VERSION_DIR"
mkdir -p "$OUT_DIR"

# worker에 version 전달
echo "OUTPUT_DIR=builds/ios/$SAFE_NAME/$VERSION_DIR"

finalize_logs

LOG_FILE="$OUT_DIR/build.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🍎 iOS Fastlane Build"
echo "📦 SAFE_NAME: $SAFE_NAME"
echo "📦 BUNDLE_ID: $BUNDLE_ID"
echo "📌 VERSION: $VERSION_DIR"
echo "📁 OUTPUT: $OUT_DIR"

# -------------------------------------------------
# 5) fastlane build
# -------------------------------------------------

echo "WRAPLY_STATE=BUILDING"

FASTLANE_BIN="$(command -v fastlane)"

if [[ -z "$FASTLANE_BIN" ]]; then
  echo "❌ fastlane not found"
  exit 1
fi

echo "Using fastlane: $FASTLANE_BIN"
echo "APP_IDENTIFIER=$BUNDLE_ID"
echo "SCHEME=$APP_NAME"

export BUNDLE_IDENTIFIER="$BUNDLE_ID"
export SCHEME="$APP_NAME"

"$FASTLANE_BIN" ios release output_dir:"$OUT_DIR"

echo "WRAPLY_STATE=SIGNING"

# -------------------------------------------------
# 6) artifact search
# -------------------------------------------------

echo "WRAPLY_STATE=UPLOADING"

IPA_SRC="$(find "$OUT_DIR" -type f -name "*.ipa" | head -n 1 || true)"

if [[ -z "$IPA_SRC" ]]; then
  echo "❌ IPA not found"
  exit 1
fi

echo "WRAPLY_ARTIFACT=$IPA_SRC"

# -------------------------------------------------
# 7) cleanup
# -------------------------------------------------

cleanup_tmp

echo "WRAPLY_STATE=FINISHED"
echo "✅ iOS Build completed"