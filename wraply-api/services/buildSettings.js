// wraply-api/services/buildSettings.js

const { query } = require("@wraply/shared/db");

/**
 * target별 설정 생성
 */
async function buildSettings({
  tenantId,
  projectId,
  target
}){

  if (!tenantId) {
    throw new Error("tenantId required");
  }

  if (!projectId) {
    throw new Error("projectId required");
  }

  /* ---------------- 프로젝트 기본 정보 ---------------- */

  const [project] = await query(`
    SELECT *
    FROM projects
    WHERE id = ? AND tenant_id = ?
    LIMIT 1
  `, [projectId, tenantId]);

  if (!project){
    throw new Error("project not found");
  }

  const settings =
    typeof project.settings === "string"
      ? JSON.parse(project.settings)
      : project.settings;

  /* ---------------- target 분기 ---------------- */

  // ✅ 1. AI CONTENT (추가된 부분)
  if (target === "ai_content"){

    return {
      type: "ai_content",

      tenantId,
      projectId,

      appName: settings?.appName || project.name,
      url: settings?.url || "",

      // 이후 LLM에서 사용할 context
      input: {
        appName: settings?.appName || project.name,
        url: settings?.url || ""
      }
    };

  }

  // ✅ 2. ANDROID BUILD (기존)
  if (target === "android_build"){

    return {
      type: "android_build",

      tenantId,
      projectId,

      packageName: settings?.packageName,
      appName: settings?.appName,
      url: settings?.url
    };

  }

  // ✅ 3. IOS BUILD (있다면)
  if (target === "ios_build"){

    return {
      type: "ios_build",

      tenantId,
      projectId,

      bundleId: settings?.bundleId,
      appName: settings?.appName,
      url: settings?.url
    };

  }

  /* ---------------- fallback ---------------- */

  throw new Error(`target not found: ${target}`);
}

module.exports = {
  buildSettings
};