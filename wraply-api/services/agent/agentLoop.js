const { evaluateGoal } = require("./evaluator");

async function runAgentLoop({
  goal,
  planner,
  executeWorkflow,
  context = {},
  tenantId,
  maxIterations = 5
}) {

  let iteration = 0;

  let currentContext = {
    ...context
  };

  while (iteration < maxIterations) {

    console.log(`\n[agent] iteration: ${iteration}`);

    /* ---------------- PLAN ---------------- */

    const steps = await planner({
      goal,
      context: currentContext
    });

    console.log("[agent] plan:", steps);

    if (!steps || steps.length === 0) {
      break;
    }

    /* ---------------- EXECUTE ---------------- */

    const result = await executeWorkflow({
      workflow: steps,
      tenantId,
      context: currentContext,
      runId: `run_${Date.now()}`
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

    // CONTINUE
    iteration++;
  }

  return currentContext;

}

module.exports = {
  runAgentLoop
};