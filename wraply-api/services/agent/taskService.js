// wraply-api/services/agent/taskService.js

const { query } = require("@wraply/shared/db");

async function getTasks(){

  const rows = await query(`
    SELECT name, description
    FROM tasks
    WHERE enabled = TRUE
  `);

  return rows;

}

module.exports = {
  getTasks
};