// wraply-worker/targets/iosBuild.js

const path = require("path");
const fs = require("fs");

const { query } = require("@wraply/shared/db");

const {
  ensureIOSSigning,
  deleteTempKeychain,
  exportP12FromKeychain,
  hasIdentity,
  hasCert,
  hasProfile,
  getLatestProfile,
  getCertPath,
  getCertPassPath
} = require("../lib/iosSigning");

const { applyIOSPatches } = require("../patch/ios");

module.exports = {

  run: async (ctx) => {

    const {
      jobId,
      tenantId,
      workspace,
      settings,
      packageName
    } = ctx;

    let iosKeychain = null;

    /* ---------------- PATCH ---------------- */

    try {

      await applyIOSPatches(
        path.join(workspace, "ios"),
        settings,
        jobId,
        tenantId
      );

    } catch (err) {

      throw new Error(`[ios] patch failed: ${err.message}`);

    }

    /* ---------------- SIGNING ASSET ---------------- */

    const signingRows = await query(`
      SELECT *
      FROM ios_signing_assets
      WHERE tenant_id=? AND bundle_id=?
      LIMIT 1
    `, [
      tenantId,
      packageName
    ]);

    if (!signingRows.length) {
      throw new Error("iOS signing asset not found");
    }

    const asset = signingRows[0];

    /* ---------------- SIGNING ---------------- */

    const signing = await ensureIOSSigning({
      jobId,
      tenantId,
      bundleId: packageName,
      mode: asset.mode,
      apiKeyId: asset.api_key_id,
      apiIssuerId: asset.api_issuer_id,
      apiKeyPath: asset.api_key_path
    });

    iosKeychain = signing.keychainPath;

    const certExists = hasCert(tenantId);
    const profileExists = hasProfile(tenantId, packageName);

    const signingEnv = {
      ...signing.env,
      CODE_SIGN_IDENTITY: "Apple Distribution",
      HAS_CERT: certExists ? "true" : "false",
      HAS_PROFILE: profileExists ? "true" : "false",
      TEAM_ID: asset.team_id
    };

    /* ---------------- CERT ---------------- */

    if (certExists) {

      const certPath = getCertPath(tenantId);
      const passPath = getCertPassPath(tenantId);

      signingEnv.P12_PATH = certPath;
      signingEnv.P12_PASSWORD = fs.existsSync(passPath)
        ? fs.readFileSync(passPath, "utf8")
        : "";

    }

    /* ---------------- PROFILE ---------------- */

    if (profileExists) {

      const profilePath = getLatestProfile(tenantId, packageName);

      signingEnv.PROFILE_PATH = profilePath;
      signingEnv.PROFILE_UUID =
        path.basename(profilePath).replace(".mobileprovision", "");

    }

    return {
      signingEnv,
      iosKeychain
    };

  },

  /* ---------------- CLEANUP (선택) ---------------- */

  cleanup: async ({ iosKeychain }) => {

    if (iosKeychain) {
      deleteTempKeychain(iosKeychain);
    }

  }

};