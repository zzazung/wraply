#!/usr/bin/env bash
set -euo pipefail

JOB_ID="${1:-}"
TENANT_ID="${2:-}"
SAFE_NAME="${3:-}"
BUNDLE_ID="${4:-}"
APP_NAME="${5:-}"
SERVICE_URL="${6:-}"

if [[ -z "$JOB_ID" || -z "$TENANT_ID" || -z "$SAFE_NAME" || -z "$BUNDLE_ID" || -z "$APP_NAME" || -z "$SERVICE_URL" ]]; then
  echo "❌ Usage: ./patch_ios.sh <job_id> <tenant_id> <safe_name> <bundle_id> <app_name> <service_url>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CI_ROOT="$(cd "$WORKER_ROOT/.." && pwd)"

SRC="$CI_ROOT/projects/$TENANT_ID/ios/$SAFE_NAME/$JOB_ID/source"

if [[ ! -d "$SRC" ]]; then
  echo "❌ Project not found: $SRC"
  exit 1
fi

echo "🍎 iOS patch"
echo "🏢 tenant: $TENANT_ID"
echo "📛 bundle: $BUNDLE_ID"
echo "🏷 appName: $APP_NAME"
echo "🌐 url: $SERVICE_URL"

PBXPROJ="$(find "$SRC" -name project.pbxproj | head -n 1 || true)"

if [[ -z "$PBXPROJ" ]]; then
  echo "❌ project.pbxproj not found"
  exit 1
fi

# -------------------------------------------------
# 1) bundle id 변경
# -------------------------------------------------

perl -pi -e "s/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/PRODUCT_BUNDLE_IDENTIFIER = $BUNDLE_ID;/g" "$PBXPROJ"

# -------------------------------------------------
# 2) app name 변경
# -------------------------------------------------

INFO_PLIST="$(find "$SRC" -maxdepth 4 -name Info.plist | head -n 1 || true)"

if [[ -n "$INFO_PLIST" ]]; then

  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $APP_NAME" "$INFO_PLIST" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string $APP_NAME" "$INFO_PLIST"

fi

# -------------------------------------------------
# 3) URL placeholder 치환
# -------------------------------------------------

grep -RIl "__WRAPLY_URL__" "$SRC" | while read -r f; do
  perl -pi -e "s#__WRAPLY_URL__#$SERVICE_URL#g" "$f"
done

echo "✅ iOS patch done"