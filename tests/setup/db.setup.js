// const mysql = require("mysql2/promise")
// require('dotenv').config({ path: '.env.test', quiet: true });

// const DB_NAME = process.env.DB_NAME;

// module.exports = async () => {

//   const conn = await mysql.createConnection({
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//   })

//   // 테스트 DB 생성
//   await conn.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`)

//   await conn.query(`USE ${DB_NAME}`)

//   // projects table
//   await conn.query(`
//     CREATE TABLE IF NOT EXISTS projects (
//       id VARCHAR(64) PRIMARY KEY,
//       name VARCHAR(255),
//       safe_name VARCHAR(255),
//       package_name VARCHAR(255),
//       service_url TEXT,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     )
//   `)

//   // jobs table
//   await conn.query(`
//     CREATE TABLE IF NOT EXISTS jobs (
//       job_id VARCHAR(64) PRIMARY KEY,
//       project_id VARCHAR(64),
//       platform VARCHAR(20),
//       status VARCHAR(20),
//       progress INT DEFAULT 0,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     )
//   `)

//   await conn.end()

// }
require("./testEnv");

const mysql = require("mysql2/promise");

module.exports = async () => {

  console.log("Test DB setup");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  const dbName = process.env.DB_NAME;

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

  await connection.query(`USE \`${dbName}\`;`);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id VARCHAR(64) PRIMARY KEY,
      status VARCHAR(20),
      progress INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await connection.end();

};