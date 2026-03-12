// const mysql = require('mysql2/promise')

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   connectionLimit: 10,
//   queueLimit: 0,
// });


// async function query(sql, params = []) {
//   let conn;
//   try {
//     conn = await pool.getConnection();
//     const rows = await conn.query(sql, params);
//     return rows;
//   } catch (err) {
//     console.error("DB error:", err);
//     throw err;
//   } finally {
//     if (conn) conn.release();
//   }
// }

// module.exports = {
//   pool,
//   query,
// };

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

async function query(sql, params = []) {

  const [rows] = await pool.query(sql, params);

  return rows;

}

module.exports = {
  pool,
  query
};