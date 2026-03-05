const mariadb = require("mariadb");

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "wraply",
  connectionLimit: 10,
  acquireTimeout: 10000,
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