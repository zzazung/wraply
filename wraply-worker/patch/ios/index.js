// wraply-worker/patch/ios.js

const fs = require("fs");
const path = require("path");

function applyIOSPatches(iosPath, settings, jobId, tenantId) {

  const config = settings?.target?.config || {};

  const {
    bundleId,
    displayName,
    versionName = "1.0.0",
    buildNumber = "1"
  } = config;

  console.log("[patch][ios]", config);

  /* ----------------------------------
     Info.plist 수정 (예시)
  ---------------------------------- */

  const plistPath = path.join(iosPath, "App", "Info.plist");

  if (!fs.existsSync(plistPath)) {
    console.warn("[patch][ios] plist not found:", plistPath);
    return;
  }

  let plist = fs.readFileSync(plistPath, "utf8");

  if (displayName) {
    plist = plist.replace(
      /<key>CFBundleDisplayName<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleDisplayName</key><string>${displayName}</string>`
    );
  }

  if (versionName) {
    plist = plist.replace(
      /<key>CFBundleShortVersionString<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleShortVersionString</key><string>${versionName}</string>`
    );
  }

  if (buildNumber) {
    plist = plist.replace(
      /<key>CFBundleVersion<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleVersion</key><string>${buildNumber}</string>`
    );
  }

  fs.writeFileSync(plistPath, plist);

  /* ----------------------------------
     bundleId (xcodeproj 수정 필요)
     → 간단 예시는 env로 처리 추천
  ---------------------------------- */

  if (bundleId) {
    console.log("[patch][ios] bundleId override:", bundleId);
  }

}

module.exports = { applyIOSPatches };