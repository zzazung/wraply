// wraply-worker/processor.js

const { query } = require("@wraply/shared/db");
const { enqueueStep } = require("wraply-api/services/workflowQueue");

async function processJob(job){

  const { jobId, workflowId, stepIndex, target } = job.data;

  try{

    await runTarget(target, job.data);

    await query(`
      UPDATE jobs SET status='done'
      WHERE job_id=?
    `,[jobId]);

    await query(`
      UPDATE workflow_steps
      SET status='done'
      WHERE workflow_id=? AND step_index=?
    `,[workflowId, stepIndex]);

    await enqueueStep({
      workflowId,
      stepIndex: stepIndex + 1
    });

  }catch(err){

    await query(`
      UPDATE workflow_runs
      SET status='failed'
      WHERE id=?
    `,[workflowId]);

    throw err;

  }

}