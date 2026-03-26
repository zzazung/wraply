// @wraply/shared/db/agentMemory.js

const { query } = require("./index");

/* --------------------------------------------------
   job 생성 (Agent 실행)
-------------------------------------------------- */

async function createAgentRun({ jobId, tenantId, userId, goal }) {

  if (!tenantId) {
    throw new Error("tenantId required");
  }

  await query(`
    INSERT INTO agent_jobs
    (id, tenant_id, user_id, goal, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'running', NOW(), NOW())
  `, [jobId, tenantId, userId, goal]);

}

/* --------------------------------------------------
   step 저장
-------------------------------------------------- */

async function saveAgentStep({
  jobId,
  tenantId,
  step,
  input,
  output
}) {

  if (!tenantId) {
    throw new Error("tenantId required");
  }

  const safeInput = JSON.stringify(input ?? {});
  const safeOutput = JSON.stringify(output ?? {});

  await query(`
    INSERT INTO agent_steps
    (job_id, tenant_id, step, status, input, output, created_at)
    VALUES (?, ?, ?, 'done', ?, ?, NOW())
  `, [
    jobId,
    tenantId,
    step,
    safeInput,
    safeOutput
  ]);

}

/* --------------------------------------------------
   job 완료
-------------------------------------------------- */

async function finishAgentRun({
  jobId,
  tenantId,
  status = "done"
}) {

  if (!tenantId) {
    throw new Error("tenantId required");
  }

  await query(`
    UPDATE agent_jobs
    SET status = ?, updated_at = NOW()
    WHERE id = ? AND tenant_id = ?
  `, [status, jobId, tenantId]);

}

/* --------------------------------------------------
   memory 저장
-------------------------------------------------- */

async function saveAgentMemory({
  tenantId,
  jobId,
  key,
  value,
  score,
  success,
  source = "ai"
}) {

  if (!tenantId) {
    throw new Error("tenantId required");
  }

  await query(`
    INSERT INTO agent_memories
    (tenant_id, job_id, memory_key, value, score, success, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `, [
    tenantId,
    jobId,
    key,
    JSON.stringify(value ?? {}),
    score ?? 0,
    success ?? null,
    source
  ]);

}

/* --------------------------------------------------
   best memory 조회
-------------------------------------------------- */

async function getBestMemory({
  tenantId,
  key,
  limit = 5
}) {

  return query(`
    SELECT value
    FROM agent_memories
    WHERE tenant_id = ?
      AND memory_key = ?
      AND score > 0.6
    ORDER BY score DESC, created_at DESC
    LIMIT ?
  `, [tenantId, key, limit]);

}

module.exports = {
  createAgentRun,
  saveAgentStep,
  finishAgentRun,
  saveAgentMemory,
  getBestMemory
};