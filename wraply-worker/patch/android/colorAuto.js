// patch/android/colorAuto.js

const path = require("path");

const { extractPrimaryColor } = require("../../lib/color");
const { updateXmlString } = require("../../lib/xml");
const { publishLog } = require("../../bus/logBus");

module.exports = async function applyAutoColor(projectDir, settings, jobId, tenantId){

  if (settings?.ui?.primaryColor) return;

  const iconPath = settings?.assets?.iconPath;
  if (!iconPath) return;

  const color = await extractPrimaryColor(iconPath);

  const file = path.join(
    projectDir,
    "app/src/main/res/values/colors.xml"
  );

  await updateXmlString(file, "colorPrimary", color);

  publishLog(jobId, tenantId,
    `[patch] auto primaryColor → ${color}`
  );

};