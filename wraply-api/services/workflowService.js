// wraply-api/services/workflowService.js

const { v4: uuidv4 } = require("uuid");
const { query } = require("@wraply/shared/db");

const { enqueueStep } = require("./workflowQueue");

async function startWorkflow({ tenantId, projectId, workflow }) {

  const workflowId = uuidv4();

  /* 1. workflow 생성 */
  await query(`
    INSERT INTO workflow_runs
    (id, tenant_id, project_id, status, current_step, created_at, updated_at)
    VALUES (?, ?, ?, 'queued', 0, NOW(), NOW())
  `, [
    workflowId,
    tenantId,
    projectId
  ]);

  /* 🔥 2. step 정의 저장 (핵심) */
  for (let i = 0; i < workflow.length; i++) {

    await query(`
      INSERT INTO workflow_steps
      (id, workflow_id, step, step_index, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', NOW())
    `, [
      uuidv4(),
      workflowId,
      workflow[i].target,
      i
    ]);

  }

  /* 🔥 3. 첫 step 실행 */
  await enqueueStep({
    workflowId,
    stepIndex: 0
  });

  return workflowId;

}

module.exports = { startWorkflow };