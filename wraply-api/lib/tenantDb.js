// wraply-api/lib/tenantDb.js

const { query } = require("@wraply/shared/db")

function tenantDb(req) {

  const tenantId = req.user?.tenantId

  if (!tenantId) {
    throw new Error("TENANT_REQUIRED")
  }

  return {

    /**
     * ----------------------
     * PROJECTS
     * ----------------------
     */
    projects: {

      async list() {

        return query(
          `
          SELECT
            id,
            tenant_id,
            name,
            safe_name,
            package_name,
            bundle_id,
            created_at,
            updated_at
          FROM projects
          WHERE tenant_id = ?
          ORDER BY created_at DESC
          `,
          [tenantId]
        )

      },

      async findById(id) {

        const rows = await query(
          `
          SELECT *
          FROM projects
          WHERE id = ?
          AND tenant_id = ?
          LIMIT 1
          `,
          [id, tenantId]
        )

        return rows[0] || null

      },

      async create(data) {

        await query(
          `
          INSERT INTO projects (
            id,
            tenant_id,
            name,
            safe_name,
            package_name,
            bundle_id,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
          [
            data.id,
            tenantId,
            data.name,
            data.safeName,
            data.packageName,
            data.bundleId || null
          ]
        )

      }

    },

    /**
     * ----------------------
     * JOBS
     * ----------------------
     */
    jobs: {

      async list() {

        return query(
          `
          SELECT
            job_id,
            tenant_id,
            project_id,
            platform,
            package_name,
            safe_name,
            app_name,
            url,
            scheme,
            status,
            progress,
            worker_id,
            build_host,
            created_at,
            updated_at,
            finished_at,
            error_reason,
            log_path,
            artifact_dir
          FROM jobs
          WHERE tenant_id = ?
          ORDER BY created_at DESC
          LIMIT 100
          `,
          [tenantId]
        )

      },

      async findById(jobId) {

        const rows = await query(
          `
          SELECT *
          FROM jobs
          WHERE job_id = ?
          AND tenant_id = ?
          LIMIT 1
          `,
          [jobId, tenantId]
        )

        return rows[0] || null

      },

      async findMany(jobIds) {

        if (!jobIds.length) return []

        const placeholders = jobIds.map(() => "?").join(",")

        return query(
          `
          SELECT *
          FROM jobs
          WHERE tenant_id = ?
          AND job_id IN (${placeholders})
          `,
          [tenantId, ...jobIds]
        )

      },

      async listByProject(projectId) {

        return query(
          `
          SELECT
            job_id,
            tenant_id,
            platform,
            status,
            progress,
            created_at
          FROM jobs
          WHERE project_id = ?
          AND tenant_id = ?
          ORDER BY created_at DESC
          `,
          [projectId, tenantId]
        )

      },

      async create(data) {

        await query(
          `
          INSERT INTO jobs (
            job_id,
            tenant_id,
            project_id,
            platform,
            package_name,
            safe_name,
            app_name,
            url,
            scheme,
            status,
            progress,
            worker_id,
            build_host,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, NULL, NULL, NOW(), NOW())
          `,
          [
            data.id,
            tenantId,
            data.projectId,
            data.platform,
            data.packageName,
            data.safeName,
            data.appName || null,
            data.url || null,
            data.scheme || null
          ]
        )

      },

      async deleteMany(jobIds) {

        if (!jobIds.length) return 0

        const placeholders = jobIds.map(() => "?").join(",")

        const result = await query(
          `
          DELETE FROM jobs
          WHERE tenant_id = ?
          AND job_id IN (${placeholders})
          `,
          [tenantId, ...jobIds]
        )

        return result.affectedRows || 0

      }

    },

    /**
     * ----------------------
     * ARTIFACTS
     * ----------------------
     */
    artifacts: {

      async listByJob(jobId) {

        const rows = await query(
          `
          SELECT
            id,
            platform,
            name,
            path,
            size,
            created_at
          FROM artifacts
          WHERE job_id = ?
          AND tenant_id = ?
          `,
          [jobId, tenantId]
        )

        return rows
          .filter(r => r.path && !r.path.includes(".."))
          .map(r => ({
            id: r.id,
            platform: r.platform,
            name: r.name,
            downloadUrl: `/downloads/${r.path}`,
            size: r.size,
            createdAt: r.created_at
          }))

      }

    },

    /**
     * ----------------------
     * USERS
     * ----------------------
     */
    users: {

      async findById(userId) {

        const rows = await query(
          `
          SELECT
            id,
            tenant_id,
            email,
            created_at
          FROM users
          WHERE id = ?
          AND tenant_id = ?
          LIMIT 1
          `,
          [userId, tenantId]
        )

        return rows[0] || null

      },

      async list() {

        return query(
          `
          SELECT
            id,
            email,
            created_at
          FROM users
          WHERE tenant_id = ?
          ORDER BY created_at DESC
          `,
          [tenantId]
        )

      }

    },

    /**
     * ----------------------
     * SIGNING
     * ----------------------
     */
    signing: {

      /**
       * Android keystore
       */
      async getAndroidKey(projectId) {

        const rows = await query(
          `
          SELECT *
          FROM android_signing_keys
          WHERE project_id = ?
          AND tenant_id = ?
          LIMIT 1
          `,
          [projectId, tenantId]
        )

        return rows[0] || null

      },

      async saveAndroidKey(data) {

        await query(
          `
          INSERT INTO android_signing_keys (
            id,
            tenant_id,
            project_id,
            keystore_path,
            alias,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, NOW())
          `,
          [
            data.id,
            tenantId,
            data.projectId,
            data.keystorePath,
            data.alias
          ]
        )

      },

      /**
       * iOS signing assets
       */
      async getIosAssets(bundleId) {

        const rows = await query(
          `
          SELECT *
          FROM ios_signing_assets
          WHERE bundle_id = ?
          AND tenant_id = ?
          LIMIT 1
          `,
          [bundleId, tenantId]
        )

        return rows[0] || null

      },

      async saveIosAssets(data) {

        await query(
          `
          INSERT INTO ios_signing_assets (
            id,
            tenant_id,
            bundle_id,
            cert_path,
            profile_path,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, NOW())
          `,
          [
            data.id,
            tenantId,
            data.bundleId,
            data.certPath,
            data.profilePath
          ]
        )

      }

    },

    /**
     * ----------------------
     * BILLING
     * ----------------------
     */
    billing: {

      async getPlan() {

        const rows = await query(
          `
          SELECT
            plan,
            status,
            current_period_end
          FROM billing
          WHERE tenant_id = ?
          LIMIT 1
          `,
          [tenantId]
        )

        return rows[0] || null

      },

      async setPlan(data) {

        await query(
          `
          INSERT INTO billing (
            tenant_id,
            plan,
            status,
            current_period_end,
            updated_at
          )
          VALUES (?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            plan = VALUES(plan),
            status = VALUES(status),
            current_period_end = VALUES(current_period_end),
            updated_at = NOW()
          `,
          [
            tenantId,
            data.plan,
            data.status,
            data.currentPeriodEnd
          ]
        )

      }

    }

  }

}

module.exports = tenantDb