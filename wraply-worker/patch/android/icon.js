// patch/android/icon.js

const path = require("path");
const fs = require("fs");

const sharp = require("sharp");

const { publishLog } = require("../../bus/logBus");

const ICON_SIZES = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192
};

function readAsset(filePath){

  const abs = path.join(process.env.WRAPLY_ROOT, filePath);

  if (!fs.existsSync(abs)){
    throw new Error(`icon not found: ${filePath}`);
  }

  return fs.readFileSync(abs);

}

module.exports = async function applyIconAndroid(projectDir, settings, jobId, tenantId){

  const filePath = settings?.assets?.iconPath;
  if (!filePath) return;

  const buffer = readAsset(filePath);

  for (const [folder, size] of Object.entries(ICON_SIZES)){

    const dir = path.join(projectDir, `app/src/main/res/${folder}`);
    if (!fs.existsSync(dir)) continue;

    const dest = path.join(dir, "ic_launcher.png");

    await sharp(buffer)
      .resize(size, size)
      .png()
      .toFile(dest);

  }

  publishLog(jobId, tenantId, `[patch] icon applied (local)`);

};