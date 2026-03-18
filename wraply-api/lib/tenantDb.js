// wraply-api/lib/tenantDb.js

const { query } = require("@wraply/shared/db")

function tenantDb(req) {

  const tenantId = req.user?.tenantId

  if (!tenantId) {
    throw new Error("TENANT_REQUIRED")
  }

  return {

    projects: {

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

      async list() {

        return query(
          `
          SELECT *
          FROM projects
          WHERE tenant_id = ?
          ORDER BY created_at DESC
          `,
          [tenantId]
        )

      }

    },

    jobs: {

      async findById(id) {

        const rows = await query(
          `
          SELECT *
          FROM jobs
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
          INSERT INTO jobs (
            id,
            tenant_id,
            project_id,
            platform,
            package_name,
            app_name,
            url,
            status,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', NOW(), NOW())
          `,
          [
            data.id,
            tenantId,
            data.projectId,
            data.platform,
            data.packageName,
            data.appName,
            data.url
          ]
        )

      }

    }

  }

}

module.exports = tenantDb