#!/bin/bash
set -euo pipefail

PLATFORM=""
SAFE_NAME=""
CI_ROOT=""
LOG_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform) PLATFORM="$2"; shift 2;;
    --safe) SAFE_NAME="$2"; shift 2;;
    --ci-root) CI_ROOT="$2"; shift 2;;
    --log) LOG_FILE="$2"; shift 2;;
    *) echo "❌ Unknown arg: $1"; exit 1;;
  esac
done

if [[ -z "$PLATFORM" || -z "$SAFE_NAME" || -z "$CI_ROOT" || -z "$LOG_FILE" ]]; then
  echo "❌ Usage: --platform <android|ios> --safe <safe_name> --ci-root <path> --log <log_file>"
  exit 1
fi

TEMPLATE_DIR="$CI_ROOT/templates/$PLATFORM/source"
DEST_DIR="$CI_ROOT/projects/$PLATFORM/$SAFE_NAME/source"

mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$DEST_DIR"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "🔄 Sync Native Template"
echo "🧩 platform: $PLATFORM"
echo "🔐 safe: $SAFE_NAME"
echo "📦 template: $TEMPLATE_DIR"
echo "📁 dest: $DEST_DIR"

if [[ ! -d "$TEMPLATE_DIR" ]]; then
  echo "❌ Template not found: $TEMPLATE_DIR"
  exit 1
fi

EXCLUDES=(
  "--exclude" "build"
  "--exclude" ".gradle"
  "--exclude" ".idea"
  "--exclude" ".DS_Store"
  "--exclude" "DerivedData"
  "--exclude" "Pods"
  "--exclude" ".swiftpm"
  "--exclude" ".xcodebuild"
  "--exclude" "*.xcarchive"
  "--exclude" "*.ipa"
  "--exclude" "*.apk"
  "--exclude" "*.aab"
)

rsync -a --delete "${EXCLUDES[@]}" "$TEMPLATE_DIR/" "$DEST_DIR/"

echo "✅ Sync completed"