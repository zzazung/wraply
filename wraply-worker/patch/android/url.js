// wraply-worker/patch/android/url.js

const path = require("path");

const { updateXmlString } = require("../../lib/xml");
const { publishLog } = require("../../bus/logBus");

module.exports = async function applyUrlAndroid(projectDir, settings, jobId, tenantId){

  const url = settings?.url;
  if (!url) return;

  const file = path.join(
    projectDir,
    "app/src/main/res/values/strings.xml"
  );

  await updateXmlString(file, "base_url", url);

  publishLog(jobId, tenantId,
    `[patch] url → ${url}`
  );

};