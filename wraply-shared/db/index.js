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
 * 기본 query
 * - SQL 변형 없음
 * - tenant 강제 없음
 * - 완전 raw 실행
 */
async function query(sql, params = []) {

  const [rows] = await pool.query(sql, params)

  return rows

}

/**
 * 트랜잭션 helper
 */
async function withTransaction(callback) {

  const conn = await pool.getConnection()

  try {

    await conn.beginTransaction()

    const result = await callback(conn)

    await conn.commit()

    return result

  }
  catch (err) {

    await conn.rollback()
    throw err

  }
  finally {

    conn.release()

  }

}

module.exports = {
  pool,
  query,
  withTransaction
}