// wraply-worker/patch/android/version.js

const path = require("path");
const fs = require("fs");

const { safeWrite } = require("../../lib/file");
const { publishLog } = require("../../bus/logBus");

module.exports = function applyVersionAndroid(projectDir, settings, jobId, tenantId){

  const gradlePath = path.join(projectDir, "app/build.gradle");

  if (!fs.existsSync(gradlePath)) return;

  let gradle = fs.readFileSync(gradlePath, "utf-8");

  if (settings.versionName){
    gradle = gradle.replace(
      /versionName\s+"[^"]+"/,
      `versionName "${settings.versionName}"`
    );
  }

  if (settings.versionCode){
    gradle = gradle.replace(
      /versionCode\s+\d+/,
      `versionCode ${settings.versionCode}`
    );
  }

  safeWrite(gradlePath, gradle);

  publishLog(jobId, tenantId,
    `[patch] version → ${settings.versionName} (${settings.versionCode})`
  );

};