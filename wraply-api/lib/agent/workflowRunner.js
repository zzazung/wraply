// wraply-api/lib/agent/workflowRunner.js

const { runTask } = require("./executor");

async function runWorkflow({ jobId, workflow, initialContext = {} }){

  let context = { ...initialContext };

  for (const step of workflow){

    console.log("[workflow] ▶ step:", step.task);

    step.status = "running";

    try {

      const result = await runTask({
        jobId,
        step,
        context
      });

      step.status = "done";
      step.result = result;

      // 👉 결과를 context에 누적
      context[step.task] = result;

    } catch (err){

      console.error("[workflow] failed:", step.task, err.message);

      step.status = "failed";
      step.error = err.message;

      break;
    }

  }

  return {
    workflow,
    context
  };
}

module.exports = {
  runWorkflow
};