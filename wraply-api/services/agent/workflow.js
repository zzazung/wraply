// wraply-api/services/agent/workflow.js

const { Queue, QueueEvents } = require("bullmq");
const { v4: uuidv4 } = require("uuid");

const redis = require("@wraply/shared/redis");

const { TASK_SCHEMA } = require("@wraply/shared/lib/agent/taskSchema");
const { pickContext } = require("./context");

const {
  createAgentRun,
  finishAgentRun,
  saveAgentStep,
  saveAgentMemory
} = require("@wraply/shared/db/agentMemory");

const {
  calculateScore,
  shouldStore
} = require("./memoryService");

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

function validateEvent(event){

  if (!event.jobId){
    throw new Error("Invalid event: jobId required");
  }

  if (!event.type){
    throw new Error("Invalid event: type required");
  }

}

function publishEvent(event) {

  console.log('[workflow]', event);

  try {

    validateEvent(event);

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

async function runStep({ step, tenantId, context, jobId }) {

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
  userId,
  context = {},
  jobId
}) {

  await ensureQueueEventsReady();

  if (!tenantId) {
    throw new Error("tenantId required in workflow");
  }

  if (!Array.isArray(workflow)) {
    throw new Error("Invalid workflow");
  }

  const results = [];

  let currentContext = {
    ...context,
    history: []
  };

  /* --------------------------------------------------
     🔥 jobId 생성 (단 한 번)
  -------------------------------------------------- */

  const finalJobId = jobId || uuidv4();

  /* --------------------------------------------------
     🔥 RUN 생성 (DB)
  -------------------------------------------------- */

  await createAgentRun({
    jobId: finalJobId,
    tenantId,
    userId,
    goal: context?.goal || ""
  });

  try {

    for (const step of workflow) {

      console.log(`[workflow] ▶ step: ${step.task}`);

      if (!shouldRunStep(step, currentContext)) {
        console.log("[workflow] skip:", step.task);
        continue;
      }

      const filteredContext = pickContext(step.task, currentContext);

      publishEvent({
        type: "agent_event",
        event: "STEP_START",
        tenantId,
        jobId: finalJobId,
        step: step.task,
        context: filteredContext
      });

      const job = await runStepWithRetry(() =>
        runStep({
          step,
          tenantId,
          context: filteredContext,
          jobId: finalJobId
        })
      );

      const result = await waitStepResult(job);

      if (!result.success) {

        publishEvent({
          type: "agent_event",
          event: "STEP_FAILED",
          tenantId,
          jobId: finalJobId,
          step: step.task,
          error: result.error
        });

        await finishAgentRun({
          jobId: finalJobId,
          tenantId,
          status: "failed"
        });

        return {
          success: false,
          failedStep: step.task,
          results,
          context: currentContext
        };

      }

      /* -------------------------
         Context 업데이트
      ------------------------- */

      currentContext = mergeContext(
        currentContext,
        step,
        result
      );

      /* -------------------------
         Step 저장
      ------------------------- */

      await saveAgentStep({
        jobId: finalJobId,
        tenantId,
        step: step.task,
        input: filteredContext,
        output: result.output ?? {}
      });

      /* -------------------------
          🔥 Memory Ranking 적용
      ------------------------- */

      const keysToSave = [
        "content",
        "marketing",
        "adsResult",
        "slackResult"
      ];

      for (const key of keysToSave) {

        const value = currentContext[key];

        if (value === undefined) continue;

        // 🔥 score 계산
        const score = calculateScore({
          output: value,
          success: result.success
        });

        console.log("[memory] score:", key, score);

        if (!shouldStore(score)) continue;

        // 🔥 저장
        await saveAgentMemory({
          jobId: finalJobId,
          tenantId,
          key,
          value,
          score,
          success: result.success
        });

        console.log("[memory] saved:", key);

      }

      results.push({
        step: step.task,
        jobId: finalJobId,
        output: result.output
      });

      publishEvent({
        type: "agent_event",
        event: "STEP_DONE",
        tenantId,
        jobId: finalJobId,
        step: step.task,
        output: result.output
      });

      console.log("[workflow] context updated:", currentContext);

    }

    /* -------------------------
       완료
    ------------------------- */

    await finishAgentRun({
      jobId: finalJobId,
      tenantId,
      status: "done"
    });

    return {
      success: true,
      results,
      context: currentContext,
      jobId: finalJobId
    };

  } catch (err) {

    console.error("[workflow] fatal error:", err);

    await finishAgentRun({
      jobId: finalJobId,
      tenantId,
      status: "failed"
    });

    throw err;

  }

}

/* --------------------------------------------------
   export
-------------------------------------------------- */

module.exports = {
  executeWorkflow
};