// wraply-worker/patch/android/index.js

const applyVersionAndroid = require("./version");
const applyAppNameAndroid = require("./appName");
const applyUrlAndroid = require("./url");
const applyColorAndroid = require("./color");
const applyAdaptiveIconAndroid = require("./iconAdaptive");
const applySplashAndroid = require("./splash");
const applySplashImageAndroid = require("./splashImage");

const patches = [
  applyVersionAndroid,
  applyAppNameAndroid,
  applyUrlAndroid,
  applyColorAndroid,
  applyAdaptiveIconAndroid,
  applySplashAndroid,
  applySplashImageAndroid
];

async function applyAndroidPatches(projectDir, platform, settings, jobId, tenantId){

  const config = settings?.target?.config || {};

  const {
    versionCode = 1,
    versionName = "1.0.0",
    adaptiveIcon = false
  } = config;

  console.log("[patch][android]", config);

  for (const patch of patches){

    try{

      await patch(projectDir, settings, jobId, tenantId);

    }catch(err){

      publishLog(jobId, tenantId,
        `[patch-error] ${patch.name}: ${err.message}`
      );

      throw err; // 🔥 여기서 실패시키는게 맞다 (중요)

    }

  }

}

module.exports = {
  applyAndroidPatches
};