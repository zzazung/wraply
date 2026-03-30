const { Worker } = require("bullmq");
const redis = require("@wraply/shared/redis");
const { query } = require("@wraply/shared/db");

const { publishWorkflowNext } = require("@wraply/shared/bus/workflowBus");

/* --------------------------------------------------
   Target Handlers
-------------------------------------------------- */

const targets = {
  android_build: require("../targets/androidBuild"),
  ios_build: require("../targets/iosBuild"),
  ai_content: require("../targets/aiContent"),
  ai_marketing: require("../targets/aiMarketing")
};

/* --------------------------------------------------
   Worker
-------------------------------------------------- */

const worker = new Worker(
  "target-queue",
  async (job) => {

    const { jobId, tenantId, settings } = job.data;

    const target = settings?.target;

    if (!target?.type) {
      throw new Error("Invalid settings: target.type missing");
    }

    const handler = targets[target.type];

    if (!handler) {
      throw new Error(`Unknown target: ${target.type}`);
    }

    console.log("[targetWorker] run:", { jobId, target: target.type });

    const ctx = {
      jobId,
      tenantId,
      settings,
      base: settings.base,
      config: settings.target.config
    };

    const result = await handler(ctx);

    console.log("[targetWorker] done:", { jobId, target: target.type });

    return result;

  },
  {
    connection: redis,
    concurrency: 5
  }
);

/* --------------------------------------------------
   Events
-------------------------------------------------- */

worker.on("completed", async (job) => {

  const {
    workflowId,
    stepIndex,
    tenantId,
    projectId
  } = job.data;

  if (!workflowId) return;

  /* 🔥 step 완료 */
  await query(`
    UPDATE workflow_steps
    SET status='done'
    WHERE workflow_id=? AND step_index=?
  `, [workflowId, stepIndex]);

  /* 🔥 workflow 상태 보장 */
  await query(`
    UPDATE workflow_runs
    SET status='running'
    WHERE id=? AND tenant_id=?
  `, [workflowId, tenantId]);

  const nextStep = stepIndex + 1;

  /* 🔥 step 개수 조회 */
  const rows = await query(`
    SELECT COUNT(*) as count
    FROM workflow_steps
    WHERE workflow_id = ?
  `, [workflowId]);

  const totalSteps = rows[0].count;

  /* 🔥 모든 step 완료 */
  if (nextStep >= totalSteps) {

    await query(`
      UPDATE workflow_runs
      SET status='done', updated_at=NOW()
      WHERE id=? AND tenant_id=?
    `, [workflowId, tenantId]);

    return;
  }

  /* 🔥 다음 step 요청 */
  await publishWorkflowNext({
    workflowId,
    tenantId,
    projectId,
    stepIndex: nextStep
  });

});

worker.on("failed", async (job, err) => {

  const { workflowId, tenantId, stepIndex } = job.data;

  if (!workflowId) return;

  /* 🔥 step 실패 */
  await query(`
    UPDATE workflow_steps
    SET status='failed'
    WHERE workflow_id=? AND step_index=?
  `, [workflowId, stepIndex]);

  /* 🔥 workflow 실패 */
  await query(`
    UPDATE workflow_runs
    SET status='failed', updated_at=NOW()
    WHERE id=? AND tenant_id=?
  `, [workflowId, tenantId]);

});

/* --------------------------------------------------
   Export
-------------------------------------------------- */

module.exports = worker;