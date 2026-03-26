const { v4: uuidv4 } = require("uuid");

const { getBestMemory } = require("@wraply/shared/db/agentMemory");
const { evaluateGoal } = require("./evaluator");

async function runAgentLoop({
  goal,
  planner,
  executeWorkflow,
  context = {},
  tenantId,
  userId,
  maxIterations = 5
}) {

  if (!tenantId) {
    throw new Error("tenantId required");
  }

  /* 🔥 핵심: jobId 한 번만 생성 */

  const jobId = uuidv4();

  let iteration = 0;

  let currentContext = {
    ...context
  };

  while (iteration < maxIterations) {

    console.log(`\n[agent] iteration: ${iteration}`);

    /* ---------------- PLAN ---------------- */

    const memory = await getBestMemory({
      tenantId,
      key: "marketing"
    });

    const steps = await planner({
      goal,
      context: currentContext,
      memory
    });

    console.log("[agent] plan:", steps);

    if (!steps || steps.length === 0) {
      break;
    }

    /* ---------------- EXECUTE ---------------- */

    const result = await executeWorkflow({
      workflow: steps,
      tenantId,
      userId,
      context: currentContext,
      jobId   // 🔥 runId → jobId
    });

    if (!result.success) {
      console.error("[agent] execution failed");
      break;
    }

    currentContext = result.context;

    /* ---------------- EVALUATE ---------------- */

    const decision = await evaluateGoal({
      goal,
      context: currentContext
    });

    if (decision === "DONE") {
      console.log("[agent] goal achieved");
      break;
    }

    if (decision === "REPLAN") {
      console.log("[agent] replanning...");
      iteration++;
      continue;
    }

    if (currentContext.lastResult && iteration > 0) {
      console.log("[agent] enough result, stopping");
      break;
    }

    iteration++;
  }

  return {
    jobId,          // 🔥 프론트로 전달 가능
    context: currentContext
  };

}

module.exports = {
  runAgentLoop
};