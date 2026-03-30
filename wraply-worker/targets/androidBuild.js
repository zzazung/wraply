// wraply-worker/targets/androidBuild.js

const path = require("path");

const { applyAndroidPatches } = require("../patch/android");
const { ensureAndroidSigning } = require("../lib/androidSigning");

module.exports = {

  run: async (ctx) => {

    const {
      jobId,
      tenantId,
      workspace,
      settings,
      packageName,
      safeName
    } = ctx;

    /* ---------------- PATCH ---------------- */

    try {

      await applyAndroidPatches(
        path.join(workspace, "android"),
        "android",
        settings,
        jobId,
        tenantId
      );

    } catch (err) {

      throw new Error(`[android] patch failed: ${err.message}`);

    }

    /* ---------------- SIGNING ---------------- */

    const signing = await ensureAndroidSigning(
      tenantId,
      packageName,
      safeName
    );

    const signingEnv = {
      ANDROID_KEYSTORE_PATH: signing.keystorePath,
      ANDROID_KEY_ALIAS: signing.alias,
      ANDROID_STORE_PASSWORD: signing.storePass,
      ANDROID_KEY_PASSWORD: signing.keyPass
    };

    return {
      signingEnv
    };

  }

};