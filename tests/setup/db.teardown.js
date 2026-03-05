const mysql = require("mysql2/promise")

const DB_NAME = process.env.DB_NAME || "wraply_test"

module.exports = async () => {

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "000000"
  })

  await conn.query(`DROP DATABASE IF EXISTS ${DB_NAME}`)

  await conn.end()

}