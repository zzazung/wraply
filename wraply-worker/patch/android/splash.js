// wraply-worker/patch/android/splash.js

const { publishLog } = require("../../bus/logBus");

module.exports = function applySplashAndroid(projectDir, settings, jobId, tenantId){

  const enabled = settings?.ui?.splash;

  publishLog(
    jobId,
    tenantId,
    `[patch] splash → ${enabled ? "enabled" : "disabled"}`
  );

};