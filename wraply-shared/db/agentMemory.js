const { query } = require("./index");
const { v4: uuidv4 } = require("uuid");

/* ---------------- run 생성 ---------------- */

async function createAgentRun({ tenantId, goal }) {

  console.log(`[api] createAgentRun tenantId: ${tenantId}`);

  const id = uuidv4();

  await query(`
    INSERT INTO agent_runs (id, tenant_id, goal, status, created_at, updated_at)
    VALUES (?, ?, ?, 'RUNNING', NOW(), NOW())
  `, [id, tenantId, goal]);

  return id;

}

/* ---------------- step 저장 ---------------- */

async function saveAgentStep({
  runId,
  tenantId,
  step,
  input,
  output
}) {

  console.log(`[api] saveAgentStep tenantId: ${tenantId}`);

  try {

    await query(`
      INSERT INTO agent_steps (id, run_id, tenant_id, step, input, output, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      uuidv4(),
      runId,
      tenantId,
      step,
      JSON.stringify(input),
      JSON.stringify(output)
    ]);

  } catch (err) {

    console.error("[db] saveAgentStep error:", err);

  }

}

/* ---------------- run 완료 ---------------- */

async function finishAgentRun({ runId, tenantId, status = "DONE" }) {

  console.log(`[api] finishAgentRun tenantId: ${tenantId}`);

  await query(`
    UPDATE agent_runs
    SET status = ?, updated_at = NOW()
    WHERE id = ? and tenant_id = ?
  `, [status, runId, tenantId]);

}

/* ---------------- memory 저장 ---------------- */

async function saveAgentMemory({
  tenantId,
  key,
  value
}) {

  console.log(`[api] saveAgentMemory tenantId: ${tenantId}`);

  await query(`
    INSERT INTO agent_memory (id, tenant_id, key_name, value, updated_at)
    VALUES (?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      value = VALUES(value),
      updated_at = NOW()
  `, [
    uuidv4(),
    tenantId,
    key,
    JSON.stringify(value)
  ]);

}

/* ---------------- memory 조회 ---------------- */

async function getAgentMemory({ tenantId, key }) {

  const rows = await query(`
    SELECT value
    FROM agent_memory
    WHERE tenant_id = ? AND key_name = ?
    LIMIT 1
  `, [tenantId, key]);

  if (!rows.length) return null;

  return JSON.parse(rows[0].value);

}

module.exports = {
  createAgentRun,
  saveAgentStep,
  finishAgentRun,
  saveAgentMemory,
  getAgentMemory
};