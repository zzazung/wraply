// wraply-worker/patch/android/appName.js

const path = require("path");

const { updateXmlString } = require("../../lib/xml");
const { publishLog } = require("../../bus/logBus");

module.exports = async function applyAppNameAndroid(projectDir, settings, jobId, tenantId){

  if (!settings.appName) return;

  const file = path.join(
    projectDir,
    "app/src/main/res/values/strings.xml"
  );

  await updateXmlString(file, "app_name", settings.appName);

  publishLog(jobId, tenantId,
    `[patch] appName → ${settings.appName}`
  );

};