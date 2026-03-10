// const mysql = require("mysql2/promise")
// require('dotenv').config({ path: '.env.test', quiet: true });

// const DB_NAME = process.env.DB_NAME;

// module.exports = async () => {

//   const conn = await mysql.createConnection({
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD
//   })

//   await conn.query(`DROP DATABASE IF EXISTS ${DB_NAME}`)

//   await conn.end()

// }

require("dotenv").config({
  path: ".env.test"
});

const db = require("@wraply/shared/db");

module.exports = async () => {

  console.log("Test DB teardown");

  await db.query("DELETE FROM artifacts");
  await db.query("DELETE FROM jobs;");

  await db.pool.end();

};