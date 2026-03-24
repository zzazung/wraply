// wraply-api/services/agent/workflow.js

const { Queue, QueueEvents } = require("bullmq");
const { v4: uuidv4 } = require("uuid");

const redis = require("@wraply/shared/redis");

const { TASK_SCHEMA } = require("@wraply/shared/lib/agent/taskSchema");
const { pickContext } = require("./context");

const {
  saveAgentStep,
  createAgentRun,
  finishAgentRun,
  saveAgentMemory
} = require("@wraply/shared/db/agentMemory");

const {
  AI_QUEUE,
  AGENT_EVENT_CHANNEL
} = require("@wraply/shared/constants/queues");

/* --------------------------------------------------
   Queue
-------------------------------------------------- */

const queue = new Queue(AI_QUEUE, {
  connection: redis
});

const queueEvents = new QueueEvents(AI_QUEUE, {
  connection: redis
});

let isReady = false;

async function ensureQueueEventsReady() {

  if (!isReady) {

    await queueEvents.waitUntilReady();
    isReady = true;

    console.log("[workflow] queueEvents ready");

  }

}

/* --------------------------------------------------
   Event Publisher
-------------------------------------------------- */

function publishEvent(event) {

  try {

    redis.publish(
      AGENT_EVENT_CHANNEL,
      JSON.stringify(event)
    );

  } catch (err) {

    console.error("[workflow] publish error", err);

  }

}

/* --------------------------------------------------
   조건 분기
-------------------------------------------------- */

function shouldRunStep(step, context) {

  if (!step.if) return true;

  if (step.if === "has_content") {
    return !!context.content || !!context.lastResult;
  }

  return true;

}

/* --------------------------------------------------
   Retry
-------------------------------------------------- */

async function runStepWithRetry(fn, retries = 2) {

  let attempt = 0;

  while (attempt <= retries) {

    try {
      return await fn();
    } catch (err) {

      console.warn("[workflow] retry:", attempt);

      attempt++;

      if (attempt > retries) throw err;

    }

  }

}

/* --------------------------------------------------
   Step 실행
-------------------------------------------------- */

async function runStep({ step, tenantId, context }) {

  const jobId = uuidv4();

  console.log("[workflow] runStep:", {
    jobId,
    task: step.task
  });

  const job = await queue.add("ai-task", {
    jobId,
    task: step.task,
    payload: context,
    tenantId
  }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  });

  return {
    jobId,
    bullJobId: job.id,
    task: step.task
  };

}

/* --------------------------------------------------
   결과 대기
-------------------------------------------------- */

async function waitStepResult(job) {

  return new Promise((resolve) => {

    const TIMEOUT = 30000;

    const onCompleted = ({ jobId, returnvalue }) => {

      if (jobId == job.bullJobId) {

        cleanup();

        resolve({
          success: true,
          output: returnvalue?.output ?? returnvalue
        });

      }

    };

    const onFailed = ({ jobId, failedReason }) => {

      if (jobId == job.bullJobId) {

        cleanup();

        resolve({
          success: false,
          error: failedReason
        });

      }

    };

    const timeout = setTimeout(() => {

      console.error("[workflow] timeout:", job.task);

      cleanup();

      resolve({
        success: false,
        timeout: true
      });

    }, TIMEOUT);

    function cleanup() {

      clearTimeout(timeout);

      queueEvents.off("completed", onCompleted);
      queueEvents.off("failed", onFailed);

    }

    queueEvents.on("completed", onCompleted);
    queueEvents.on("failed", onFailed);

  });

}

/* --------------------------------------------------
   Context Merge
-------------------------------------------------- */

function mergeContext(currentContext, step, result) {

  const schema = TASK_SCHEMA[step.task];

  const nextContext = {
    ...currentContext,

    lastResult: result.output,

    history: [
      ...(currentContext.history || []),
      {
        step: step.task,
        output: result.output
      }
    ]
  };

  if (schema?.output) {
    nextContext[schema.output] = result.output;
  }

  nextContext[`${step.task}_result`] = result.output;

  return nextContext;

}

/* --------------------------------------------------
   Workflow 실행
-------------------------------------------------- */

async function executeWorkflow({
  workflow,
  tenantId,
  context = {},
  runId
}) {

  await ensureQueueEventsReady();

  if (!Array.isArray(workflow)) {
    throw new Error("Invalid workflow");
  }

  const results = [];

  let currentContext = {
    ...context,
    history: []
  };

  /* 🔥 RUN 생성 (1번만) */

  if (runId) {

    await createAgentRun({
      runId,
      tenantId,
      goal: context?.goal || ""
    });

  }

  try {

    for (const step of workflow) {

      console.log(`[workflow] ▶ step: ${step.task}`);

      if (!shouldRunStep(step, currentContext)) {
        console.log("[workflow] skip:", step.task);
        continue;
      }

      const filteredContext = pickContext(step.task, currentContext);

      /* STEP START */

      publishEvent({
        type: "STEP_START",
        tenantId,
        runId,
        step: step.task,
        context: filteredContext
      });

      const job = await runStepWithRetry(() =>
        runStep({
          step,
          tenantId,
          context: filteredContext
        })
      );

      const result = await waitStepResult(job);

      if (!result.success) {

        publishEvent({
          type: "STEP_FAILED",
          tenantId,
          runId,
          step: step.task,
          error: result.error
        });

        if (runId) {
          await finishAgentRun({
            runId,
            status: "failed"
          });
        }

        return {
          success: false,
          failedStep: step.task,
          results,
          context: currentContext
        };

      }

      /* 🔥 Context 먼저 업데이트 */

      currentContext = mergeContext(
        currentContext,
        step,
        result
      );

      /* 🔥 DB 저장 */

      if (runId) {

        await saveAgentStep({
          runId,
          tenantId,
          step: step.task,
          input: filteredContext,
          output: result.output
        });

        const keysToSave = [
          "content",
          "marketing",
          "adsResult",
          "slackResult"
        ];

        for (const key of keysToSave) {

          if (currentContext[key] !== undefined) {

            await saveAgentMemory({
              runId,
              tenantId,
              key,
              value: currentContext[key]
            });

          }

        }

      }

      results.push({
        step: step.task,
        jobId: job.jobId,
        output: result.output
      });

      /* STEP DONE */

      publishEvent({
        type: "STEP_DONE",
        tenantId,
        runId,
        step: step.task,
        output: result.output
      });

      console.log("[workflow] context updated:", currentContext);

    }

    /* 🔥 RUN 종료 */

    if (runId) {

      await finishAgentRun({
        runId,
        status: "done"
      });

    }

    return {
      success: true,
      results,
      context: currentContext
    };

  } catch (err) {

    console.error("[workflow] fatal error:", err);

    if (runId) {
      await finishAgentRun({
        runId,
        status: "failed"
      });
    }

    throw err;

  }

}

/* --------------------------------------------------
   export
-------------------------------------------------- */

module.exports = {
  executeWorkflow
};