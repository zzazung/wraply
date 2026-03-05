#!/bin/bash
set -euo pipefail

SAFE_NAME="${1:-}"
BUNDLE_ID="${2:-}"
APP_NAME="${3:-}"
SERVICE_URL="${4:-}"

if [[ -z "$SAFE_NAME" || -z "$BUNDLE_ID" || -z "$APP_NAME" || -z "$SERVICE_URL" ]]; then
  echo "❌ Usage: ./patch_ios.sh <safe_name> <bundle_id> <app_name> <service_url>"
  exit 1
fi

CI_ROOT="$(pwd)"
SRC="$CI_ROOT/projects/ios/$SAFE_NAME/source"

if [[ ! -d "$SRC" ]]; then
  echo "❌ Project not found: $SRC"
  exit 1
fi

echo "🍎 iOS patch"
echo "📛 bundle: $BUNDLE_ID"
echo "🏷 appName: $APP_NAME"
echo "🌐 url: $SERVICE_URL"

PBXPROJ="$(find "$SRC" -name project.pbxproj | head -n 1 || true)"
if [[ -z "$PBXPROJ" ]]; then
  echo "❌ project.pbxproj not found"
  exit 1
fi

# 1) 번들ID 교체 (가장 단순: 전체 PRODUCT_BUNDLE_IDENTIFIER를 동일 값으로 맞춤)
# 확장(extensions)까지 같이 바뀌는 게 싫으면, 템플릿에서 메인 타겟만 남기거나
# 별도 규칙을 적용해야 함. 지금은 Wraply MVP 기준으로 통일.
perl -pi -e "s/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/PRODUCT_BUNDLE_IDENTIFIER = $BUNDLE_ID;/g" "$PBXPROJ"

# 2) Display Name 변경 (Info.plist CFBundleDisplayName)
# 템플릿에서 Info.plist가 1개인 구조 권장
INFO_PLIST="$(find "$SRC" -maxdepth 4 -name Info.plist | head -n 1 || true)"
if [[ -n "$INFO_PLIST" ]]; then
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $APP_NAME" "$INFO_PLIST" 2>/dev/null \
    || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string $APP_NAME" "$INFO_PLIST"
fi

# 3) URL 플레이스홀더 치환
grep -RIl "__WRAPLY_URL__" "$SRC" | while read -r f; do
  perl -pi -e "s#__WRAPLY_URL__#$SERVICE_URL#g" "$f"
done

echo "✅ iOS patch done"