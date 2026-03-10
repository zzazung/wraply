require("dotenv").config({
  path: ".env.test"
});

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

  /**
   * users table
   */
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255),
      name VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  /**
   * projects table
   */
  await connection.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      name VARCHAR(255),
      safe_name VARCHAR(255),
      package_name VARCHAR(255),
      app_name VARCHAR(255),
      service_url TEXT,
      scheme VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  /**
   * jobs table
   */
  await connection.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id VARCHAR(64),
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
    );
  `);

  /**
   * artifacts table
   */
  await connection.query(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(64),
      file_name VARCHAR(255),
      file_path TEXT,
      file_size INT,
      created_at DATETIME
    );
  `);

  await connection.end();

};