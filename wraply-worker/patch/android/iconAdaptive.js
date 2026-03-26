// wraply-worker/patch/android/iconAdaptive.js

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const { readAsset } = require("../../lib/asset");
const { updateXmlString } = require("../../lib/xml");
const { publishLog } = require("../../bus/logBus");

module.exports = async function applyAdaptiveIconAndroid(projectDir, settings, jobId, tenantId){

  const filePath = settings?.assets?.iconPath;
  if (!filePath) return;

  const buffer = readAsset(filePath);

  /* ---------------- foreground 생성 ---------------- */

  const size = 432;
  const iconSize = 288;

  const foregroundPath = path.join(
    projectDir,
    "app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png"
  );

  const canvas = await sharp({
    create:{
      width:size,
      height:size,
      channels:4,
      background:{ r:0, g:0, b:0, alpha:0 }
    }
  })
  .composite([
    {
      input: await sharp(buffer)
        .resize(iconSize, iconSize)
        .png()
        .toBuffer(),
      gravity:"center"
    }
  ])
  .png()
  .toBuffer();

  fs.writeFileSync(foregroundPath, canvas);

  /* ---------------- background color ---------------- */

  const color = settings?.assets?.iconBackground || "#ffffff";

  const colorFile = path.join(
    projectDir,
    "app/src/main/res/values/colors.xml"
  );

  await updateXmlString(colorFile, "iconBackground", color);

  /* ---------------- xml 생성 ---------------- */

  const xmlDir = path.join(
    projectDir,
    "app/src/main/res/mipmap-anydpi-v26"
  );

  fs.mkdirSync(xmlDir, { recursive:true });

  const xml = `
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/iconBackground"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`.trim();

  fs.writeFileSync(path.join(xmlDir, "ic_launcher.xml"), xml);
  fs.writeFileSync(path.join(xmlDir, "ic_launcher_round.xml"), xml);

  publishLog(jobId, tenantId, "[patch] adaptive icon applied");

};