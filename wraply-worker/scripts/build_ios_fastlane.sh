#!/bin/bash
set -euo pipefail

SAFE_NAME="${1:-}"
SCHEME="${2:-}"
BUNDLE_ID="${3:-}"
APP_NAME="${4:-}"
SERVICE_URL="${5:-}"

if [[ -z "$SAFE_NAME" || -z "$SCHEME" || -z "$BUNDLE_ID" || -z "$APP_NAME" || -z "$SERVICE_URL" ]]; then
  echo "❌ Usage: ./build_ios_fastlane.sh <safe_name> <scheme> <bundle_id> <app_name> <service_url>"
  exit 1
fi

CI_ROOT="$(pwd)"
PROJECT_DIR="$CI_ROOT/projects/ios/$SAFE_NAME/source"

TMP_OUT="$CI_ROOT/builds/ios/$SAFE_NAME/_tmp"
mkdir -p "$TMP_OUT"
SYNC_LOG="$TMP_OUT/sync.log"
PATCH_LOG="$TMP_OUT/patch.log"

"$CI_ROOT/scripts/sync_from_templates.sh" --platform ios --safe "$SAFE_NAME" --ci-root "$CI_ROOT" --log "$SYNC_LOG"

( "$CI_ROOT/scripts/patch_ios.sh" "$SAFE_NAME" "$BUNDLE_ID" "$APP_NAME" "$SERVICE_URL" ) > >(tee -a "$PATCH_LOG") 2>&1

cd "$PROJECT_DIR"

# workspace/project 결정
if [[ -f "Podfile" ]]; then
  BUILD_TARGET="$(find . -maxdepth 2 -type d -name "*.xcworkspace" ! -path "*.xcodeproj/*" | head -n 1 || true)"
  [[ -z "$BUILD_TARGET" ]] && echo "❌ Podfile exists but .xcworkspace not found" && exit 1
  TARGET_FLAG=(-workspace "$BUILD_TARGET")
else
  BUILD_TARGET="$(find . -maxdepth 2 -type d -name "*.xcodeproj" | head -n 1 || true)"
  [[ -z "$BUILD_TARGET" ]] && echo "❌ .xcodeproj not found" && exit 1
  TARGET_FLAG=(-project "$BUILD_TARGET")
fi

VERSION="$(xcodebuild "${TARGET_FLAG[@]}" -scheme "$SCHEME" -showBuildSettings | grep MARKETING_VERSION | head -n1 | awk '{print $3}')"
BUILD_NUMBER="$(xcodebuild "${TARGET_FLAG[@]}" -scheme "$SCHEME" -showBuildSettings | grep CURRENT_PROJECT_VERSION | head -n1 | awk '{print $3}')"
[[ -z "$VERSION" || -z "$BUILD_NUMBER" ]] && echo "❌ Failed to extract version/build" && exit 1

OUT_DIR="$CI_ROOT/builds/ios/$SAFE_NAME/${VERSION}_${BUILD_NUMBER}"
mkdir -p "$OUT_DIR"

mv "$SYNC_LOG" "$OUT_DIR/sync.log" 2>/dev/null || true
mv "$PATCH_LOG" "$OUT_DIR/patch.log" 2>/dev/null || true
LOG_FILE="$OUT_DIR/build.log"

exec > >(tee -a "$LOG_FILE") 2>&1
echo "🍎 iOS Fastlane Build"
echo "📦 $SAFE_NAME / $BUNDLE_ID"
echo "🎯 scheme: $SCHEME"
echo "📌 Output: $OUT_DIR"

if [[ ! -f "fastlane/Fastfile" ]]; then
  echo "❌ fastlane/Fastfile not found"
  exit 1
fi

bundle exec fastlane ios release scheme:"$SCHEME" output_dir:"$OUT_DIR"

IPA_PATH="$(ls "$OUT_DIR"/*.ipa 2>/dev/null | head -n 1 || true)"
[[ -z "$IPA_PATH" ]] && echo "❌ IPA not found in $OUT_DIR" && exit 1

rm -rf "$TMP_OUT" 2>/dev/null || true

echo "✅ Done"
echo "OUTPUT_DIR=builds/ios/$SAFE_NAME/${VERSION}_${BUILD_NUMBER}" # for GitHub Actions