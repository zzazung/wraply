// wraply-api/services/workflowQueue.js

const { v4: uuidv4 } = require("uuid");
const { query } = require("@wraply/shared/db");

const { enqueueBuild } = require("../queue/buildQueue");
const { buildSettings } = require("./buildSettings");

async function enqueueStep({
  workflowId,
  stepIndex
}) {

  /* 1. step 조회 (DB 기준) */
  const rows = await query(`
    SELECT *
    FROM workflow_steps
    WHERE workflow_id = ? AND step_index = ?
  `, [workflowId, stepIndex]);

  if (!rows.length){

    /* 🔥 모든 step 완료 */
    await query(`
      UPDATE workflow_runs
      SET status = 'done'
      WHERE id = ?
    `, [workflowId]);

    return;
  }

  const step = rows[0];

  /* 2. workflow 정보 조회 */
  const [wf] = await query(`
    SELECT tenant_id, project_id
    FROM workflow_runs
    WHERE id = ?
  `, [workflowId]);

  if (!wf){
    throw new Error("workflow not found");
  }

  const { tenant_id: tenantId, project_id: projectId } = wf;

  /* 3. step 상태 변경 */
  await query(`
    UPDATE workflow_steps
    SET status = 'running'
    WHERE workflow_id = ? AND step_index = ?
  `, [workflowId, stepIndex]);

  await query(`
    UPDATE workflow_runs
    SET status = 'running', current_step = ?
    WHERE id = ?
  `, [stepIndex, workflowId]);

  /* 4. job 생성 */
  const jobId = uuidv4();

  const settings = await buildSettings({
    tenantId,
    projectId,
    target: step.step
  });

  await query(`
    INSERT INTO jobs (
      job_id,
      tenant_id,
      project_id,
      workflow_id,
      step_index,
      platform,
      settings,
      status,
      progress,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', 0, NOW())
  `, [
    jobId,
    tenantId,
    projectId,
    workflowId,
    stepIndex,
    step.step,
    JSON.stringify(settings)
  ]);

  /* 5. queue 전달 */
  await enqueueBuild({
    jobId,
    tenantId,
    workflowId,
    stepIndex,
    projectId,
    settings
  });

}

module.exports = { enqueueStep };