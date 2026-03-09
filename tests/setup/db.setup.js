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

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  const dbName = process.env.DB_NAME;

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);

  await connection.query(`USE \`${dbName}\``);

  // jobs table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT,
      job_id VARCHAR(64),
      platform VARCHAR(20),
      package_name VARCHAR(255),
      safe_name VARCHAR(255),
      app_name VARCHAR(255),
      url TEXT,
      scheme VARCHAR(100),
      status VARCHAR(50),
      progress INT DEFAULT 0,
      log_path TEXT,
      created_at DATETIME,
      updated_at DATETIME,
      finished_at DATETIME,
      error_reason TEXT,
      artifact_dir TEXT,
      download_base_url TEXT,
      signing_key_id INT,
      signing_mode VARCHAR(50),
      heartbeat_at DATETIME,
      retry_count INT DEFAULT 0,
      max_retry INT DEFAULT 3
    )
  `);

  // artifacts table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(64),
      file_name VARCHAR(255),
      file_path TEXT,
      file_size INT,
      created_at DATETIME
    )
  `);

  await connection.end();

};