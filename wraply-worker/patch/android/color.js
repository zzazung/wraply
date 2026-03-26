// wraply-worker/patch/android/color.js

const path = require("path");

const { updateXmlString } = require("../../lib/xml");
const { publishLog } = require("../../bus/logBus");

module.exports = async function applyColorAndroid(projectDir, settings, jobId, tenantId){

  const color = settings?.ui?.primaryColor;
  if (!color) return;

  const file = path.join(
    projectDir,
    "app/src/main/res/values/colors.xml"
  );

  await updateXmlString(file, "colorPrimary", color);

  await updateXmlString(file, "iconBackground", color);

  publishLog(jobId, tenantId,
    `[patch] primaryColor → ${color}`
  );

};