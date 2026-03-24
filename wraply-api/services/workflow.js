// wraply-api/services/workflow.js

const { Queue } = require("bullmq");
const { v4: uuidv4 } = require("uuid");

const connection = {
  host: "127.0.0.1",
  port: 6379
};

const queue = new Queue("ai-queue", { connection });

/**
 * 🔥 단일 step 실행 (job enqueue 역할)
 * 실제로는 queue (BullMQ) 연결하면 됨
 */
async function runStep({ step, tenantId, context }) {

  const jobId = `job_${uuidv4()}`;

  console.log("[workflow] runStep:", {
    jobId,
    task: step.task
  });

  // TODO: 실제 queue 연결
  // await queue.add("ai", { jobId, task: step.task, context })

  const job = await queue.add("ai-task", {
    jobId,
    task: step.task,
    payload: context
  });

  return {
    jobId,
    bullJobId: job.id,
    task: step.task
  };

}

/**
 * 🔥 step 실행 결과 처리
 */
async function waitStepResult(job) {

  const { QueueEvents } = require("bullmq");

  const queueEvents = new QueueEvents("ai-queue", {
    connection: { host: "127.0.0.1", port: 6379 }
  });

  return new Promise((resolve) => {

    queueEvents.on("completed", ({ jobId, returnvalue }) => {

      if (jobId == job.bullJobId) {

        resolve({
          success: true,
          output: returnvalue
        });

      }

    });

    queueEvents.on("failed", ({ jobId }) => {

      if (jobId == job.bullJobId) {

        resolve({
          success: false
        });

      }

    });

  });

}

/**
 * 🔥 workflow 실행 (순차 실행)
 */
async function executeWorkflow({
  workflow,
  tenantId,
  context = {}
}) {

  if (!Array.isArray(workflow)) {
    throw new Error("Invalid workflow");
  }

  const results = [];

  for (const step of workflow) {

    console.log(`[workflow] ▶ step: ${step.task}`);

    // 1️⃣ 실행
    const job = await runStep({
      step,
      tenantId,
      context
    });

    // 2️⃣ 결과 대기
    const result = await waitStepResult(job);

    // 3️⃣ 실패 처리
    if (!result.success) {

      console.error("[workflow] step failed:", step.task);

      return {
        success: false,
        failedStep: step.task,
        results
      };

    }

    // 4️⃣ 결과 누적
    results.push({
      step: step.task,
      jobId: job.jobId,
      output: result.output
    });

  }

  return {
    success: true,
    results
  };

}

/**
 * 🔥 병렬 실행 (확장용)
 */
async function executeParallel(steps, options) {

  return Promise.all(
    steps.map(step =>
      runStep({ step, ...options })
    )
  );

}

/**
 * 🔥 조건 분기 (확장용)
 */
function shouldRun(conditionFn, context) {

  try {
    return conditionFn(context);
  } catch (err) {
    return false;
  }

}

/**
 * 🔥 export
 */
module.exports = {
  executeWorkflow,
  executeParallel,
  runStep,
  waitStepResult,
  shouldRun
};