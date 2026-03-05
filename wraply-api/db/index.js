const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "000000",
  database: process.env.DB_NAME || "wraply",
  connectionLimit: 10,
  queueLimit: 0,
});


async function query(sql, params = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql, params);
    return rows;
  } catch (err) {
    console.error("DB error:", err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  pool,
  query,
};