// patch/android/splashLottie.js

const path = require("path");
const fs = require("fs");

const { readAsset } = require("../../lib/asset");
const { publishLog } = require("../../bus/logBus");

module.exports = function applySplashLottie(projectDir, settings, jobId, tenantId){

  const filePath = settings?.assets?.splashLottiePath;
  if (!filePath) return;

  const buffer = readAsset(filePath);

  const dest = path.join(
    projectDir,
    "app/src/main/assets/splash.json"
  );

  fs.mkdirSync(path.dirname(dest), { recursive:true });
  fs.writeFileSync(dest, buffer);

  publishLog(jobId, tenantId, "[patch] splash lottie applied");

};