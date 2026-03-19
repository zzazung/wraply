// wraply-shared/db/index.js

const mysql = require("mysql2/promise")

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
})

/**
 * tenant guard 대상 테이블
 */
const TENANT_TABLES = [
  "projects",
  "jobs",
  "artifacts",
  "users",
  "android_signing_keys",
  "ios_signing_assets",
  "billing"
]

/**
 * SQL에 tenant_id 조건이 포함되어 있는지 검사
 */
function hasTenantCondition(sql) {

  const lower = sql.toLowerCase()

  return lower.includes("tenant_id")

}

/**
 * tenant guard 검사
 */
function validateTenantQuery(sql) {

  const lower = sql.toLowerCase()

  const isTarget = TENANT_TABLES.some(table =>
    lower.includes(`from ${table}`) ||
    lower.includes(`into ${table}`) ||
    lower.includes(`update ${table}`)
  )

  if (!isTarget) return

  if (!hasTenantCondition(sql)) {

    console.error("❌ TENANT FILTER MISSING:\n", sql)

    throw new Error("TENANT_FILTER_REQUIRED")

  }

}

/**
 * query 실행
 */
async function query(sql, params = [], options = {}) {

  try {

    /**
     * 🔥 tenant guard 실행
     */
    if (!options.skipTenantCheck) {
      validateTenantQuery(sql)
    }

    const [rows] = await pool.query(sql, params)

    return rows

  } catch (err) {

    console.error("DB error:", err.message)
    throw err

  }

}

module.exports = {
  pool,
  query
}