// patch/android/splashImage.js

const path = require("path");
const fs = require("fs");

const { publishLog } = require("../../bus/logBus");

function readAsset(filePath){

  const abs = path.join(process.env.WRAPLY_ROOT, filePath);

  if (!fs.existsSync(abs)){
    throw new Error(`splash not found: ${filePath}`);
  }

  return fs.readFileSync(abs);

}

module.exports = function applySplashImageAndroid(projectDir, settings, jobId, tenantId){

  const filePath = settings?.assets?.splashPath;
  if (!filePath) return;

  const buffer = readAsset(filePath);

  const dest = path.join(
    projectDir,
    "app/src/main/res/drawable/splash.png"
  );

  fs.writeFileSync(dest, buffer);

  publishLog(jobId, tenantId, `[patch] splash applied (local)`);

};